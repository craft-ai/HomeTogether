import _ from 'lodash';
import createGiseleObservable from './giseleObservable';
import createLocationLightBrightnessObservable from './locationLightBrightnessObservable';
import createLocationLightColorObservable from './locationLightColorObservable';
import createOutsideLightIntensityObservable from './outsideLightIntensityObservable';
import createRobertObservable from './robertObservable';
import createTvObservable from './tvObservable';
import createAutomation from './automation';
import House from './House';
import Rx from 'rxjs/Rx';

export default function createHouseObservable() {
  const outsideLightIntensityObservable = createOutsideLightIntensityObservable();
  const robertObservable = createRobertObservable();
  const tvObservable = createTvObservable();
  const locationLightColorObservable = createLocationLightColorObservable();
  const locationLightBrightnessObservable = createLocationLightBrightnessObservable();

  const automation = createAutomation();

  const houseObservable = Rx.Observable.merge(
    createGiseleObservable(),
    robertObservable,
    tvObservable,
    outsideLightIntensityObservable,
    locationLightColorObservable,
    locationLightBrightnessObservable,
    automation.observable
  ).scan((house, update) => update(house), new House());

  const houseSubject = new Rx.BehaviorSubject(new House());
  houseObservable.subscribe(houseSubject);

  houseSubject.subscribe(automation.observer);

  return _.extend(houseSubject, {
    nextOutsideLightIntensity: intensity => outsideLightIntensityObservable.next(intensity),
    nextRobertLocation: location => robertObservable.next(location),
    nextTvState: state => tvObservable.next(state),
    nextLocationLightColor: (location, color) => locationLightColorObservable.next({ location, color }),
    nextLocationLightBrightness: (location, brightness) => locationLightBrightnessObservable.next({ location, brightness })
  });
}
