import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './styles/_bsCustomizations.scss'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)
app.use(router)
app.mount('#app')