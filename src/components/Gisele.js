import _ from 'lodash';
import Character from './Character';
import React from 'react';

import gisele from './Gisele.png';

const POSITION_FROM_ROOM = {
  living_room: {
    x: 265 + 25,
    y: -172 + 25
  },
  dining_room: {
    x: 171 + 25,
    y: -403 + 25
  },
  corridor: {
    x: 404 + 25,
    y: -480 + 25
  },
  bathroom: {
    x: 347 + 25,
    y: -603 + 25
  },
  water_closet: {
    x: 561 + 25,
    y: -644 + 25
  },
  bedroom: {
    x: 365 + 25,
    y: -301 + 25
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
        <Character x={position.x} y={position.y} image={gisele}/>
      );
    }
  }
});
