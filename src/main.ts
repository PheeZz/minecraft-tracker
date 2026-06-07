import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'

import './reset.css'
import './style.css'
import './trackers/trees/theme.css'
import './trackers/bees/theme.css'
import './trackers/genetics/theme.css'
import './trackers/thaumcraft/theme.css'

const app = createApp(App)

// Глобальный перехват ошибок вне дерева рендера (вотчеры, асинхронные коллбэки
// и т.п.). Рендер-ошибки компонентов ловит ErrorBoundary в App.vue.
app.config.errorHandler = (err, _instance, info) => {
  console.error('[app error]', info, err)
}

app.use(createPinia()).use(router).mount('#app')
