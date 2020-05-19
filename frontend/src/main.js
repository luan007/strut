import * as vue_components from "../components/*.vue";
import "fontawesome-pro-all/js/all"
import Vue from 'vue/dist/vue'
import "./dressing.less";

for(var i in vue_components) {
    if(i == 'default') continue;
    Vue.component(i, vue_components[i].default);
}

new Vue({
    el: '#app',
    data: {
    }
})