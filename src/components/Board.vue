<template>
  <div class="now-and-then">
    <div class="board current">
      <ul>
        <li class="background" v-for="bg in bgs" :key="bg.path" v-bind:style="{'background-image':`url(${bg.path})`}">
          <span class="date">{{bg.info | imageTime }}</span>
          <span class="info">{{bg.info | imageMeta }}</span>
        </li>
      </ul>
      <div class="header">
        <Clock />
        <Schedule />
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'underscore';
import moment from 'moment';
import Clock from './Clock.vue';
import Schedule from './Schedule.vue';

const photoStore = {
  state: {
    msg: 'test',
    bgs: []
  },
  loadImage(path) {
    return new Promise((resolve) => {
      var image = new Image();
      image.onload = function () {
        resolve();
      }
      image.src = path;
    });
  },
  next(info) {
    this.loadImage(info.path).then(() => {
      this.state.bgs.push({
        info: info,
        path: info.path
      });
      /* force delay to next tick */
      _.defer(() => {
        if (this.state.bgs.length > 2) {
          this.state.bgs.shift();
        }
      })
    });
  }
};

const fetchNext = (function () {
  let from = localStorage.getItem('from') || null;
  const host = 'http://localhost:8000/photo';
  return function () {
    const url = (from) ? `${host}?from=${from}` : host;

    fetch(url).then((res) => {
      res.json().then(json => {
        if (!json) {
          return;
        }

        if (json.next) {
          if (from) {
            localStorage.setItem('from', from);
          }
          from = json.next.id;
        } else {
          from = null;
        }

        photoStore.next(json.current);
      })
    }, _.noop);
  };
}());

export default {
  name: 'Board',
  beforeMount () {
    const INTERVAL = 1000 * 15;
    fetchNext();
    this._timer = setInterval(fetchNext, INTERVAL);
    setTimeout(() => {
      location.reload()
    }, 1000 * 60 * 60 * 3); // 3시간에 한번씩
  },
  beforeDestroy () {
    clearInterval(this._timer);
  },
  data () {
    return photoStore.state;
  },
  filters: {
    imageTime: function (info) {
      if (info.createdTime) {
        const time = moment(info.createdTime).format('YYYY. M. D ddd - h:mm a');
        return `${time}`;
      }
      return '';
    },
    imageMeta: function (info) {
      if (info.imageMediaMetadata) {
        const arr = [];
        const meta = [];
        const model = info.imageMediaMetadata.cameraModel;
        const lens = info.imageMediaMetadata.lens;
        const aperture = info.imageMediaMetadata.aperture;
        const exposureTime = (info.imageMediaMetadata.exposureTime < 1) ? '1/' + (1 / info.imageMediaMetadata.exposureTime).toFixed(0) : info.imageMediaMetadata.exposureTime;
        const iso = info.imageMediaMetadata.isoSpeed;
        const focalLength = info.imageMediaMetadata.focalLength;

        if (focalLength > 0) meta.push(`${focalLength}mm`);
        if (aperture > 0) meta.push(`f${aperture}`);
        if (exposureTime > 0) meta.push(`${exposureTime}s`);
        if (iso > 0) meta.push(`ISO ${iso}`);
        if (lens) meta.push(`${lens}`);

        if (model) {
          arr.push(model);
          if (meta.length) {
            arr.push(meta.join(', '));
          }
          return arr.join(' - ');
        }

        if (meta.length) {
          return meta.join(', ');
        }
      }
      return '';
    }
  },
  components: {
    Clock,
    Schedule
  }
}
</script>

<style scoped>
h1, h2 {
  font-weight: normal;
}

.board {
  position:fixed;
  left:0;
  right:0;
  top:0;
  bottom:0;
  background: #000;
}

.background {
  position:absolute;
  left:0;
  right:0;
  top:0;
  bottom:0;
  background-position: 50% 50%;
  background-size: 100%;
  background-repeat: no-repeat;
  background-color: #000;
  animation: showIn 1s;
}

@keyframes showIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.header {
  position:absolute;
  width: 100%;
  height: 300px;
  display:block;

  color: #fff;
  font-size: 25px;
  font-weight: 600;
  background: linear-gradient(180deg, #000, rgba(0,0,0,0));
}

ul {
  list-style-type: none;
  padding: 0 10px 0 0;
  margin: 0;
}

li {
  display: inline-block;
  padding: 0;
  margin: 0;
}

a {
  color: #42b983;
}

.info {
  position:absolute;
  color: #999;
  font-size: 12px;
  left: 10px;
  bottom: 10px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
}

.date {
  position:absolute;
  color: #fff;
  right: 10px;
  bottom: 10px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, .9), 0px 0px 2px rgba(0, 0, 0, .9);
}
</style>
