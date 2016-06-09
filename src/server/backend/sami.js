import _ from 'lodash';
import Promise from 'bluebird';
import WebSocket from 'ws';
import { hexToRGB, RGBtoHex } from '../lib/colorHelper';
import { createLight, createTv, createLightSensor } from './devices';

const API_BASE_WS_URL = 'wss://api.samsungsami.io/v1.1/';

export default function createSimulatedBackend() {
  let ws;
  let token;

  let devices = {
    'living_room+tv': {
      id: process.env.SAMI_TV_ID,
      token: process.env.SAMI_TV_TOKEN,
      deviceType: 'dt3fdf857d42f943919d103aa3e0316052',
      state: createTv()
    },
    'outside+lightSensor': {
      id: process.env.SAMI_LIGHT_SENSOR_ID,
      token: process.env.SAMI_LIGHT_SENSOR_TOKEN,
      deviceType: 'dt793c92541dcf4e99a79ded0444244168',
      state: createLightSensor()
    },
    'living_room+light': {
      id: process.env.SAMI_LIVINGROOM_ID,
      token: process.env.SAMI_LIVINGROOM_TOKEN,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'dining_room+light': {
      id: process.env.SAMI_DININGROOM_ID,
      token: process.env.SAMI_DININGROOM_TOKEN,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'corridor+light': {
      id: process.env.SAMI_CORRIDOR_ID,
      token: process.env.SAMI_CORRIDOR_TOKEN,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'bathroom+light': {
      id: process.env.SAMI_BATHROOM_ID,
      token: process.env.SAMI_BATHROOM_TOKEN,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'water_closet+light': {
      id: process.env.SAMI_WC_ID,
      token: process.env.SAMI_WC_TOKEN,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'bedroom+light': {
      id: process.env.SAMI_BEDROOM_ID,
      token: process.env.SAMI_BEDROOM_TOKEN,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    }
  };

  function updateSamiDeviceState(deviceName, deviceState) {
    if (_.has(devices, deviceName) && !_.isEqual(devices[deviceName].state, deviceState))
      devices[deviceName].state = _.extend(devices[deviceName].state, deviceState);
    return devices[deviceName].state;
  }

  function sendMessageToDevice(deviceName, messageContent, type='message') {
    return new Promise((resolve, reject) => {
      if (!_.isUndefined(ws)) {
        let message = {
          ddid: devices[deviceName].id,
          sdid: devices[deviceName].id,
          type: type,
          data: messageContent
        };
        ws.send(JSON.stringify(message));
        return resolve();
      }
      else
        return reject(Error('SAMI websocket not found'));
    });
  }

  function sendActionsToDevice(deviceName, deviceState) {
    let actions = [];
    if (!_.isUndefined(deviceState.color)) {
      actions.push({
        name: 'setColorRGB',
        parameters: {
          colorRGB: hexToRGB(deviceState.color)
        }
      });
    }
    if (!_.isUndefined(deviceState.brightness)) {
      if (deviceState.brightness == 0)
        actions.push({ name: 'setOff' });
      else
        actions = _.union([{ name: 'setOn' }, {
          name: 'setBrightness',
          parameters: {
            brightness: parseFloat(deviceState.brightness) * 100
          }
        }], actions);
    }
    if (_.size(actions) > 0)
      sendMessageToDevice(deviceName, { actions: actions }, 'action')
      .then(() => Promise.resolve());
    else
      return Promise.resolve();
  }

  function createListenerWS(samiToken) {
    return new Promise((resolve, reject) => {
      console.log('requesting WS connexion to SAMI...');
      let wsUrl = API_BASE_WS_URL + 'websocket';
      ws = new WebSocket(wsUrl);
      ws.on('message', evt => {
        let evtJSON = JSON.parse(evt);
        if (!_.isUndefined(evtJSON)) {
          if (evtJSON.type === 'action') {
            let deviceName = _.findKey(devices, d => d.id === evtJSON.ddid);
            let deviceState = _.reduce(evtJSON.data.actions, (r, v, k) => {
              switch (v.name) {
                case 'setColorRGB':
                  r.color = RGBtoHex(v.parameters.colorRGB);
                  break;
                case 'setBrightness':
                  r.brightness = v.parameters.brightness / 100;
                  break;
                case 'setOff':
                  r.brightness = 0;
                  break;
                case 'setOn':
                default:
                  r.brightness = r.brightness || 1 ;
                  break;
              }
              return r;
            }, {});
            deviceState.brightness = deviceState.brightness.toFixed(1);
            updateSamiDeviceState(deviceName, deviceState);
            sendMessageToDevice(deviceName, deviceState);
          }
        }
      });
      ws.on('open', () => {
        console.log('SAMI WS Connection open');
        Promise.all(
          _.map(devices, (val, key) => {
            if (!_.isUndefined(val.id)) {
              let message = {
                Authorization: 'bearer ' + val.token,
                sdid: val.id,
                type: 'register'
              };
              console.log('Registering SAMI device', key);
              return Promise.resolve(ws.send(JSON.stringify(message)))
              .then(() => sendActionsToDevice(key, val.state));
            }
          })
        )
        .then(() => {
          token = samiToken;
          return;
        });
      });
      ws.on('close', () => {
        console.log('SAMI WS Connection closed');
      });
      ws.on('error', evt => {
        console.log('SAMI WS Connection error:', evt.data);
      });
    })
    .catch(ex => {
      console.log('Error in function createListenerWS:', ex);
      return Promise.reject(ex);
    });
  }

  return {
    name: 'sami',
    init: samiToken => createListenerWS(samiToken),
    list: () => token ? _.keys(devices) : [],
    has: deviceName => token ? _.has(devices, deviceName) : false,
    get: deviceName => new Promise((resolve, reject) => {
      // console.log(`Retrieving device '${deviceName}' state.`);
      if (_.has(devices, deviceName)) {
        resolve(devices[deviceName].state);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    }),
    update: (deviceName, state) => new Promise((resolve, reject) => {
      // console.log(`Updating device '${deviceName}' state.`);
      if (_.has(devices, deviceName)) {
        let newState = updateSamiDeviceState(deviceName, state);
        sendActionsToDevice(deviceName, newState);
        resolve(newState);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    })
  };
}
