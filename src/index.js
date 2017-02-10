import App from './App';
import createHouseObservable from './core/houseObservable';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

const houseObservable = createHouseObservable();

ReactDOM.render(
  <App
    houseObservable={ houseObservable }
    onUpdateTV={ houseObservable.nextTvState }
    onMovePlayer={ houseObservable.nextRobertLocation }
    onUpdateOutsideLightIntensity={ houseObservable.nextOutsideLightIntensity }
    onUpdateLocationLightColor={ houseObservable.nextLocationLightColor }
    onUpdateLocationLightBrightness={ houseObservable.nextLocationLightBrightness }
    />,
  document.getElementById('root')
);
