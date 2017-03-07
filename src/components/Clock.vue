<template>
  <div class="clock">
    <div class="time">{{now}}</div>
    <div class="date">{{date}}</div>
  </div>
</template>

<script>

import moment from 'moment';

const time = () => {
  return moment().format('h:mm a');
};

const date = () => {
  return moment().format('YYYY/MM/DD dddd')
};

const clockStore = {
  state: {
    now: time(),
    date: date()
  },

  update() {
    this.state.now = time();
    this.state.date = date();
  }
}

export default {
  name: 'Schedule',
  beforeMount() {
    this._timer = setInterval(() => {
      clockStore.update()
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this._timer)
  },
  data() {
    return clockStore.state;
  }
}
</script>

<style scoped>
  .clock {
    position:absolute;
    top: 0;
    left: 0;
    width: 200px;
    margin: 10px;
    color: #fff;
    font-size: 22px;
    font-weight: 400;
    text-align:left;
    line-height: 28px;
    font-family: 'Roboto', Helvetica, Arial, sans-serif;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
  }
  .time {
    font-size: 40px;
    line-height: 60px;
    font-family: 'Roboto', Helvetica, Arial, sans-serif;
    font-weight: 400;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
  }
  .date {
    line-height: 28px;
    font-family: 'Roboto', Helvetica, Arial, sans-serif;
    font-weight: 300;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
  }
</style>
