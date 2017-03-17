const gpio = require('rpi-gpio');
const logger = require('./lib/logger');
const exec = require('child_process').exec;

let timer = null;
let turnOffTimer = null;
let monitorPowered = true;
let censored = false;

const PIN = 40;
const CENSOR_INTERVAL = 200;
const STAY_ON_DURATION = 1000 * 60 * 1; // 1 minute

const turnOn = () => {
  logger('display on');
  exec('vcgencmd display_power 1', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    monitorPowered = true;
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
};

const turnOff = () => {
  logger('display off');
  exec('vcgencmd display_power 0', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    monitorPowered = false;
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
};

gpio.setup(PIN, gpio.DIR_IN, () => {
  timer = setInterval(() => {
    gpio.read(PIN, (err, value) => {
      if (err) {
        logger(err);
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
          turnOffTimer = null;
          turnOff();
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
