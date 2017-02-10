import _ from 'lodash';
import ColorPicker from './components/ColorPicker';
import DayAndNight from './components/DayAndNight';
import FloorMap from './components/FloorMap';
import Gisele from './components/Gisele';
import Lights from './components/Lights';
import React from 'react';
import request from './core/request';
import Robert from './components/Robert';
import { getAgentsToDeleteOnExit } from './core/automation';
import House from './core/House';
import { Grid, Row, Col } from 'react-bootstrap';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import 'font-awesome/css/font-awesome.min.css';

function onExit() {
  const agentsToDeleteOnExit = getAgentsToDeleteOnExit();
  console.log('TO DELETE', agentsToDeleteOnExit);
  if (agentsToDeleteOnExit.length > 0) {
    console.log(`Deleting agents ${ _.map(agentsToDeleteOnExit, agent => `'${agent}'`).join(', ') } before exiting...`);
    _.forEach(agentsToDeleteOnExit, agentId => {
      console.log('agentId', agentId);
      request({
        method: 'DELETE',
        path: '/agents/' + agentId
      });
    });
  }
}

export default React.createClass({
  getInitialState: function() {
    return {
      house: new House()
    };
  },
  componentDidMount: function() {
    this.subscription = this.props.houseObservable.subscribe(house => this.setState({house: house}));
  },
  componentWillUnmount: function() {
    this.subscription.unsubscribe();
  },
  render: function() {
    const { house } = this.state;
    const { onUpdateTV, onMovePlayer, onUpdateOutsideLightIntensity, onUpdateLocationLightColor, onUpdateLocationLightBrightness } = this.props;
    const tvState = house.getIn(['living_room', 'tv']);
    const robertLocation = house.getCharacterLocation('robert');
    const giseleLocation = house.getCharacterLocation('gisele');
    const lights = house
    .toMap()
    .filter(location => location.has('light'))
    .map(location => ({
      color: location.getIn(['light', 'color']),
      brightness: location.getIn(['light', 'brightness']),
      visible: true
    })).toJSON();
    const robertLocationLight = lights[robertLocation];
    const outsideLightIntensity = house.getIn(['outside', 'lightIntensity']);
    const colorAgentUrl = house.getIn([robertLocation, 'agents', 'color', 'inspectorUrl']);
    const brightnessAgentUrl =  house.getIn([robertLocation, 'agents', 'brightness', 'inspectorUrl']);
    return (
      <Grid>
        <Row>
          <Col xs={12} lg={8}>
            <FloorMap
              tv={tvState}
              onUpdateTV={ onUpdateTV }
              onMovePlayer={ onMovePlayer } />
            <Robert location={robertLocation} />
            <Gisele location={giseleLocation} />
            <Lights lights={lights} />
          </Col>
          <Col xs={12} lg={4} style={{paddingTop:'100px', paddingBottom:'100px'}}>
            <DayAndNight
              light={outsideLightIntensity}
              onUpdateLight={ onUpdateOutsideLightIntensity }/>
            {
              robertLocationLight && robertLocationLight.visible ?
              (
                <ColorPicker
                  label={robertLocation}
                  color={robertLocationLight.color}
                  brightness={robertLocationLight.brightness}
                  colorAgentUrl={colorAgentUrl}
                  brightnessAgentUrl={brightnessAgentUrl}
                  onUpdateColor={color => onUpdateLocationLightColor(robertLocation, color)}
                  onUpdateBrightness={brightness => onUpdateLocationLightBrightness(robertLocation, brightness)}/>
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
