<script setup>
import { ref, nextTick, inject } from 'vue'
import chatIcon from '../assets/chat_ia.png'

// Props para interactuar con el mapa y datos
const props = defineProps({
  potrerosData: {
    type: Object,
    default: () => null
  },
  selectedPotrero: {
    type: Object,
    default: () => null
  }
})

// Emits para controlar el mapa
const emit = defineEmits(['selectPotrero', 'toggleLayer', 'fitBounds'])

// Estado del chatbot
const isOpen = ref(false)
const isMinimized = ref(false)
const messages = ref([
  {
    id: 1,
    text: '¡Hola! Soy tu asistente de IA para análisis geoespacial de GIRA. 🌍\n\nPuedo ayudarte a:\n• Analizar datos de potreros\n• Buscar y filtrar información\n• Calcular estadísticas\n• Interactuar con el mapa\n• Responder preguntas sobre los datos\n\n¿En qué puedo ayudarte?',
    sender: 'bot',
    timestamp: new Date(),
    type: 'welcome'
  }
])

const userInput = ref('')
const isTyping = ref(false)
const chatContainer = ref(null)
const conversationContext = ref([]) // Historial para contexto de IA

// Toggle del chatbot
function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value && isMinimized.value) {
    isMinimized.value = false
  }
  if (isOpen.value) {
    scrollToBottom()
  }
}

function minimizeChat() {
  isMinimized.value = !isMinimized.value
}

function closeChat() {
  isOpen.value = false
  isMinimized.value = false
}

// Intenciones del usuario (se expandirá con IA)
const intentPatterns = {
  // Análisis de datos
  statistics: {
    keywords: ['total', 'suma', 'promedio', 'estadística', 'cuántos', 'cuántas'],
    action: 'analyzeStatistics'
  },
  
  // Búsqueda y filtrado
  search: {
    keywords: ['buscar', 'encontrar', 'mostrar', 'ver', 'dónde está', 'ubicación'],
    action: 'searchPotrero'
  },
  
  // Comparación
  compare: {
    keywords: ['comparar', 'mayor', 'menor', 'más grande', 'más pequeño', 'diferencia'],
    action: 'comparePotreros'
  },
  
  // Interacción con mapa
  map: {
    keywords: ['mapa', 'zoom', 'acercar', 'alejar', 'centrar', 'capa'],
    action: 'mapInteraction'
  },
  
  // Información específica
  info: {
    keywords: ['información', 'detalles', 'datos', 'características', 'qué es'],
    action: 'getInfo'
  },
  
  // Ayuda
  help: {
    keywords: ['ayuda', 'help', 'qué puedes hacer', 'comandos', 'opciones'],
    action: 'showHelp'
  }
}

