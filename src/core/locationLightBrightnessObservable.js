import Rx from 'rxjs/Rx';

export default function createLocationLightBrightnessObservable() {
  return new Rx.Subject()
  .map(({ location, brightness }) => house => {
    console.log(`Change the ${location} light brightness to ${brightness}.`);
    return house.setLocationLightBrightness(location, brightness);
  });
}
