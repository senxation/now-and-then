<template>
  <div class="schedule">
    <ul class="days" v-if="today.length || upcoming.length">
      <li class="today">
        <h2>TODAY</h2>
        <ul class="events" v-if="today.length">
          <li class="event" v-for="event in today">
            {{event | eventText}}
          </li>
        </ul>
        <span v-if="!today.length">일정 없음</span>
      </li>
      <li class="upcoming" v-for="day in upcoming">
        <h3 v-if="day.events">{{day | filterUpcomingDayText}}</h3>
        <ul class="events" v-if="day.events && day.events.length">
          <li class="event" v-for="event in day.events">
            {{event | eventText}}
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
import _ from 'underscore';
import moment from 'moment';

const store = {
  state: {
    today: [],
    upcoming: []
  },

  fetch() {
    fetch('http://localhost:8000/schedule').then((res) => {
      res.json().then(json => {
        if (!json) {
          return;
        }

        const upcoming = [];

        _.each(json.events, (event) => {
          const startMoment = moment(event.start).startOf('day');
          const endMoment = moment(event.end).startOf('day');
          const allDay = moment(event.start).isSame(moment(event.start).startOf('day')) && moment(event.end).isSame(moment(event.end).startOf('day')) && !moment(event.start).isSame(moment(event.end)) ? true : false;
          const diffDay = endMoment.diff(startMoment, 'day');

          // 종일 일정 or 날짜가 바뀌는 일정
          if (diffDay > 0) {
            for (var i = 0; i <= diffDay; i++) {
              const m = moment(startMoment).add(i, 'day');
              if (allDay && diffDay === i) {
                continue;
              }

              if (!_.find(upcoming, day => day.moment.isSame(event.start, 'day'))) {
                upcoming.push({
                  moment: m,
                  events: []
                });
              }
            }

            _.each(upcoming, day => {
              if (day.moment.isBetween(event.start, event.end, 'day', '[)')) {
                const dayAfter = day.moment.diff(moment(event.start), 'day') + 1;
                const dayRemain = day.moment.diff(moment(event.end), 'day') + 1;
                if (dayAfter > 1) {
                  event.nthDayText = `(${dayAfter}일 째)`;
                  if (dayRemain === 0) {
                    event.nthDayText = '(마지막 날)';
                  }
                }

                day.events.push(_.clone(event));
              }
            });
          } else { // 하루내 일정
            if (!_.find(upcoming, day => day.moment.isSame(event.start, 'day'))) {
              upcoming.push({
                moment: startMoment,
                events: []
              });
            }

            _.filter(upcoming, day => day.moment.isSame(event.start, 'day') || day.moment.isSame(event.end, 'day')).forEach(day => {
              event.startTimeText = moment(event.start).format('h:mm a')
              day.events.push(event);
            });
          }
        });

        const today = _.find(upcoming, day => day.moment.isSame(moment(), 'day'));
        this.state.today = (today) ? today.events : [];
        const tempUpcoming = _.first(_.filter(upcoming, day => day.moment.isAfter(moment(), 'day')), 4);
        while (tempUpcoming.length < 4) {
          tempUpcoming.push({});
        }
        this.state.upcoming = tempUpcoming;
      });
    }, _.noop);
  }
}

export default {
  name: 'Schedule',
  beforeMount() {
    store.fetch();
  },
  data() {
    return store.state;
  },
  filters: {
    filterUpcomingDayText: function (day) {
      return day.moment.format('M/D ddd');
    },
    eventText: function (event) {
      const arr = [];
      _.each(['startTimeText', 'summary', 'nthDayText'], (key) => {
        if (event[key]) {
          arr.push(event[key]);
        }
      });

      let ret = arr.join(' ');
      if (event.location) {
        ret += ` @${event.location}`;
      }

      return ret;
    }
  }
}
</script>

<style scoped>
.schedule {
  margin-left: 220px;
  height: 200px;
  color: #fff;
  font-size: 14px;
  text-align:left;
}
ul.days {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  list-style: none;
  margin-top: 0;
  padding: 0;
}
.today {
  flex: 1.2;
}
.upcoming {
  flex: 1;
}
li {
  display: inline-block;
  min-width: 100px;
  vertical-align: top;
  font-size: 14px;
  font-weight: 400;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
}
ul.events {
  list-style: none;
  margin-top: 0;
  padding: 0;
  margin-right: 10px;
}
li.event:not(:first-child) {
  display: block;
  margin-top: 5px;
  font-size: 14px;
  font-weight: 400;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
}
h2 {
  font-size: 22px;
  font-weight: 400;
}
h3 {
  font-size: 18px;
  font-weight: 400;
}
h2, h3 {
  line-height: 28px;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  padding: 0;
  margin: 70px 0 5px 0;
  line-height: 28px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
}

</style>
