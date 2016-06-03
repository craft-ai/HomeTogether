import craftai from 'craft-ai';
import _ from 'lodash';
import { CRAFT_TOKEN, CRAFT_URL, CRAFT_OWNER } from '../constants';

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

const BRIGHTNESS_MODEL_FROM_LOCATION = {
  'living_room': require('./tvBrightnessModel.json'),
  'dining_room': require('./brightnessModel.json'),
  'corridor': require('./brightnessModel.json'),
  'bathroom': require('./brightnessModel.json'),
  'water_closet': require('./brightnessModel.json'),
  'bedroom': require('./brightnessModel.json')
};

const COLOR_MODEL_FROM_LOCATION = {
  'living_room': require('./tvColorModel.json'),
  'dining_room': require('./colorModel.json'),
  'corridor': require('./colorModel.json'),
  'bathroom': require('./colorModel.json'),
  'water_closet': require('./colorModel.json'),
  'bedroom': require('./colorModel.json')
};

function timestamp() {
  return Math.floor(Date.now()/1000);
}

function strFromPresence(presence) {
  if (presence.size == 0) {
    return 'none';
  }
  else {
    return presence.sort().join('+');
  }
}

function strFromTvState(state) {
  return _.isUndefined(state) ? undefined : (state ? 'on' : 'off');
}

export default function startAutomation(store) {
  let client = craftai({
    owner: CRAFT_OWNER,
    token: CRAFT_TOKEN,
    url: CRAFT_URL,
    operationsAdditionWait: 3 // Flush every 3 seconds, facilitate the demo!
  });

  // Extract the room having a light
  const enlightenedRooms = store.getState().filter(location => location.has('light')).keySeq();
  const initialTimestamp = timestamp();
  let agents = enlightenedRooms.reduce((agents, roomName) => {
    agents[roomName] = {
      brightness: null,
      color: null
    };
    return agents;
  },
  {});

  let createAgents = () => Promise.all(
    enlightenedRooms.map((roomName) =>
      client.createAgent(BRIGHTNESS_MODEL_FROM_LOCATION[roomName], undefined, true)
      .then(agent => {
        console.log(`Agent ${agent.id} created for ${roomName} brightness`);
        agents[roomName].brightness = agent.id;
        return client.addAgentContextOperations(agents[roomName].brightness, _.map(
          INITIAL_BRIGHTNESS_HISTORY_FROM_LOCATION[roomName],
          sample => _.set(_.clone(sample), 'timestamp', initialTimestamp + sample.timestamp)
        ));
      })
      .then(() => client.createAgent(COLOR_MODEL_FROM_LOCATION[roomName], undefined, true))
      .then(agent => {
        console.log(`Agent ${agent.id} created for ${roomName} color`);
        agents[roomName].color = agent.id;
        return client.addAgentContextOperations(agents[roomName].color, _.map(
          INITIAL_COLOR_HISTORY_FROM_LOCATION[roomName],
          sample => _.set(_.clone(sample), 'timestamp', initialTimestamp + sample.timestamp)
        ));
      })
      .then(() => {
        // Providing the agent ids to the store.
        store.setAgentsId(roomName, agents[roomName].color, agents[roomName].brightness);
      })
      .catch(err => console.log(`Error while creating agent for ${roomName}`, err))
    ).toJSON()
  );

  let takeDecisions = (state, rooms) => {
    console.log(`Taking a decision for rooms ${rooms.join(', ')}...`);
    return Promise.all(_.map(rooms, (roomName) =>
      Promise.all([
        client.computeAgentDecision(agents[roomName].brightness, timestamp(), {
          presence: strFromPresence(state.getIn([roomName, 'presence'])),
          tv: strFromTvState(state.getIn([roomName, 'tv'])),
          lightIntensity: state.getIn(['outside', 'lightIntensity'])
        }),
        client.computeAgentDecision(agents[roomName].color, timestamp(), {
          presence: strFromPresence(state.getIn([roomName, 'presence'])),
          tv: strFromTvState(state.getIn([roomName, 'tv'])),
          lightIntensity: state.getIn(['outside', 'lightIntensity'])
        }, timestamp())
      ])
      .then(([brightnessDecision, colorDecision]) => {
        store.setLocationLightBrightness(roomName, brightnessDecision.decision.lightbulbBrightness);
        store.setLocationLightColor(roomName, colorDecision.decision.lightbulbColor);
      })
      .catch(err => console.log(`Error while taking decision for ${roomName}`, err))
    ));
  };

  // Let's create the agents
  return createAgents()
  .then(() => {
    console.log('Learning initialization done!');
    takeDecisions(store.getState(), enlightenedRooms.toJSON());
    store.on('update_light_color', (state, location, color) => {
      if (_.has(agents, location)) {
        client.addAgentContextOperations(agents[location].color, {
          timestamp: timestamp(),
          diff: {
            lightbulbColor: color
          }
        })
        .catch(err => console.log('Error while updating the context history', err));
      }
    });
    store.on('update_light_brightness', (state, location, brightness) => {
      if (_.has(agents, location)) {
        client.addAgentContextOperations(agents[location].brightness, {
          timestamp: timestamp(),
          diff: {
            lightbulbBrightness: `${brightness}`
          }
        })
        .catch(err => console.log('Error while updating the context history', err));
      }
    });
    store.on('update_tv_state', (state, location, tvState) => {
      if (_.has(agents, location)) {
        return Promise.all([
          client.addAgentContextOperations(agents[location].brightness, {
            timestamp: timestamp(),
            diff: {
              tv: strFromTvState(tvState)
            }
          }),
          client.addAgentContextOperations(agents[location].color, {
            timestamp: timestamp(),
            diff: {
              tv: strFromTvState(tvState)
            }
          })
        ])
        .then(() => takeDecisions(state, [location]))
        .catch(err => console.log('Error while updating the context history', err));
      }
    });
    store.on('update_presence', (state, location, presence) => {
      if (_.has(agents, location)) {
        return Promise.all([
          client.addAgentContextOperations(agents[location].brightness, {
            timestamp: timestamp(),
            diff: {
              presence: strFromPresence(presence)
            }
          }),
          client.addAgentContextOperations(agents[location].color, {
            timestamp: timestamp(),
            diff: {
              presence: strFromPresence(presence)
            }
          })
        ])
        .then(() => takeDecisions(state, [location]))
        .catch(err => console.log('Error while updating the context history', err));
      }
    });
    store.on('update_light_intensity', (state, location, intensity) => {
      Promise.all(
        _(enlightenedRooms.toJSON())
        .map(location => [
          client.addAgentContextOperations(agents[location].brightness, {
            timestamp: timestamp(),
            diff: {
              lightIntensity: intensity
            }
          }),
          client.addAgentContextOperations(agents[location].color, {
            timestamp: timestamp(),
            diff: {
              lightIntensity: intensity
            }
          })
        ])
        .flatten()
        .value()
      )
      .catch(err => console.log('Error while updating the context history', err))
      .then(() => takeDecisions(state,  enlightenedRooms.toJSON()));
    });
  });
}
