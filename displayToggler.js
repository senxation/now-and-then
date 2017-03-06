const gpio = require('rpi-gpio');
const logger = require('./lib/logger');
const exec = require('child_process').exec;

let timer = null;
let turnOffTimer = null;
let status = true;

const PIN = 40;
const CENSOR_INTERVAL = 200;
const STAY_ON_DURATION = 1000 * 60 * 3;

const turnOn = () => {
  logger('display on');
  exec('vcgencmd display_power 1', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    status = true;
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
    status = false;
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
      if (value === status) {
        return;
      }
      if (value) { // on
        if (!turnOffTimer && !status) {
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
