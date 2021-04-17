import Vue from 'vue';
import axios from 'axios';
import VueAxios from 'vue-axios';
import vuescroll from 'vuescroll';
import App from './App.vue';

Vue.config.productionTip = false;

Vue.use(VueAxios, axios);
Vue.use(vuescroll);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
