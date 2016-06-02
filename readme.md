# Home Together #

[![Build](https://img.shields.io/travis/craft-ai/HomeTogether/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/HomeTogether)

## Autonomous Home powered by **craft ai** ##

**HomeTogether** showcases the **craft ai** AI platform in a SmartHome context,
this demo was presented at [CES 2016](http://www.craft.ai/blog/home-together-a-ces-demo/).

> :point_right: This version has been reimplemented using **craft ai** newer learning API!

## Build & Run ##

**HomeTogether** can be used with either fully simulated devices or connecting to real devices:
- [Philips Hue](http://www2.meethue.com) lightbulbs,
- [LiFX](http://www.lifx.com) lightbulb,
- Devices connected to a box using [Zipato](https://www.zipato.com),
- Devices connected through the [Samsung SAMI](https://www.samsungsami.io) cloud platform.

To begin with you'll need to do to the following:
1. Download & install [Node.js v4.X](https://nodejs.org/en/download/);
2. Install dependencies running `npm install`.
3. Create a new `.env` file, it'll be used to define environment variable.
4. In this file, enter the following:

        CRAFT_URL=https://beta.craft.ai
        # Replace the following value by the token you were provided with.
        CRAFT_TOKEN=abcde.fghij.klmnopqr

### Fully Simulated ###

To launch a fully simulated version of the demo, it's very straightforward:

1. Build using `npm run build`;
2. Run using `npm run start`;
3. Go to <http://localhost:4444>;
4. [Play](#play)!

### Using real devices ###

> :warning: in the current version, the communication with **craft ai** is done
> on the browser side while the connection to devices is done on the server side,
> as a result, only one client should connect at a time.

To enable the use of real devices, enter the following in you `.env` file:

    SERVER_SIDE_DEVICES=true

Then you'll need to configure two kinds of things:

- options to connect to the real device API,
- the mapping between the scenario devices and the actual devices.

These options differs based on the API used to connect to the devices.

#### Philips Hue ####

- Your _Hue_ username (if not set the _Hue_ integration won't be enabled),

```
HUE_USER=yourHueUser
```

- Optionally, the ID of your _Hue_ bridge (if not set the first found on the network is used),

```
HUE_PREFERRED_BRIDGE_ID=0123456789abcd
```

- Optionally, the internal ip address of the _Hue_ bridge to use (if not set the ip is retrieved from the web),

      HUE_PREFERRED_BRIDGE_INTERNALIP=192.168.0.104

- The mapping between the scenario bulbs and the id of your bulbs (mapping that are not set are not used).

```
HUE_LIVING_ROOM_LIGHT_ID=1
HUE_DINING_ROOM_LIGHT_ID=2
HUE_CORRIDOR_LIGHT_ID=3
HUE_BATHROOM_LIGHT_ID=4
HUE_WATER_CLOSET_LIGHT_ID=5
HUE_BEDROOM_LIGHT_ID=6
```

## Play ##

1. When the app starts, “Gisele” is wandering around in the home,
2. You can lower the outside’s luminosity using the slider,
3. The light agent turns the light on/off when she enters/leaves a room,
4. If you click on a room, “Marcel” enters the house,
5. You can change his lighting settings for the room his in (this acts as a simulation of the Philips Hue app for example),
6. The light agent learns his preference in each context (luminosity), it is able to automate the lights with no explicit settings!
