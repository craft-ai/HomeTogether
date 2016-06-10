import _ from 'lodash';
import App from './app';
import automation from './core/automation';
import occupantBehavior from './core/occupantBehavior';
import React from 'react';
import ReactDOM from 'react-dom';
import Store from './core/store';
import SyncedStore from './core/syncedStore';

const SERVER_SIDE_DEVICES = !_.isUndefined(__SERVER_SIDE_DEVICES__);

if (SERVER_SIDE_DEVICES) {
  console.log('Using server side devices!');
}

let store = SERVER_SIDE_DEVICES ? new SyncedStore() : new Store();

ReactDOM.render(
  <App store={store}/>,
  document.getElementById('root')
);

occupantBehavior(store);
automation(store);
