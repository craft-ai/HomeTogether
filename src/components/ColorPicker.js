import React from 'react';
import _ from 'lodash';

import './ColorPicker.css';

export default React.createClass({
  handleColorChange(color) {
    if (!_.isUndefined(this.props.onUpdateColor)) {
      this.props.onUpdateColor(color);
    }
  },
  handleBrightnessChange(brightness) {
    if (!_.isUndefined(this.props.onUpdateBrightness)) {
      this.props.onUpdateBrightness(brightness);
    }
  },
  render: function() {
    return (
      <div style={{marginTop:50}}>
        <h4>{_.startCase(this.props.label)}</h4>
        <div>
          <ColorPicker color={this.props.color} agentUrl={this.props.colorAgentUrl} onChange={this.handleColorChange} />
          <BrightnessPicker brightness={this.props.brightness} agentUrl={this.props.brightnessAgentUrl} onChange={this.handleBrightnessChange} />
        </div>
      </div>
    );
  }
});

const COLOR_PALETTE = [
  '#FFF3D9',
  '#E8F3F7',
  '#D9EBFF',
  '#FB9902',
  '#FE2712',
  '#8601AF',
  '#0247FE',
  '#66B032'
];

let ColorPicker = React.createClass({
  render: function() {
    return(
      <div>
        <h5>Color <small><a href={this.props.agentUrl} target='_blank'>inspect agent</a></small></h5>
        <div>
        {
          _.map(COLOR_PALETTE, color => (
            <div
              key={color}
              className='colorDiv'
              style={{backgroundColor:color}}
              onClick={()=>this.props.onChange(color)}>
            </div>)
          )
        }
        </div>
      </div>
    );
  }
});

const BRIGHTNESS_PALETTE = [
  0,
  0.8,
  1
];


let BrightnessPicker = React.createClass({
  render: function() {
    return(
      <div>
        <h5>Brightness <small><a href={this.props.agentUrl} target='_blank'>inspect agent</a></small></h5>
        <div>
        {
          _.map(BRIGHTNESS_PALETTE, brightness => {
            return(
              <div
                key={brightness}
                className={brightness > 0.7 ? 'colorDivNegative' : 'colorDiv'}
                style={{backgroundColor:'rgba(0,0,0,'+(1-brightness)+')'}}
                onClick={()=>this.props.onChange(brightness)}>
              </div>
            );
          })
        }
        </div>
      </div>
    );
  }
});
