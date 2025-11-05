import './assets/main.css'
import 'leaflet/dist/leaflet.css'

import { createApp } from 'vue'
import App from './App.vue'

// Importar utilidades de caché para hacerlas disponibles globalmente
import './utils/cacheUtils'

const app = createApp(App)

app.mount('#app')
