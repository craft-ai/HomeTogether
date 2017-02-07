import React from 'react';
import _ from 'lodash';
import Bulb from './Bulb';

const POSITION_FROM_ROOM = {
  living_room: {x:200, y:530},
  dining_room: {x:167, y:200},
  corridor: {x:480, y:176},
  bathroom: {x:441, y:57},
  water_closet: {x:589, y:57},
  bedroom: {x:480, y:328}
};

export default React.createClass({
  render: function() {
    return (
      <div id='lights'>
        {
          _.map(this.props.lights, (light, room) => light.visible ?
            (
              <Bulb
                key={ room }
                label={ room[0] }
                x={ POSITION_FROM_ROOM[room].x }
                y={ POSITION_FROM_ROOM[room].y }
                color={ light.color }
                brightness={ light.brightness } />
            ) : (
              <div key={ room } />
            )
          )
        }
      </div>
    );
  }
});
