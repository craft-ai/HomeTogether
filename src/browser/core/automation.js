import { createCraftAgent, updateCraftAgentContext, getCraftAgentDecision } from './craft-ai';
import _ from 'lodash';

const BRIGHTNESS_AGENT_MODEL = {
  knowledge: {
    presence: {
      type: 'enum'
    },
    lightIntensity:  {
      type: 'continuous',
      min: 0,
      max: 2.5
    },
    lightbulbBrightness: {
      type: 'enum_output'
    }
  }
};

const COLOR_AGENT_MODEL = {
  knowledge: {
    presence: {
      type: 'enum'
    },
    lightIntensity:  {
      type: 'continuous',
      min: 0,
      max: 2.5
    },
    lightbulbColor: {
      type: 'enum_output'
    }
  }
};

const INITIAL_BRIGHTNESS_HISTORY = require('./initialBrightnessHistory.json');
const INITIAL_COLOR_HISTORY = require('./initialColorHistory.json');

function timestamp() {
  return Math.floor(Date.now()/1000);
}

function getPresence(state, location) {
  const presence = state.get('characters').reduce((presence, characterLocation, character) => {
    if (characterLocation === location) {
      presence.push(character);
    }
    return presence;
  },
  []);
  if (presence.length == 0) {
    return 'none';
  }
  else {
    return presence.join('+');
  }
}

export default function startAutomation(store) {
  // Extract the room having a light
  const enlightenedRooms = store.get(['locations']).filter(location => location.has('light')).keySeq();
  // Initialize the agents list
  const brightnessHistory = _.map(
    INITIAL_BRIGHTNESS_HISTORY,
    sample => {
      _.set(sample, 'timestamp', timestamp() + sample.timestamp);
      return sample;
    }
  );
  const colorHistory = _.map(
    INITIAL_COLOR_HISTORY,
    sample => {
      _.set(sample, 'timestamp', timestamp() + sample.timestamp);
      return sample;
    }
  );
  let agents = enlightenedRooms.reduce((agents, roomName) => {
    agents[roomName] = {
      brightness: null,
      color: null,
      brightnessHistory: brightnessHistory,
      colorHistory:colorHistory
    };
    return agents;
  },
  {});

  let updateAgentsContextHistory = state => _.forEach(enlightenedRooms.toJSON(), roomName => {
    agents[roomName].brightnessHistory.push({
      timestamp: timestamp(),
      diff: {
        presence: getPresence(state, roomName),
        lightIntensity: state.getIn(['locations', 'outside', 'lightIntensity']),
        lightbulbBrightness: state.getIn(['locations', roomName, 'light', 'brightness'])
      }
    });
    agents[roomName].colorHistory.push({
      timestamp: timestamp(),
      diff: {
        presence: getPresence(state, roomName),
        lightIntensity: store.get(['locations', 'outside', 'lightIntensity']),
        lightbulbColor: store.get(['locations', roomName, 'light', 'color'])
      }
    });
  });

  let createAgents = () => Promise.all(
    enlightenedRooms.map((roomName) =>
      createCraftAgent(BRIGHTNESS_AGENT_MODEL)
      .then(agent => {
        console.log(`Agent ${agent.id} created for ${roomName} brightness`);
        agents[roomName].brightness = agent.id;
      })
      .then(() => createCraftAgent(COLOR_AGENT_MODEL))
      .then(agent => {
        console.log(`Agent ${agent.id} created for ${roomName} color`);
        agents[roomName].color = agent.id;
      })
      .catch(err => console.log(`Error while creating agent for ${roomName}`, err))
    ).toJSON()
  );

  let sendAgentsContextHistory = () => {
    console.log('Sending agent context history...');
    return Promise.all(
      enlightenedRooms.map((roomName) =>
        agents[roomName].brightnessHistory.length && updateCraftAgentContext(agents[roomName].brightness, agents[roomName].brightnessHistory)
        .then(() => agents[roomName].brightnessHistory = [])
        .then(() => agents[roomName].colorHistory.length && updateCraftAgentContext(agents[roomName].color, agents[roomName].colorHistory))
        .then(() => agents[roomName].colorHistory = [])
        .catch(err => console.log(`Error while updating the context history for ${roomName}`, err))
      ).toJSON()
    );
  };

  let takeDecisions = state => {
    console.log('Taking a decision...');
    return Promise.all(
      enlightenedRooms.map((roomName) =>
        getCraftAgentDecision(agents[roomName].brightness, {
          presence: getPresence(state, roomName),
          lightIntensity: state.getIn(['locations', 'outside', 'lightIntensity'])
        }, timestamp())
        .then((brightnessDecision) => {
          store.setLocationLightBrightness(roomName, brightnessDecision.output.result);
        })
        .then(() => getCraftAgentDecision(agents[roomName].color, {
          presence: getPresence(state, roomName),
          lightIntensity: state.getIn(['locations', 'outside', 'lightIntensity'])
        }, timestamp()))
        .then((colorDecision) => {
          store.setLocationLightColor(roomName, colorDecision.output.result);
        })
        .catch(err => console.log(`Error while taking decision for ${roomName}`, err))
      ).toJSON()
    );
  };

  let debouncedTakeDecisions = _.throttle(
    state => {
      takeDecisions(state);
    },
    1000,
    {
      leading: true,
      trailing: true
    });
  let debouncedUpdateAgentsContextHistory = _.throttle(
    state => {
      updateAgentsContextHistory(state);
    },
    1000,
    {
      trailing: true
    });
  // Let's create the agents
  return createAgents()
  .then(() => sendAgentsContextHistory())
  .then(() => {
    console.log('learning initialization done!');
    store.addListener('update_context', state => {
      debouncedTakeDecisions(state);
    takeDecisions(store.getState(), enlightenedRooms.toJSON());
    });
    store.addListener('update', state => {
      debouncedUpdateAgentsContextHistory(state);
    });
    setInterval(sendAgentsContextHistory, 5000);
  });
}
