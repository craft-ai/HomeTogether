# Home Together #

[![Build](https://img.shields.io/travis/craft-ai/HomeTogether/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/HomeTogether)

## Autonomous Home powered by **craft ai** ##

**HomeTogether** showcases the **craft ai** AI platform in a SmartHome context,
this demo was presented at [CES 2016](http://www.craft.ai/blog/home-together-a-ces-demo/).

> :point_right: This version has been reimplemented using **craft ai** newer learning API!

## Build & Run ##

> This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app). Find the further information about the different features of the framework [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

To begin with you'll need to do to the following:
1. Download & install [Node.js v4.X](https://nodejs.org/en/download/);
2. Install dependencies running `npm install`.
3. Create a new `.env` file, it'll be used to define environment variable.
4. In this file, enter the following (you can retrieve your owner and token at https://beta.craft.ai/settings):

        REACT_APP_CRAFT_URL=https://beta.craft.ai
        REACT_APP_CRAFT_OWNER=<YOUR_OWNER>
        REACT_APP_CRAFT_TOKEN=<YOUR_TOKEN>

5. Build and start using `npm start`, it should opn your browser to <http://localhost:3000/>;
6. [Play](#play)!

## Play ##

1. When the app starts, **"Gisele"** is wandering around in the home,
2. You can lower the outside’s luminosity using the slider,
3. The light agent turns the light on/off when she enters/leaves a room,
4. If you click on a room, **"Robert"** enters the house,
5. You can change his lighting settings for the room his in (this acts as a simulation of the Philips Hue app for example),
6. The light agent learns his preference in each context (luminosity), it is able to automate the lights with no explicit settings!
