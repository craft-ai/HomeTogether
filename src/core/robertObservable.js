import Rx from 'rxjs/Rx';

export default function createRobertObservable() {
  return new Rx.Subject()
  .map(location => house => {
    console.log(`Moving Robert to ${location}.`);
    return house.setCharacterLocation('robert', location)
  });
}
