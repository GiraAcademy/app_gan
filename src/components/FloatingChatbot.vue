<script setup>
import { ref, nextTick, computed } from 'vue'
import chatIcon from '../assets/chat_ia.png'
import { sendMessageToCerebras, isCerebrasConfigured } from '../services/cerebrasService'

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
    text: '¡Hola! Soy tu asistente de IA para el Hato La Palma. 🌍\n\nPuedo ayudarte con:\n• Análisis de datos de potreros\n• Información sobre superficies y ubicaciones\n• Uso del geoportal y sus funcionalidades\n• Consultas sobre gestión territorial\n\n¿En qué puedo ayudarte?',
    sender: 'bot',
    timestamp: new Date(),
    type: 'welcome'
  }
])

const userInput = ref('')
const isTyping = ref(false)
const chatContainer = ref(null)
const conversationContext = ref([]) // Historial para el modelo

// Verificar si Cerebras está configurado
const cerebrasConfigured = computed(() => isCerebrasConfigured())

// Toggle del chatbot
function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value && isMinimized.value) {
    isMinimized.value = false
  }
  if (isOpen.value) {
    scrollToBottom()
    
    // Mostrar advertencia si no está configurado Cerebras
    if (!cerebrasConfigured.value && messages.value.length === 1) {
      messages.value.push({
        id: Date.now(),
        text: '⚠️ El chatbot está en modo de demostración. Para habilitar el asistente inteligente, configura tu API key de Cerebras en el archivo .env',
        sender: 'bot',
        timestamp: new Date(),
        type: 'warning'
      })
    }
  }
}

function minimizeChat() {
  isMinimized.value = !isMinimized.value
}

function closeChat() {
  isOpen.value = false
  isMinimized.value = false
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
  
  // Mostrar indicador de escritura
  isTyping.value = true
  
  try {
    let responseText = ''
    
    // Si Cerebras está configurado, usar IA real
    if (cerebrasConfigured.value) {
      responseText = await sendMessageToCerebras(
        conversationContext.value,
        props.potrerosData
      )
    } else {
      // Modo demo: respuesta simulada
      await new Promise(resolve => setTimeout(resolve, 1000))
      responseText = getFallbackResponse(text)
    }
    
    const botMessage = {
      id: Date.now() + 1,
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
      type: 'response'
    }
    
    messages.value.push(botMessage)
    conversationContext.value.push({ role: 'assistant', content: responseText })
    
  } catch (error) {
    console.error('Error procesando mensaje:', error)
    messages.value.push({
      id: Date.now() + 1,
      text: `❌ ${error.message || 'Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.'}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'error'
    })
  } finally {
    isTyping.value = false
    await scrollToBottom()
  }
}

// Respuesta de respaldo cuando Cerebras no está configurado
function getFallbackResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase()
  
  if (lowerMessage.includes('potrero') || lowerMessage.includes('superficie') || lowerMessage.includes('hectárea')) {
    const totalPotreros = props.potrerosData?.features?.length || 0
    const superficieTotal = props.potrerosData?.features?.reduce(
      (sum, feature) => sum + (feature.properties?.super_ha || 0), 
      0
    ).toFixed(2) || 0
    
    return `📊 Información del Hato La Palma:\n\n• Total de potreros: ${totalPotreros}\n• Superficie total: ${superficieTotal} hectáreas\n\n💡 Configura la API key de Cerebras para obtener respuestas más detalladas y personalizadas.`
  }
  
  if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
    return `🤖 Estoy en modo de demostración.\n\nPara habilitar el asistente inteligente completo:\n\n1. Obtén una API key gratuita en: https://cloud.cerebras.ai/\n2. Crea un archivo .env en la raíz del proyecto\n3. Agrega: VITE_CEREBRAS_API_KEY=tu-api-key\n4. Reinicia el servidor de desarrollo\n\nCon la IA activada podré ayudarte con análisis detallados, consultas complejas y recomendaciones personalizadas.`
  }
  
  return `Recibí tu mensaje: "${userMessage}"\n\n🤖 Estoy en modo de demostración limitada. Para respuestas inteligentes y análisis avanzados, por favor configura tu API key de Cerebras en el archivo .env\n\nMás info: https://cloud.cerebras.ai/`
}

// Scroll automático al final del chat
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

// Limpiar conversación
function clearConversation() {
  messages.value = [
    {
      id: Date.now(),
      text: '¡Hola! Soy tu asistente de IA para el Hato La Palma. 🌍\n\nPuedo ayudarte con:\n• Análisis de datos de potreros\n• Información sobre superficies y ubicaciones\n• Uso del geoportal y sus funcionalidades\n• Consultas sobre gestión territorial\n\n¿En qué puedo ayudarte?',
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

// Manejar Enter
function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
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
