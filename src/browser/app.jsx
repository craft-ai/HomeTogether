import _ from 'lodash';
import { CRAFT_TOKEN, CRAFT_URL, OWNER } from './constants';
import { getInitialState, getCharacterLocation } from './core/store';
import { Grid, Row, Col } from 'react-bootstrap';
import ColorPicker from './components/colorPicker';
import DayAndNight from './components/dayAndNight';
import FloorMap from './components/floorMap';
import Lights from './components/lights';
import Gisele from './components/gisele';
import Robert from './components/robert';
import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import 'font-awesome/css/font-awesome.min.css';

export default React.createClass({
  getInitialState: function() {
    return {
      house: getInitialState()
    };
  },
  componentWillMount: function() {
    this.storeListener = state => {
      this.setState({
        house: state
      });
    };
    this.props.store.on('update', this.storeListener);
  },
  componentWillUnmount: function() {
    this.props.store.off('update', this.storeListener);
    this.storeListener = undefined;
  },
  render: function() {
    const tvState = this.state.house.getIn(['living_room', 'tv']);
    const robertLocation = getCharacterLocation(this.state.house, 'robert');
    const giseleLocation = getCharacterLocation(this.state.house, 'gisele');
    const lights = this.state.house
    .filter(location => location.has('light'))
    .map(location => ({
      color: location.getIn(['light', 'color']),
      brightness: location.getIn(['light', 'brightness']),
      visible: true
    })).toJSON();
    const robertLocationLight = lights[robertLocation];
    const outsideLightIntensity = this.state.house.getIn(['outside', 'lightIntensity']);
    const colorAgentUrl = this.state.house.getIn([robertLocation, 'agent', 'colorUrl']);
    const brightnessAgentUrl =  this.state.house.getIn([robertLocation, 'agent', 'brightnessUrl']);
    return (
      <Grid>
        <Row>
          <Col xs={12} lg={8}>
            <FloorMap
              tv={tvState}
              onUpdateTV={val => this.props.store.setTvState(val)}
              onMovePlayer={location => this.props.store.setCharacterLocation('robert', location)} />
            <Robert location={robertLocation} />
            <Gisele location={giseleLocation} />
            <Lights lights={lights} />
          </Col>
          <Col xs={12} lg={4} style={{paddingTop:'100px', paddingBottom:'100px'}}>
            <DayAndNight
              light={outsideLightIntensity}
              onUpdateLight={(val) => this.props.store.setOutsideLightIntensity(val)}/>
            {
              robertLocationLight && robertLocationLight.visible ?
              (
                <ColorPicker
                  label={robertLocation}
                  color={robertLocationLight.color}
                  brightness={robertLocationLight.brightness}
                  colorAgentUrl={colorAgentUrl}
                  brightnessAgentUrl={brightnessAgentUrl}
                  onUpdateColor={color => this.props.store.setLocationLightColor(robertLocation, color)}
                  onUpdateBrightness={brightness => this.props.store.setLocationLightBrightness(robertLocation, brightness)}/>
              ) : (
                void 0
              )
            }

          </Col>
        </Row>
      </Grid>
    );
  }
});
