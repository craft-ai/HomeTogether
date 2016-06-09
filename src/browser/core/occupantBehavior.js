import _ from 'lodash';
import { getCharacterLocation } from './store';

function computeNextLocation(currentLocation, playerLocation) {
  if (playerLocation === 'living_room' || playerLocation === 'dining_room') {
    switch (currentLocation) {
      case 'living_room':
        return 'dining_room';
      case 'dining_room':
        return 'living_room';
      case 'corridor':
        return 'dining_room';
      case 'bathroom':
        return 'corridor';
      case 'water_closet':
        return 'corridor';
      case 'bedroom':
      default:
        return 'corridor';
    }
  }
  else if (playerLocation !== 'outside') {
    switch (currentLocation) {
      case 'living_room':
        return 'dining_room';
      case 'dining_room':
        return 'corridor';
      case 'corridor':
        return 'bedroom';
      case 'bathroom':
        return 'corridor';
      case 'water_closet':
        return 'corridor';
      case 'bedroom':
      default:
        return 'bedroom';
    }
  }
  else {
    switch (currentLocation) {
      case 'living_room':
        return 'dining_room';
      case 'dining_room':
        return _.sample(['living_room', 'living_room', 'corridor']);
      case 'corridor':
        return _.sample(['dining_room', 'dining_room', 'dining_room', 'bathroom', 'water_closet', 'bedroom']);
      case 'bathroom':
        return 'corridor';
      case 'water_closet':
        return 'corridor';
      case 'bedroom':
      default:
        return 'corridor';
    }
  }
}

export default function startOccupantBehavior(store) {
  let wander;
  wander = function() {
    const nextLocation = computeNextLocation(
      getCharacterLocation(store.getState(), 'gisele'),
      getCharacterLocation(store.getState(), 'robert'));
    store.setCharacterLocation('gisele', nextLocation);
    setTimeout(wander, _.random(6, 12)*1000);
  };
  wander();
}
