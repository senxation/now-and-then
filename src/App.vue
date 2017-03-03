<template>
  <div id="app">
    <!--img src="./assets/logo.png"-->
    <router-view></router-view>
  </div>
</template>

<script>
import 'whatwg-fetch';
export default {
  name: 'app'
}
</script>

<style>
@import url(//fonts.googleapis.com/earlyaccess/notosanskr.css);
#app {
  font-family: 'Noto Sans KR', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  margin: 0;
}
</style>
