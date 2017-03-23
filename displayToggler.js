const gpio = require('rpi-gpio');
const logger = require('./lib/logger');
const execSync = require('child_process').execSync;

let timer = null;
let turnOffTimer = null;
let monitorPowered = true;
let censored = false;

const PIN = 40;
const CENSOR_INTERVAL = 500;
const STAY_ON_DURATION = 1000 * 60 * 1; // 1 minute

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
    monitorPowered = true;
  } catch (e) {
    console.error(`exec error: ${e}`);
  }
};

gpio.setup(PIN, gpio.DIR_IN, () => {
  timer = setInterval(() => {
    gpio.read(PIN, (err, value) => {
      if (err) {
        logger(err);
        clearTimeout(turnOffTimer);
        return;
      }
      if (value === censored) {
        return;
      }
      censored = value;
      if (value) { // on
        logger('motion detected.');
        censored = value;
        if (!turnOffTimer && !monitorPowered) {
          turnOn();
        }

        clearTimeout(turnOffTimer);
        turnOffTimer = setTimeout(() => {
          turnOff();
        }, STAY_ON_DURATION);
      } else {
        logger('nobody.');
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
