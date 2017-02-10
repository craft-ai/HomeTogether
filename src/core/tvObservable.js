import Rx from 'rxjs/Rx';

export default function createTvObservable() {
  return new Rx.Subject()
  .map(state => house => {
    console.log(`Turing the tv ${state ? 'ON' : 'OFF'}.`);
    return house.setTvState(state)
  });
}
