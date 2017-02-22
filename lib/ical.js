const ical = require('node-ical');
const _ = require('underscore');
const moment = require('moment');

module.exports = {
  fetch: function (url, from, to) {
    return new Promise((resolve, reject) => {
      ical.fromURL(url, {}, function(err, data) {
        if (err) {
          return reject(err);
        }
        data = _.filter(data, (event) => {
          if (event.type !== 'VEVENT' || !event.summary) {
            return false;
          }
          if (!event.end) {
            return moment(event.start).isBetween(from, to, '[]');
          }
          const startMoment = moment(event.start);
          const endMoment = moment(event.end);
          const diffDay = moment(endMoment).startOf('day').diff(moment(startMoment).startOf('day'), 'day');

          // 종일 일정 or 날짜가 바뀌는 일정
          if (diffDay > 0) {
            return moment(event.start).isBetween(from, to, '[]') || moment(event.end).isBetween(from, to, '[)');
          } else { // 하루내 일정
            return moment(event.start).isBetween(from, to, '[]') || moment(event.end).isBetween(from, to, '[]');
          }
        });
        data = _.sortBy(data, event => -moment(event.start).toDate());

        resolve(data)
      });
    })
  }
}
