import _ from 'lodash';
import { EventEmitter } from 'events';
import { is, fromJS } from 'immutable';

import house from './house.json';

export function getInitialState() {
  return fromJS(house);
}

export function getCharacterLocation(state, character) {
  const entry = state.findEntry(room => room.get('presence').includes(character));
  return _.isUndefined(entry) ? 'outside' : entry[0];
}

export default class Store extends EventEmitter {
  constructor() {
    super();
    this.state = getInitialState();
  }
  onLightUpdate(location, lightState) {
    let nextState = this.state.mergeIn([location, 'light'], fromJS(lightState));
    if (this.state.getIn([location, 'light', 'color']) !== nextState.getIn([location, 'light', 'color'])) {
      this.emit('update_light_color', nextState, location, lightState.color);
    }
    if (this.state.getIn([location, 'light', 'brightness']) !== nextState.getIn([location, 'light', 'brightness'])) {
      this.emit('update_light_brightness', nextState, location, lightState.brightness);
    }
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.state = nextState;
    }
  }
  setLocationLightColor(location, color) {
    color = color.toLowerCase();
    const currentLightState = this.state.getIn([location, 'light']).toJSON();
    if (color !== currentLightState.color) {
      console.log(`Setting ${location} light color to ${color}.`);
      this.onLightUpdate(location, {
        color: color
      });
    }
  }
  setLocationLightBrightness(location, brightness) {
    brightness = parseFloat(brightness);
    const currentLightState = this.state.getIn([location, 'light']).toJSON();
    if (brightness !== currentLightState.brightness) {
      console.log(`Setting ${location} light brightness to ${brightness}.`);
      this.onLightUpdate(location, {
        brightness: brightness
      });
    }
  }
  onTvUpdate(location, tvState) {
    let nextState = this.state.setIn([location, 'tv'], tvState);
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.emit('update_tv_state', nextState, location, tvState);
      this.state = nextState;
    }
  }
  setTvState(val) {
    const currentTvState = this.state.getIn(['living_room', 'tv']);
    if (val !== currentTvState) {
      console.log(`Turning ${val ? 'ON' : 'OFF'} the TV.`);
      this.onTvUpdate('living_room', val);
    }
  }
  onPresenceUpdate(location, presenceState) {
    const nextState = this.state.setIn([location, 'presence'], fromJS(presenceState));
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.emit('update_presence', nextState, location, nextState.getIn([location, 'presence']));
      this.state = nextState;
    }
  }
  setCharacterLocation(character, location) {
    const originLocation = getCharacterLocation(this.state, character);
    if (originLocation !== location) {
      console.log(`Moving the ${character} to ${location} from ${originLocation}.`);

      const destinationPresenceState = this.state.getIn([location, 'presence']).push(character).sort().toJSON();
      this.onPresenceUpdate(location, destinationPresenceState);

      const originPresenceState = this.state.getIn([originLocation, 'presence']).filterNot(c => c === character).toJSON();
      this.onPresenceUpdate(originLocation, originPresenceState);
    }
  }
  onLightSensorUpdate(location, lightSensorState) {
    let nextState = this.state.setIn([location, 'lightIntensity'], lightSensorState);
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.emit('update_light_intensity', nextState, location, lightSensorState);
      this.state = nextState;
    }
  }
  setOutsideLightIntensity(intensity) {
    const currentLightIntensity = this.state.getIn(['outside', 'lightIntensity']);
    if (intensity != currentLightIntensity) {
      console.log(`Setting the outside light intensity to ${intensity}.`);
      this.onLightSensorUpdate('outside', intensity);
    }
  }
  setAgentsId(location, colorAgent, brightnessAgent, colorAgentUrl, brightnessAgentUrl) {
    const nextState = this.state
      .updateIn([location, 'agent', 'color'], () => colorAgent)
      .updateIn([location, 'agent', 'colorUrl'], () => colorAgentUrl)
      .updateIn([location, 'agent', 'brightness'], () => brightnessAgent)
      .updateIn([location, 'agent', 'brightnessUrl'], () => brightnessAgentUrl);
    if (!is(nextState, this.state)) {
      console.log(`Setting the agent name for ${location} to '${colorAgent}' (color) and '${brightnessAgent}' (bright).`);
      this.emit('update', nextState);
      this.emit('update_agents', nextState, location, colorAgent, brightnessAgent);
      this.state = nextState;
    }
  }
  getState() {
    return this.state;
  }
}
