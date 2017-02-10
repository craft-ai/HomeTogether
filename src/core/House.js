import _ from 'lodash';
import { Record, fromJS } from 'immutable';

import INITIAL_HOUSE from './house.json';

export default class House extends Record(_.mapValues(INITIAL_HOUSE, location => fromJS(location))) {
  getCharacterLocation(character) {
    const entry = this.findEntry(room => room.get('presence').includes(character));
    return _.isUndefined(entry) ? 'outside' : entry[0];
  }
  setCharacterLocation(character, location) {
    const originLocation = this.getCharacterLocation(character);
    if (originLocation !== location) {
      return this
      .updateIn([location, 'presence'], presence => presence.push(character).sort())
      .updateIn([originLocation, 'presence'], presence => presence.filterNot(c => c === character));
    }
    else {
      return this;
    }
  }
  setOutsideLightIntensity(intensity) {
    return this.setIn(['outside', 'lightIntensity'], intensity);
  }
  setLocationLightColor(location, color) {
    color = color.toLowerCase();
    return this.setIn([location, 'light', 'color'], color);
  }
  setLocationLightBrightness(location, brightness) {
    brightness = parseFloat(brightness);
    return this.setIn([location, 'light', 'brightness'], brightness);
  }
  setTvState(state) {
    return this.setIn(['living_room', 'tv'], state);
  }
}
