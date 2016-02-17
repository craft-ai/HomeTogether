import React from 'react';
import Reflux from 'reflux';
import {ActionStore} from '../../actions/actionStore';
import _ from 'lodash';
import Bulb from './bulb.jsx';

function hexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return {r: (intColor >> 16) & 255, g: (intColor >> 8) & 255, b: intColor & 255};
}

const LIGHT_LOCATIONS = [
  {x:200, y:530},
  {x:167, y:200},
  {x:480, y:176},
  {x:441, y:57},
  {x:589, y:57},
  {x:480, y:328}
];

const LIGHT_HIDDEN = [
  !_.isUndefined(__LIFX_BULB_0__),
  !_.isUndefined(__LIFX_BULB_1__),
  !_.isUndefined(__LIFX_BULB_2__),
  !_.isUndefined(__LIFX_BULB_3__),
  !_.isUndefined(__LIFX_BULB_4__),
  !_.isUndefined(__LIFX_BULB_5__)
];

export default React.createClass({
  mixins: [Reflux.connect(ActionStore, 'devices')],
  render: function() {
    console.log('this.state.devices.lights[0]', this.state.devices.lights[0]);
    return (
      <div id='lights'>
        {
          _.map(this.state.devices.lights, (value, key) => !LIGHT_HIDDEN[key] ?
            (
              <Bulb
                key={key}
                x={LIGHT_LOCATIONS[key].x}
                y={LIGHT_LOCATIONS[key].y}
                red={hexToRGB(value.color).r}
                blue={hexToRGB(value.color).b}
                green={hexToRGB(value.color).g}
                brightness={ value.brightness } />
            ) : (
              <div key={key} />
            )
          )
        }
      </div>
    );
  }
});
