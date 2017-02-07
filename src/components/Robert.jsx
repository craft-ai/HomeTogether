import _ from 'lodash';
import Character from './Character';
import React from 'react';

import robert from './Robert.png';

const POSITION_FROM_ROOM = {
  living_room: {
    x: 265 + 25,
    y: -97 + 25
  },
  dining_room: {
    x: 178 + 25,
    y: -606 + 25
  },
  corridor: {
    x: 506 + 25,
    y: -469 + 25
  },
  bathroom: {
    x: 484 + 25,
    y: -638 + 25
  },
  water_closet: {
    x: 558 + 25,
    y: -646 + 25
  },
  bedroom: {
    x: 399 + 25,
    y: -368 + 25
  }
};


export default React.createClass({
  render: function() {
    const position = this.props.location && POSITION_FROM_ROOM[this.props.location];
    if (_.isUndefined(position)) {
      return (
        <div/>
      );
    }
    else {
      return (
        <Character x={position.x} y={position.y} image={robert}/>
      );
    }
  }
});
