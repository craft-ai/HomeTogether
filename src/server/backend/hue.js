import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';
import { convertHexToXY, convertXYtoHex } from '../lib/colorHelper';
import { createLight } from './devices';

function hueRetrieveUser(settings) {
  return hueRequest(settings, {
    path: settings.user
  })
  .then(res => res.json())
  .then(json => {
    if (!_.isUndefined(json.config)) {
      return settings;
    }
    else {
      return hueRequest(settings, {
        method: 'POST',
        body: JSON.stringify({
          devicetype: 'home_together#craft_hue',
          username: settings.user
        }) })
      .then(res => res.json())
      .then(json => {
        let r = _.first(json);
        if (!_.isUndefined(r.success) && !_.isUndefined(r.success.username)) {
          return _.extend({}, settings, {
            user: r.success.username
          });
        }
        else {
          if (!_.isUndefined(r.error) && !_.isUndefined(r.error.type) && r.error.type === 101) {
            console.log(r.error.description);
            setTimeout(() => hueRetrieveUser(settings), 5000);
          }
          else
            return Promise.reject(r.error.description);
        }
      });
    }
  });
}

function hueInitialize(initialSettings) {
  return fetch('https://www.meethue.com/api/nupnp')
  .then(res => res.json())
  .then(addr => {
    if (!_.isUndefined(initialSettings.bridgeInternalIp)) { // use bridge of specified IP
      return hueRetrieveUser(initialSettings);
    }
    else if (_.size(addr) === 0 || _.isUndefined(_.first(addr).internalipaddress)) {
      return Promise.reject('No Hue bridge detected.');
    }
    else {
      let bridge = _.find(addr, bridge => bridge.id === initialSettings.bridgeId);
      if (_.isUndefined(bridge)) {
        // Preferred bridge not found, use the first one.
        bridge = _.first(addr);
      }
      return hueRetrieveUser(_.extend({}, initialSettings, {
        bridgeInternalIp: bridge.internalipaddress,
        bridgeId: bridge.id
      }));
    }
  })
  .catch(err => {
    let msg = 'Error while retrieving Hue userId, Hue API won\'t be used\n' + err;
    console.log(msg, err);
    throw new Error(msg);
  });
}

function hueRequest(settings, r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    headers: {},
    body: {}
  });
  let url = 'http://' + settings.bridgeInternalIp + '/api/' + r.path;
  return fetch(url, {
    method: r.method,
    body: r.body
  });
}

export default function createSimulatedBackend() {
  const HUE_LIGHT_IDS = {
    'living_room+light': process.env.HUE_LIVING_ROOM_LIGHT_ID,
    'dining_room+light': process.env.HUE_DINING_ROOM_LIGHT_ID,
    'corridor+light': process.env.HUE_CORRIDOR_LIGHT_ID,
    'bathroom+light': process.env.HUE_BATHROOM_LIGHT_ID,
    'water_closet+light': process.env.HUE_WATER_CLOSET_LIGHT_ID,
    'bedroom+light': process.env.HUE_BEDROOM_LIGHT_ID
  };

  const HUE_INITIAL_SETTINGS = {
    bridgeId: process.env.HUE_PREFERRED_BRIDGE_ID,
    bridgeInternalIp: process.env.HUE_PREFERRED_BRIDGE_INTERNALIP,
    user: process.env.HUE_USER
  };

  let hueSettings;

  let devices = _.reduce(
    HUE_LIGHT_IDS,
    (devices, lightId, deviceId) => {
      if (lightId) {
        devices[deviceId] = {
          id: lightId,
          state: createLight()
        };
      }
      return devices;
    },
    {}
  );

  function updateState(deviceName, state) {
    if (_.has(devices, deviceName)) {
      let r = {};
      if (!_.isUndefined(state.color)) {
        r.xy = convertHexToXY(state.color);
      }
      if (!_.isUndefined(state.brightness)) {
        r.on = (state.brightness !== 0);
        r.bri = Math.floor(state.brightness * 253 + 1);
      }
      return hueRequest(hueSettings, {
        method: 'PUT',
        path: hueSettings.user + '/lights/' + devices[deviceName].id + '/state',
        body: JSON.stringify(r)
      })
      .then(() => {
        devices[deviceName].state = _.extend(devices[deviceName].state, state);
        return devices[deviceName].state;
      })
      .catch(ex => {
        throw new Error(`Updating '${deviceName}' state through Hue API failed:\n'${ex}'`);
      });
    }
    else {
      return Promise.reject(new Error(`Device '${deviceName}' is unknown.`));
    }
  }

  hueInitialize(HUE_INITIAL_SETTINGS)
  .then(settings => {
    hueSettings = settings;
    return Promise.all(
      _.map(devices, (v, k) => updateState(k, v.state))
    )
    .then(() => {
      console.log('Linked to Hue bridge', hueSettings);
      return;
    });
  })
  .catch(ex => {
    devices = {};
    throw new Error(`Initializing Hue bulbs failed:\n'${ex}'`);
  });
  return {
    name: 'hue',
    list: () => hueSettings ? _.keys(devices) : [],
    has: deviceName => hueSettings ? _.has(devices, deviceName) : false,
    get: deviceName => {
      if (_.has(devices, deviceName)) {
        return hueRequest(hueSettings, {
          path: hueSettings.user + '/lights/' + devices[deviceName].id
        })
        .then(res => res.json())
        .then(json => {
          let color = convertXYtoHex(json.state.xy[0], json.state.xy[1], json.state.bri);
          let brightness = ((json.state.bri - 1)/253).toFixed(1);
          devices[deviceName].state = _.extend(devices[deviceName].state, {
            color: color,
            brightness: brightness
          });
          return devices[deviceName].state;
        })
        .catch(ex => {
          throw new Error(`Getting '${deviceName}' state through Hue API failed:\n'${ex}'`);
        });
      }
      else {
        return Promise.reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    },
    update: (deviceName, state) => updateState(deviceName, state)
  };
}
