import React from 'react';
import _ from 'lodash';

import home from './Home.png';
import tv from './Tv.png';

const BBOXES = {
  tv: [102,447,130,633],
  living_room: [132,447,331,633],
  dining_room: [13,13,331,446],
  corridor: [332,156,637,235],
  bathroom: [346,13,545,141],
  water_closet: [561,13,637,141],
  bedroom: [346,251,637,445]
};

export default React.createClass({
  roomSelected: function(id) {
    this.props.onUpdateLocation(String(id));
  },
  renderTv: function() {
    if (this.props.tv) {
      return (
        <img
          role='presentation'
          src={tv}
          style={{
            position: 'absolute',
            left: '120px',
            top: '491px',
            height: '98px',
            zIndex: 10
          }} />
      );
    }
    else {
      return (
        <div/>
      );
    }
  },
  renderMap: function() {
    return (
      <map name='rooms'>
      {
        _.map(BBOXES, (bbox, location) => (
          <area
            shape='rect'
            key={location}
            id={location}
            coords={bbox.join(',')}
            onClick={()=> location ==='tv' ? this.props.onUpdateTV(!this.props.tv) : this.props.onMovePlayer(location)}
            alt={location} />
        ))
      }
      </map>
    );
  },
  render: function() {
    return (
      <div>
        <img
          style={{position:'relative',left:'-15px'}}
          src={home}
          width='651'
          height='646'
          alt='home'
          useMap='#rooms'
          id='out'
          onClick={() => this.props.onMovePlayer('outside')}/>
        { this.renderMap() }
        { this.renderTv() }
      </div>
    );
  }
});
