import _ from 'lodash';
import { CRAFT_TOKEN, CRAFT_URL, CRAFT_OWNER } from '../constants';
import craftai from 'craft-ai';
import Rx from 'rxjs/Rx';
import { is, Map } from 'immutable';
import House from './House';

let agentsToDeleteOnExit = [];

export function getAgentsToDeleteOnExit() {
  return agentsToDeleteOnExit;
}

const INITIAL_BRIGHTNESS_HISTORY_FROM_LOCATION = {
  'living_room': require('./tvInitialBrightnessHistory.json'),
  'dining_room': require('./initialBrightnessHistory.json'),
  'corridor': require('./initialBrightnessHistory.json'),
  'bathroom': require('./initialBrightnessHistory.json'),
  'water_closet': require('./initialBrightnessHistory.json'),
  'bedroom': require('./initialBrightnessHistory.json')
};

const INITIAL_COLOR_HISTORY_FROM_LOCATION = {
  'living_room': require('./tvInitialColorHistory.json'),
  'dining_room': require('./initialColorHistory.json'),
  'corridor': require('./initialColorHistory.json'),
  'bathroom': require('./initialColorHistory.json'),
  'water_closet': require('./initialColorHistory.json'),
  'bedroom': require('./initialColorHistory.json')
};

const BRIGHTNESS_CFG_FROM_LOCATION = {
  'living_room': require('./tvBrightnessAgentConfiguration.json'),
  'dining_room': require('./brightnessAgentConfiguration.json'),
  'corridor': require('./brightnessAgentConfiguration.json'),
  'bathroom': require('./brightnessAgentConfiguration.json'),
  'water_closet': require('./brightnessAgentConfiguration.json'),
  'bedroom': require('./brightnessAgentConfiguration.json')
};

const COLOR_CFG_FROM_LOCATION = {
  'living_room': require('./tvColorAgentConfiguration.json'),
  'dining_room': require('./colorAgentConfiguration.json'),
  'corridor': require('./colorAgentConfiguration.json'),
  'bathroom': require('./colorAgentConfiguration.json'),
  'water_closet': require('./colorAgentConfiguration.json'),
  'bedroom': require('./colorAgentConfiguration.json')
};

function timestamp() {
  return Math.floor(Date.now()/1000);
}

function strFromPresence(presence) {
  if (presence.size === 0) {
    return 'none';
  }
  else {
    return presence.sort().join('+');
  }
}

function strFromTvState(state) {
  return _.isUndefined(state) ? undefined : (state ? 'on' : 'off');
}

function createAutomationSubject(craftaiClient) {
  // The subject
  const subject = new Rx.Subject();

  // Create the agents, and send the house updater
  const initialHouse = new House();
  const initialTimestamp = timestamp();
  const enlightenedLocations = initialHouse.toMap()
  .filter(location => location.has('light')).keySeq().toJSON();
  Promise.all(_.map(enlightenedLocations, location => Promise.all(_.map(
    [
      {
        id: `home_together_${location}_brightness`,
        cfg: BRIGHTNESS_CFG_FROM_LOCATION[location],
        history: INITIAL_BRIGHTNESS_HISTORY_FROM_LOCATION[location]
      },
      {
        id: `home_together_${location}_color`,
        cfg: COLOR_CFG_FROM_LOCATION[location],
        history: INITIAL_COLOR_HISTORY_FROM_LOCATION[location]
      }
    ],
    ({id, cfg, history}) =>
      craftaiClient.deleteAgent(id)
      .then(() => craftaiClient.createAgent(cfg, id))
      .then(() => craftaiClient.addAgentContextOperations(id, _.map(history,
        sample => ({
          ...sample,
          timestamp: initialTimestamp + sample.timestamp
        })
      )))
      .then(() => craftaiClient.getAgentInspectorUrl(id))
      .then(url => ({
        agentId: id,
        inspectorUrl: url
      }))
    ))
    .then(([brightnessAgent, colorAgent]) => {
      subject.next(home => home
        .setIn([location, 'agents', 'brightness'], new Map({
          agentId: brightnessAgent.agentId,
          inspectorUrl: brightnessAgent.inspectorUrl
        }))
        .setIn([location, 'agents', 'color'], new Map({
          agentId: colorAgent.agentId,
          inspectorUrl: colorAgent.inspectorUrl
        }))
      );
    })
  ))
  .catch(err => console.log('Error while creating the craft ai agents', err));

  return subject;
}

