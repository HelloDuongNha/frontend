import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css'
import 'sweetalert2/dist/sweetalert2.min.css'

// Create Vue app, add router plugin and mount to DOM
createApp(App).use(router).mount('#app')
