const gpio = require('rpi-gpio');
const logger = require('./lib/logger');
const execSync = require('child_process').execSync;

let timer = null;
let turnOffTimer = null;
let monitorPowered = true;
let censored = false;

const PIN = 40;
const CENSOR_INTERVAL = 200;
const STAY_ON_DURATION = 1000 * 60;

const turnOn = () => {
  logger('display on');
  try {
    logger(execSync('vcgencmd display_power 1'));
    monitorPowered = true;
  } catch (e) {
    console.error(`exec error: ${e}`);
  }
};

const turnOff = () => {
  logger('display off');
  try {
    logger(execSync('vcgencmd display_power 0'));
    monitorPowered = false;
  } catch (e) {
    console.error(`exec error: ${e}`);
  }
};

gpio.setup(PIN, gpio.DIR_IN, () => {
  logger('detecting motion...')
  timer = setInterval(() => {
    gpio.read(PIN, (err, value) => {
      if (err) {
        logger(err);
        clearTimeout(turnOffTimer);
        turnOffTimer = null;
        return;
      }
      if (value === censored) {
        return;
      }
      censored = value;
      if (value) { // on
        logger('motion detected.');
        censored = value;

        clearTimeout(turnOffTimer);
        turnOffTimer = null;

        if (!turnOffTimer && !monitorPowered) {
          turnOn();
        }
      } else {
        logger('nobody.');
        turnOffTimer = setTimeout(() => {
          turnOff();
          turnOffTimer = null;
        }, STAY_ON_DURATION);
      }
    });
  }, CENSOR_INTERVAL);
});

process.on('SIGINT', () => {
  clearInterval(timer);
  clearTimeout(turnOffTimer);
  turnOn();
  logger('exit.');
  process.exit();
});
