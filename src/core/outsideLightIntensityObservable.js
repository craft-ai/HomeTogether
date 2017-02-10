import Rx from 'rxjs/Rx';

export default function createOutsideLightIntensityObservable() {
  return new Rx.Subject()
  .map(intensity => house => {
    console.log(`Change the outside light intensity to ${intensity}.`);
    return house.setOutsideLightIntensity(intensity);
  });
}
