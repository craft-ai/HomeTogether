import App from './App';
import automation from './core/automation';
import occupantBehavior from './core/occupantBehavior';
import React from 'react';
import ReactDOM from 'react-dom';
import Store from './core/store';

import './index.css';

let store = new Store();

ReactDOM.render(
  <App store={store}/>,
  document.getElementById('root')
);

occupantBehavior(store);
automation(store);
