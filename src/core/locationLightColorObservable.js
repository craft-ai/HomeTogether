import Rx from 'rxjs/Rx';

export default function createLocationLightColorObservable() {
  return new Rx.Subject()
  .map(({ location, color }) => house => {
    console.log(`Change the ${location} light color to ${color}.`);
    return house.setLocationLightColor(location, color);
  });
}
