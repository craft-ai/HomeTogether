import React from 'react';
import _ from 'lodash';
import { Motion, presets, spring } from 'react-motion';

const CHARACTER_DEFAULT_STYLE = {
  borderRadius: 99,
  backgroundColor: 'rgb(66,52,139)',
  width: 50,
  height: 50,
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: 'rgb(66,52,139)',
  position: 'absolute',
  transformOrigin: '0 0 0',
  WebkitTransformOrigin: '0 0 0'
};

const NOISE_AMPLITUDE = 5; // in Pixels
const NOISE_FREQUENCY = 5; // in Hertz

// The noise function should return a value belonging to [-1, 1]
function noise(t) {
  return Math.pow(Math.random() * 2 - 1, 1);
}

export default React.createClass({
  getInitialState: function() {
    return {
      noiseX: 0,
      noiseY: 0
    };
  },
  componentDidMount: function() {
    this.noiseInterval = setInterval(() => this.setState({
      noiseX: noise(Date.now()),
      noiseY: noise(Date.now())
    }), 1000 / NOISE_FREQUENCY);
  },
  componentWillUnmount: function() {
    clearInterval(this.noiseInterval);
    this.noiseInterval = undefined;
  },
  render: function() {
    return (
      <Motion
        style={{
          x: spring(this.props.x - CHARACTER_DEFAULT_STYLE.width / 2 + this.state.noiseX *  NOISE_AMPLITUDE, presets.noWobble),
          y: spring(this.props.y - CHARACTER_DEFAULT_STYLE.height / 2 + this.state.noiseY * NOISE_AMPLITUDE, presets.noWobble)
        }}>
        { interpolatedStyle => (
          <img
            role='presentation'
            src={this.props.image}
            style={_.extend(_.clone(CHARACTER_DEFAULT_STYLE), {
              WebkitTransform: `translate3d(${interpolatedStyle.x}px, ${interpolatedStyle.y}px, 0)`,
              transform: `translate3d(${interpolatedStyle.x}px, ${interpolatedStyle.y}px, 0)`,
              zIndex: 12
            })} />
        )}
      </Motion>
    );
  }
});