function createAutomationObserver(craftaiClient, automationSubject) {
  const observer = new Rx.BehaviorSubject(new House());

  // Extract the agent diffs from the house observer
  const diffObservable = observer
  .sampleTime(1000) // At most one update every second
  .map(house => house.toMap()) // Converting from a record to a map
  .scan(({ house, diff }, newHouse) => ({
    timestamp: timestamp(),
    house: newHouse,
    diff: newHouse
      .filterNot((locationNewState, location) => is(locationNewState,  house.get(location)))
      .map((locationDiff, location) => locationDiff.filterNot((value, key) => is(value, house.getIn([location, key]))))
  }), {
    house: new Map(),
    diff: new Map()
  })
  .concatMap(({ timestamp, house, diff }) => Rx.Observable.create(o => {
    const lightIntensity = diff.getIn(['outside', 'lightIntensity']);
    house
    .filter((locationState, location) => house.getIn([location, 'agents']))
    .forEach((locationState, location) => {
      const rawPresence = diff.getIn([location, 'presence']);
      const presence = _.isUndefined(rawPresence) ? undefined : strFromPresence(rawPresence);

      const rawTv = diff.getIn([location, 'tv']);
      const tv = _.isUndefined(rawTv) ? undefined : strFromTvState(rawTv);

      const rawLightbulbBrightness = diff.getIn([location, 'light', 'brightness']);
      const lightbulbBrightness = _.isUndefined(rawLightbulbBrightness) ? undefined : `${rawLightbulbBrightness}`

      const lightbulbColor = diff.getIn([location, 'light', 'color']);

      const colorDiff = _.pickBy({ presence, tv, lightIntensity, lightbulbColor }, v => v !== undefined);
      const colorDiffSize = _.size(colorDiff);

      const brightnessDiff = _.pickBy({ presence, tv, lightIntensity, lightbulbBrightness }, v => v !== undefined);
      const brightnessDiffSize = _.size(brightnessDiff);

      if (colorDiffSize || brightnessDiffSize) {
        o.next({
          timestamp,
          house,
          location,
          colorDiff: colorDiffSize > 0 ? colorDiff : undefined,
          brightnessDiff: brightnessDiffSize > 0 ? brightnessDiff : undefined
        });
      }
    });

    o.complete();
  }))
  .multicast(new Rx.Subject());

  // Send the diffs to craft ai
  diffObservable
  .subscribe(({ timestamp, house, location, colorDiff, brightnessDiff }) => {
    if (colorDiff) {
      const colorAgent = house.getIn([location, 'agents', 'color', 'agentId']);
      craftaiClient.addAgentContextOperations(colorAgent, {
          timestamp,
          diff: colorDiff
        },
        true
      )
      .catch(e => console.error(`Error while sending a context operation to the color agent '${colorAgent}' of room '${location}'!`, e));
    }

    if (brightnessDiff) {
      const brightnessAgent = house.getIn([location, 'agents', 'brightness', 'agentId']);
      craftaiClient.addAgentContextOperations(brightnessAgent, {
          timestamp,
          diff: brightnessDiff
        },
        true
      )
      .catch(e => console.error(`Error while sending a context operation to the brightness agent '${brightnessAgent}' of room '${location}'!`, e));
    }
  });

  // Take a decision when something changes
  diffObservable
  .subscribe(({ timestamp, house, location, colorDiff, brightnessDiff }) => {
    const lightIntensity = house.getIn(['outside', 'lightIntensity']);
    const presence = strFromPresence(house.getIn([location, 'presence']));
    const tv = strFromTvState(house.getIn([location, 'tv']));

    if (colorDiff && !colorDiff.lightbulbColor ) {
      console.log(`Taking a decision for the color of '${location}' at '${timestamp}'`);
      const agentId = house.getIn([location, 'agents', 'color', 'agentId']);
      craftaiClient.computeAgentDecision(agentId, timestamp, { lightIntensity, tv, presence })
      .then(decision => {
        automationSubject.next(house => house.setIn([location, 'light', 'color'], decision.decision.lightbulbColor));
      })
      .catch(e => console.error(`Error while taking a decision for the color agent '${agentId}' of room '${location}'!`, e));
    }
    if (brightnessDiff && !brightnessDiff.lightbulbBrightness ) {
      console.log(`Taking a decision for the brightness of '${location}' at '${timestamp}'`);
      const agentId = house.getIn([location, 'agents', 'brightness', 'agentId']);
      craftaiClient.computeAgentDecision(agentId, timestamp, { lightIntensity, tv, presence })
      .then(decision => {
        automationSubject.next(house => house.setIn([location, 'light', 'brightness'], parseFloat(decision.decision.lightbulbBrightness)));
      })
      .catch(e => console.error(`Error while taking a decision for the color agent '${agentId}' of room '${location}'!`, e));
    }
  });

  diffObservable.connect();

  return observer;
}

export default function createAutomation() {
  const client = craftai({
    owner: CRAFT_OWNER,
    token: CRAFT_TOKEN,
    url: CRAFT_URL,
    operationsAdditionWait: 3 // Flush every 3 seconds, facilitates the demo!
  });

  const subject = createAutomationSubject(client);

  const observer = createAutomationObserver(client, subject);

  // Return everything !
  return {
    observer: observer,
    observable: subject
  };
}
