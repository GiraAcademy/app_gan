# App GAN - Geoportal de Análisis del Hato La Palma

Sistema de visualización y análisis geoespacial con tabla de atributos interactiva y chatbot inteligente impulsado por IA.

🌐 **Demo en vivo:** [https://gan.gira360.com/](https://gan.gira360.com/)

## 🚀 Características

- 🗺️ **Mapa interactivo** con Leaflet
- 🤖 **Chatbot de IA** con Cerebras (Qwen3-235B)
- 📊 **Tabla de atributos** dinámica y filtrable
- 📍 **Coordenadas EPSG:2202** (Panama Transverse Mercator)
- 🎨 **Diseño corporativo** con Tailwind CSS v4
- 💬 **Asistente inteligente** para consultas sobre potreros
- 📥 **Exportación a CSV** de datos
- 🔍 **Búsqueda y filtrado** en tiempo real
- 🎯 **Selección y highlight** de elementos
- 📱 **Responsive design**
- 🔎 **SEO optimizado** con meta tags, Open Graph y Schema.org

## 🛠️ Tecnologías

- **Vue.js 3.5.22** - Framework progresivo con Composition API
- **Vite** - Build tool ultra-rápido
- **Leaflet 1.9.4** - Mapas interactivos
- **Tailwind CSS v4** - Framework de estilos moderno
- **Cerebras Inference** - API de IA con modelo Qwen3-235B (235B parámetros)
- **proj4** - Transformaciones de coordenadas (EPSG:4326 → EPSG:2202)
- **GitHub Pages** - Hosting y deployment automático

## 🤖 Configuración del Chatbot con IA

El chatbot utiliza **Cerebras Inference API** con el modelo **Qwen3-235B-Instruct** (235 mil millones de parámetros) que puede generar respuestas a ~1400 tokens/segundo.

### Paso 1: Obtener API Key

1. Visita [https://cloud.cerebras.ai/](https://cloud.cerebras.ai/)
2. Crea una cuenta gratuita
3. Genera tu API key desde el dashboard

### Paso 2: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` y agrega tu API key:
   ```bash
   VITE_CEREBRAS_API_KEY=csk-tu-api-key-aqui
   ```

### Paso 3: Reiniciar el Servidor

```bash
npm run dev
```

### Modo de Demostración

Si no configuras la API key, el chatbot funcionará en **modo de demostración** con respuestas básicas predefinidas que muestran estadísticas generales de los potreros.

### Capacidades del Chatbot

Con Cerebras configurado, el asistente puede:

- ✅ Analizar estadísticas de potreros en lenguaje natural
- ✅ Responder preguntas complejas sobre superficies y distribución
- ✅ Proporcionar recomendaciones de gestión territorial
- ✅ Explicar funcionalidades del geoportal
- ✅ Ayudar con el uso de la tabla de atributos
- ✅ Interpretar coordenadas en EPSG:2202
- ✅ Realizar cálculos y comparaciones personalizadas

## 📋 Requisitos

- Node.js 20.x o superior
- npm 10.x o superior
- API key de Cerebras (opcional, para chatbot IA)

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
