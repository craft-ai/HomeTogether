import _ from 'lodash';
import Promise from 'bluebird';
import { createLight, createTv, createPresenceDetector, createLightSensor } from './devices';

const INITIAL_DEVICES = {
  'living_room+presence': createPresenceDetector(),
  'living_room+light': createLight(),
  'living_room+tv': createTv(),
  'dining_room+presence': createPresenceDetector(),
  'dining_room+light': createLight(),
  'corridor+presence': createPresenceDetector(),
  'corridor+light': createLight(),
  'bathroom+presence': createPresenceDetector(),
  'bathroom+light': createLight(),
  'water_closet+presence': createPresenceDetector(),
  'water_closet+light': createLight(),
  'bedroom+presence': createPresenceDetector(),
  'bedroom+light': createLight(),
  'outside+presence': createPresenceDetector(),
  'outside+lightSensor': createLightSensor()
};

export default function createSimulatedBackend() {
  let devices = _.cloneDeep(INITIAL_DEVICES);
  return {
    name: 'simulated',
    list: () => _.keys(devices),
    has: deviceName => _.has(devices, deviceName),
    get: deviceName => new Promise((resolve, reject) => {
      if (_.has(devices, deviceName)) {
        resolve(devices[deviceName]);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    }),
    update: (deviceName, state) => new Promise((resolve, reject) => {
      if (_.has(devices, deviceName)) {
        devices[deviceName] = _.extend(devices[deviceName], state);
        resolve(devices[deviceName]);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    })
  };
}
