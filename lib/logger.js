const moment = require('moment');

module.exports = function (message, ...arr) {
  const time = moment().format('YYYY-MM-DD hh:mm:ss');
  console.log(`[${time}] ${message} ${arr.join(' ')}`);
}