// Enviar mensaje
async function sendMessage() {
  const text = userInput.value.trim()
  
  if (!text) return
  
  // Agregar mensaje del usuario
  const userMessage = {
    id: Date.now(),
    text: text,
    sender: 'user',
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  conversationContext.value.push({ role: 'user', content: text })
  
  userInput.value = ''
  await scrollToBottom()
  
  // Simular procesamiento de IA
  isTyping.value = true
  
  try {
    // Simular delay de procesamiento (en el futuro será llamada a OpenAI)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))
    
    // Procesar mensaje y obtener respuesta
    const response = await processUserMessage(text)
    
    const botMessage = {
      id: Date.now() + 1,
      text: response.text,
      sender: 'bot',
      timestamp: new Date(),
      type: response.type,
      data: response.data
    }
    
    messages.value.push(botMessage)
    conversationContext.value.push({ role: 'assistant', content: response.text })
    
    // Ejecutar acciones si las hay
    if (response.action) {
      executeAction(response.action, response.data)
    }
    
  } catch (error) {
    console.error('Error procesando mensaje:', error)
    messages.value.push({
      id: Date.now() + 1,
      text: 'Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.',
      sender: 'bot',
      timestamp: new Date(),
      type: 'error'
    })
  } finally {
    isTyping.value = false
    await scrollToBottom()
  }
}

// Procesar mensaje del usuario (placeholder para futura integración con OpenAI)
async function processUserMessage(userMessage) {
  const lowerMessage = userMessage.toLowerCase()
  
  // Detectar intención
  const intent = detectIntent(lowerMessage)
  
  // Procesar según la intención
  switch (intent.action) {
    case 'analyzeStatistics':
      return analyzeStatistics(userMessage, lowerMessage)
      
    case 'searchPotrero':
      return searchPotrero(userMessage, lowerMessage)
      
    case 'comparePotreros':
      return comparePotreros(userMessage, lowerMessage)
      
    case 'mapInteraction':
      return handleMapInteraction(userMessage, lowerMessage)
      
    case 'getInfo':
      return getInformation(userMessage, lowerMessage)
      
    case 'showHelp':
      return showHelp()
      
    default:
      return getDefaultResponse(userMessage)
  }
}

// Detectar intención del usuario
function detectIntent(message) {
  for (const [intentName, intent] of Object.entries(intentPatterns)) {
    if (intent.keywords.some(keyword => message.includes(keyword))) {
      return { name: intentName, ...intent }
    }
  }
  return { name: 'unknown', action: 'default' }
}

// === FUNCIONES DE ANÁLISIS ===

// Analizar estadísticas
function analyzeStatistics(original, lower) {
  if (!props.potrerosData || !props.potrerosData.features) {
    return {
      text: 'No hay datos de potreros disponibles en este momento. Por favor asegúrate de que la capa de potreros esté activa.',
      type: 'info'
    }
  }
  
  const features = props.potrerosData.features
  const superficies = features.map(f => f.properties.super_ha || 0)
  
  const total = superficies.reduce((sum, val) => sum + val, 0)
  const promedio = total / features.length
  const max = Math.max(...superficies)
  const min = Math.min(...superficies)
  
  const maxPotrero = features.find(f => f.properties.super_ha === max)
  const minPotrero = features.find(f => f.properties.super_ha === min)
  
  return {
    text: `📊 **Análisis Estadístico de Potreros**\n\n` +
          `**Total de potreros:** ${features.length}\n` +
          `**Superficie total:** ${total.toFixed(2)} ha\n` +
          `**Superficie promedio:** ${promedio.toFixed(2)} ha\n\n` +
          `**Potrero más grande:** ${maxPotrero?.properties.nombre || 'N/A'} (${max.toFixed(2)} ha)\n` +
          `**Potrero más pequeño:** ${minPotrero?.properties.nombre || 'N/A'} (${min.toFixed(2)} ha)`,
    type: 'statistics',
    data: { total, promedio, max, min, count: features.length }
  }
}

// Buscar potrero
function searchPotrero(original, lower) {
  if (!props.potrerosData || !props.potrerosData.features) {
    return {
      text: 'No hay datos de potreros disponibles para buscar.',
      type: 'info'
    }
  }
  
  const features = props.potrerosData.features
  
  // Extraer posible nombre del potrero del mensaje
  const palabras = original.split(' ')
  const potencialNombre = palabras.slice(1).join(' ').toLowerCase()
  
  const encontrados = features.filter(f => 
    f.properties.nombre?.toLowerCase().includes(potencialNombre)
  )
  
  if (encontrados.length === 0) {
    const nombres = features.map(f => f.properties.nombre).join(', ')
    return {
      text: `No encontré ningún potrero con ese nombre. Los potreros disponibles son:\n\n${nombres}`,
      type: 'search'
    }
  }
  
  if (encontrados.length === 1) {
    const potrero = encontrados[0].properties
    return {
      text: `🔍 **Potrero Encontrado**\n\n` +
            `**Nombre:** ${potrero.nombre}\n` +
            `**Superficie:** ${potrero.super_ha?.toFixed(2) || 'N/A'} ha\n` +
            `**ID:** ${potrero.id}\n\n` +
            `¿Deseas que lo seleccione en el mapa?`,
      type: 'search',
      data: { potrero: encontrados[0] },
      action: 'selectPotrero'
    }
  }
  
  const lista = encontrados.map(f => 
    `• ${f.properties.nombre} (${f.properties.super_ha?.toFixed(2)} ha)`
  ).join('\n')
  
  return {
    text: `Encontré ${encontrados.length} potreros:\n\n${lista}`,
    type: 'search',
    data: { potreros: encontrados }
  }
}

// Comparar potreros
function comparePotreros(original, lower) {
  if (!props.potrerosData || !props.potrerosData.features) {
    return {
      text: 'No hay datos disponibles para comparar.',
      type: 'info'
    }
  }
  
  const features = props.potrerosData.features
  
  if (lower.includes('mayor') || lower.includes('más grande')) {
    const sorted = [...features].sort((a, b) => 
      (b.properties.super_ha || 0) - (a.properties.super_ha || 0)
    )
    const top3 = sorted.slice(0, 3)
    
    const lista = top3.map((f, i) => 
      `${i + 1}. ${f.properties.nombre} - ${f.properties.super_ha?.toFixed(2)} ha`
    ).join('\n')
    
    return {
      text: `🏆 **Top 3 Potreros Más Grandes**\n\n${lista}`,
      type: 'comparison',
      data: { potreros: top3 }
    }
  }
  
  if (lower.includes('menor') || lower.includes('más pequeño')) {
    const sorted = [...features].sort((a, b) => 
      (a.properties.super_ha || 0) - (b.properties.super_ha || 0)
    )
    const bottom3 = sorted.slice(0, 3)
    
    const lista = bottom3.map((f, i) => 
      `${i + 1}. ${f.properties.nombre} - ${f.properties.super_ha?.toFixed(2)} ha`
    ).join('\n')
    
    return {
      text: `📉 **Top 3 Potreros Más Pequeños**\n\n${lista}`,
      type: 'comparison',
      data: { potreros: bottom3 }
    }
  }
  
  return {
    text: 'Puedo comparar potreros por tamaño. Prueba preguntando:\n• "¿Cuáles son los potreros más grandes?"\n• "¿Cuáles son los potreros más pequeños?"',
    type: 'info'
  }
}

// Interacción con mapa
function handleMapInteraction(original, lower) {
  if (lower.includes('capa')) {
    return {
      text: 'Puedo ayudarte con las capas del mapa. Las capas disponibles son:\n\n• **Satélite** - Vista satelital del terreno\n• **Potreros** - Polígonos de potreros\n\nPuedes activarlas o desactivarlas desde el panel lateral.',
      type: 'map'
    }
  }
  
  if (lower.includes('zoom') || lower.includes('acercar') || lower.includes('alejar')) {
    return {
      text: 'Para hacer zoom en el mapa:\n• Usa la rueda del mouse\n• Usa los botones + y - en el mapa\n• Haz doble clic para acercar\n\n¿Necesitas que centre el mapa en algún potrero específico?',
      type: 'map'
    }
  }
  
  return {
    text: 'Puedo ayudarte a interactuar con el mapa. Puedes preguntarme sobre:\n• Capas disponibles\n• Cómo hacer zoom\n• Centrar el mapa en un potrero',
    type: 'map'
  }
}

// Obtener información
function getInformation(original, lower) {
  if (props.selectedPotrero) {
    const p = props.selectedPotrero
    return {
      text: `📍 **Potrero Seleccionado Actualmente**\n\n` +
            `**Nombre:** ${p.nombre}\n` +
            `**Superficie:** ${p.superficie?.toFixed(2) || 'N/A'} ha\n` +
            `**ID:** ${p.id}`,
      type: 'info'
    }
  }
  
  return {
    text: 'Puedo proporcionar información sobre:\n• Potreros individuales\n• Estadísticas generales\n• Funcionalidades del sistema\n\n¿Qué te gustaría saber?',
    type: 'info'
  }
}

// Mostrar ayuda
function showHelp() {
  return {
    text: `🤖 **Comandos y Capacidades**\n\n` +
          `**Análisis de Datos:**\n` +
          `• "Estadísticas de potreros"\n` +
          `• "¿Cuál es la superficie total?"\n` +
          `• "¿Cuántos potreros hay?"\n\n` +
          `**Búsqueda:**\n` +
          `• "Buscar potrero [nombre]"\n` +
          `• "Mostrar información de [nombre]"\n\n` +
          `**Comparación:**\n` +
          `• "¿Cuáles son los potreros más grandes?"\n` +
          `• "Comparar potreros por tamaño"\n\n` +
          `**Interacción con Mapa:**\n` +
          `• "¿Cómo hacer zoom?"\n` +
          `• "Información sobre capas"\n\n` +
          `_Próximamente: Integración con IA avanzada para consultas en lenguaje natural._`,
    type: 'help'
  }
}

// Respuesta por defecto
function getDefaultResponse(message) {
  return {
    text: `Entiendo tu consulta. En este momento puedo ayudarte con:\n\n` +
          `• Análisis estadísticos de potreros\n` +
          `• Búsqueda de potreros específicos\n` +
          `• Comparaciones entre potreros\n` +
          `• Información sobre el mapa\n\n` +
          `_Nota: Pronto me conectaré con IA avanzada para responder preguntas más complejas._\n\n` +
          `Escribe "ayuda" para ver ejemplos de comandos.`,
    type: 'default'
  }
}

// Ejecutar acciones en el mapa
function executeAction(action, data) {
  switch (action) {
    case 'selectPotrero':
      if (data && data.potrero) {
        const props = data.potrero.properties
        emit('selectPotrero', {
          id: props.id,
          nombre: props.nombre,
          superficie: props.super_ha,
          geometry: data.potrero.geometry
        })
      }
      break
      
    case 'toggleLayer':
      if (data && data.layerName) {
        emit('toggleLayer', data.layerName, data.visible)
      }
      break
      
    case 'fitBounds':
      emit('fitBounds')
      break
  }
}

// === PLACEHOLDER PARA INTEGRACIÓN CON OPENAI ===
/*
async function callOpenAI(userMessage) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  const systemPrompt = `Eres un asistente de IA especializado en análisis geoespacial 
  para el sistema GIRA. Tienes acceso a datos de potreros agrícolas y puedes ayudar 
  con análisis, búsquedas y visualización de datos en el mapa.
  
  Datos disponibles: ${JSON.stringify({
    totalPotreros: props.potrerosData?.features?.length || 0,
    potreros: props.potrerosData?.features?.map(f => ({
      nombre: f.properties.nombre,
      superficie: f.properties.super_ha
    })) || []
  })}`
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationContext.value,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })
  
  const data = await response.json()
  return data.choices[0].message.content
}
*/

// Scroll al final
async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Formatear timestamp
function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Manejar Enter
function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// Sugerencias rápidas inteligentes
const quickSuggestions = [
  'Estadísticas de potreros',
  '¿Cuáles son los más grandes?',
  'Ayuda'
]

function selectSuggestion(suggestion) {
  userInput.value = suggestion
  sendMessage()
}

// Limpiar conversación
function clearConversation() {
  messages.value = [
    {
      id: Date.now(),
      text: '¡Hola! Soy tu asistente de IA para análisis geoespacial de GIRA. 🌍\n\nPuedo ayudarte a:\n• Analizar datos de potreros\n• Buscar y filtrar información\n• Calcular estadísticas\n• Interactuar con el mapa\n• Responder preguntas sobre los datos\n\n¿En qué puedo ayudarte?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome'
    }
  ]
  conversationContext.value = []
}

// Formatear mensajes con markdown básico
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
    <!-- Ventana del Chat -->
    <Transition name="slide-up">
      <div 
        v-if="isOpen"
        :class="[
          'bg-white rounded-2xl shadow-2xl mb-4 overflow-hidden border border-gray-200 transition-all duration-300',
          isMinimized ? 'h-14' : 'h-[500px] w-[380px]'
        ]"
      >
        <!-- Header -->
        <header class="px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md p-1">
              <img :src="chatIcon" alt="Chat IA" class="w-full h-full object-contain" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">Asistente GIRA</h3>
              <p class="text-xs text-white/80">En línea</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="minimizeChat"
              class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              :title="isMinimized ? 'Maximizar' : 'Minimizar'"
            >
              <span class="text-lg">{{ isMinimized ? '▢' : '−' }}</span>
            </button>
            <button
              @click="closeChat"
                class="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              title="Cerrar"
            >
              <span class="text-lg">✕</span>
            </button>
          </div>
        </header>        <!-- Contenido del Chat (solo visible si no está minimizado) -->
        <div v-if="!isMinimized" class="flex flex-col h-[calc(500px-56px)]">
          <!-- Mensajes -->
          <div 
            ref="chatContainer"
            class="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll bg-gradient-to-b from-white to-gray-50"
          >
            <div 
              v-for="message in messages" 
              :key="message.id"
              :class="['flex', message.sender === 'user' ? 'justify-end' : 'justify-start']"
            >
              <div 
                :class="[
                  'max-w-[75%] rounded-xl px-3 py-2 shadow-sm',
                  message.sender === 'user' 
                    ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-md' 
                    : message.type === 'error'
                    ? 'bg-red-50 text-red-800 rounded-bl-md border border-red-200'
                    : message.type === 'statistics'
                    ? 'bg-blue-50 text-blue-900 rounded-bl-md border border-blue-200'
                    : message.type === 'welcome'
                    ? 'bg-gradient-to-br from-accent/10 to-primary/10 text-gray-800 rounded-bl-md border border-accent/30'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                ]"
              >
                <p class="text-sm whitespace-pre-line leading-relaxed font-normal" v-html="formatMessage(message.text)"></p>
                <p 
                  :class="[
                    'text-[10px] mt-1',
                    message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                  ]"
                >
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
            </div>

            <!-- Indicador de escritura -->
            <div v-if="isTyping" class="flex justify-start">
              <div class="bg-white rounded-xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
                <div class="flex gap-1">
                  <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
                  <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                  <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sugerencias rápidas -->
          <div v-if="messages.length <= 2" class="px-4 pb-2 bg-gray-50">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(suggestion, index) in quickSuggestions"
                :key="index"
                @click="selectSuggestion(suggestion)"
                class="px-2.5 py-1.5 text-xs bg-white border border-primary/30 text-primary rounded-lg hover:bg-accent/10 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Input -->
          <footer class="px-4 py-3 bg-white border-t border-gray-200">
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <textarea
                v-model="userInput"
                @keydown="handleKeydown"
                placeholder="Escribe tu mensaje..."
                rows="1"
                class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-gray-50 transition-all"
                style="max-height: 80px"
              ></textarea>
              <button
                type="submit"
                :disabled="!userInput.trim()"
                class="px-3 py-2 bg-gradient-to-br from-primary to-secondary text-white rounded-lg hover:from-secondary hover:to-primary disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center min-w-[40px]"
              >
                <span class="text-base">📤</span>
              </button>
            </form>
          </footer>
        </div>
      </div>
    </Transition>

    <!-- Botón flotante -->
    <button
      @click="toggleChat"
      :class="[
        'w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden',
        isOpen 
          ? 'bg-gray-600 hover:bg-gray-700' 
          : 'bg-white hover:bg-gray-50 animate-pulse-slow'
      ]"
      :title="isOpen ? 'Cerrar chat' : 'Abrir chat'"
    >
      <img 
        v-if="!isOpen" 
        :src="chatIcon" 
        alt="Chat IA" 
        class="w-12 h-12 object-contain"
      />
      <span v-else class="text-2xl text-white">✕</span>
    </button>

    <!-- Badge de notificación (opcional) -->
    <span 
      v-if="!isOpen"
      class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md animate-bounce"
    >
      !
    </span>
  </div>
</template>

<style scoped>
.chat-scroll {
  scrollbar-width: thin;
  scrollbar-color: #0396A6 #f1f5f9;
}

.chat-scroll::-webkit-scrollbar {
  width: 5px;
}

.chat-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: #0396A6;
  border-radius: 3px;
}

.chat-scroll::-webkit-scrollbar-thumb:hover {
  background: #015059;
}

/* Animación de bounce personalizada */
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out;
}

/* Animación de pulso lento */
@keyframes pulse-slow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 203, 169, 0.7);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(0, 203, 169, 0);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2.5s infinite;
}

/* Transición slide-up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
