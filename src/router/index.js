import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import Board from '../components/Board.vue';

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Board',
      component: Board
    }
  ]
})
