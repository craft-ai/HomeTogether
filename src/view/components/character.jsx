import React from 'react';
import _ from 'lodash';

const CHARACTER_DEFAULT_STYLE = {
  borderRadius: 99,
  backgroundColor: 'rgb(66,52,139)',
  width: 50,
  height: 50,
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: 'rgb(66,52,139)',
  position: 'absolute',
  transformOrigin: `0 0 0`,
  WebkitTransformOrigin: `0 0 0`
}

export default React.createClass({
  render: function() {
    return (
      <img
        src={this.props.image}
        style={_.extend(_.clone(CHARACTER_DEFAULT_STYLE), {
          WebkitTransform: `translate3d(${this.props.x - CHARACTER_DEFAULT_STYLE.width / 2}px, ${this.props.y - CHARACTER_DEFAULT_STYLE.height / 2}px, 0)`,
          transform: `translate3d(${this.props.x - CHARACTER_DEFAULT_STYLE.width / 2}px, ${this.props.y - CHARACTER_DEFAULT_STYLE.height / 2}px, 0)`,
          zIndex: 12
        })} />
    );
  }
});
