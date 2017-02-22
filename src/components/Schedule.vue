<template>
  <div class="schedule">
    <ul v-if="today.length || upcoming.length">
      <li class="today">
        <h2>TODAY</h2>
        <ul v-if="today.length">
          <li class="event" v-for="event in today">
            {{event.startTimeText}} {{event.summary}} {{ event.nthDayText }}
          </li>
        </ul>
        <span v-if="!today.length">일정 없음</span>
      </li>
      <li class="upcoming" v-for="day in upcoming">
        <h3>{{day | filterUpcomingDayText}}</h3>
        <ul v-if="day.events.length">
          <li class="upcoming" v-for="event in day.events">
            {{event.startTimeText}} {{ event.summary }} {{ event.nthDayText }}
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
              if (!_.find(upcoming, day => m.isSame(event.start, 'day'))) {
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

        this.state.today = _.find(upcoming, day => day.moment.isSame(moment(), 'day')).events;
        this.state.upcoming = _.first(_.filter(upcoming, day => day.moment.isAfter(moment(), 'day')), 4);
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
    }
  }
}
</script>

<style scoped>
.schedule {
  margin-left: 200px;
  height: 200px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-align:left;
}
ul {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  list-style: none;
  margin-top: 0;
  padding: 0;
}
li {
  display: inline-block;
  vertical-align: top;
  width: 80px;
  height: 80px;
}
h2 {
  font-size: 22px;
  line-height: 28px;
}
h2, h3 {
  padding: 0;
  margin: 70px 0 5px 0;
  line-height: 28px;
}

</style>
