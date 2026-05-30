import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'

import './style.css'
import './trackers/trees/theme.css'
import './trackers/trees/graph/graph.css'
import './trackers/bees/theme.css'
import './trackers/bees/graph/graph.css'

createApp(App).use(createPinia()).use(router).mount('#app')
