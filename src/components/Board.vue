<template>
  <div class="now-and-then">
    <div class="board current">
      <ul>
        <li class="background" v-for="url in bgs" :key="url" v-bind:style="{'background-image':`url(${url})`}" />
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
  next(path) {
    this.loadImage(path).then(() => {
      this.state.bgs.push(path);
      if (this.state.bgs.length > 2) {
        this.state.bgs.shift();
      }
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
        }

        photoStore.next(json.current.path);
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
    }, 1000 * 60 * 60 * 3); // 3시간에 한번씨
  },
  beforeDestroy () {
    clearInterval(this._timer);
  },
  data () {
    return photoStore.state;
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
  position:fixed;
  left:0;
  right:0;
  top:0;
  bottom:0;
  background-position: 50% 50%;
  background-size: 100%;
  background-repeat: no-repeat;
  background-color: #000;
  opacity: 0;
  animation: showIn .5s ease 0s forwards;
}

@keyframes showIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
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
</style>
