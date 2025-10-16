/**
 * Servicio para interactuar con Cerebras Inference API
 * Modelo: Qwen 3 235B Instruct
 */
import Cerebras from '@cerebras/cerebras_cloud_sdk'

const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY
const MODEL = 'qwen-3-235b-a22b-instruct-2507'

// Inicializar cliente de Cerebras
let client = null

/**
 * Inicializa el cliente de Cerebras
 */
function initializeCerebrasClient() {
  if (!CEREBRAS_API_KEY) {
    console.error('❌ CEREBRAS_API_KEY no está configurada')
    throw new Error('API key de Cerebras no configurada. Agrega VITE_CEREBRAS_API_KEY en tu archivo .env')
  }

  if (!client) {
    client = new Cerebras({
      apiKey: CEREBRAS_API_KEY
    })
  }

  return client
}

/**
 * Crea el prompt del sistema para el asistente del Hato La Palma
 */
function createSystemPrompt(potrerosData) {
  const totalPotreros = potrerosData?.features?.length || 0
  const superficieTotal = potrerosData?.features?.reduce(
    (sum, feature) => sum + (feature.properties?.super_ha || 0), 
    0
  ).toFixed(2) || 0

  // Crear lista detallada de potreros con SOLO los datos reales del endpoint
  const potrerosList = potrerosData?.features?.map(feature => {
    const props = feature.properties
    return {
      id: props.id,
      nombre: props.nombre,
      superficie_ha: props.super_ha
    }
  }) || []

  return `Eres un asistente experto en análisis geoespacial y gestión territorial del Hato La Palma.

**DATOS REALES DEL ENDPOINT - SOLO USA ESTOS DATOS:**

Total de potreros: ${totalPotreros}
Superficie total: ${superficieTotal} hectáreas

**Lista completa de potreros (ID, Nombre, Superficie en hectáreas):**
${JSON.stringify(potrerosList, null, 2)}

**REGLAS IMPORTANTES:**
⚠️ SOLO usa los campos que aparecen arriba: id, nombre y super_ha
⚠️ NO inventes datos adicionales como ubicación, tipo de pasto, ganado, etc.
⚠️ Si te preguntan por datos que no están disponibles, indica claramente que esa información no está en el sistema
⚠️ Cuando hagas cálculos, usa ÚNICAMENTE los datos de superficie (super_ha) que aparecen arriba

**Funcionalidades disponibles en el sistema:**
1. Visualización de potreros en mapa interactivo (Leaflet con EPSG:2202)
2. Tabla de atributos con los 3 campos: ID, Nombre, Superficie
3. Exportación de datos a CSV
4. Selección y resaltado de potreros en el mapa
5. Visualización de coordenadas en tiempo real (X, Y en EPSG:2202 - Panama Transverse Mercator)
6. Capas base: Satélite y OpenStreetMap

**Tu rol:**
- Ayudar a los usuarios a analizar los datos REALES de los potreros (solo ID, nombre y superficie)
- Hacer cálculos estadísticos con los datos de superficie disponibles
- Explicar cómo usar las funcionalidades del geoportal
- Responder sobre el sistema de coordenadas EPSG:2202
- Ser honesto cuando te pregunten por datos que no existen en el sistema

**Estilo de comunicación:**
- Claro, conciso y profesional
- Si no tienes un dato específico, di explícitamente: "Esa información no está disponible en el sistema actual"
- Usa emojis moderadamente para hacer la conversación más amigable
- Responde siempre en español`
}

/**
 * Envía un mensaje al modelo Cerebras y obtiene respuesta
 * @param {Array} messages - Historial de mensajes [{ role: 'user'|'assistant', content: string }]
 * @param {Object} potrerosData - Datos de los potreros para contexto
 * @returns {Promise<string>} Respuesta del modelo
 */
export async function sendMessageToCerebras(messages, potrerosData = null) {
  try {
    const cerebras = initializeCerebrasClient()

    // Construir array de mensajes con el sistema
    const systemPrompt = createSystemPrompt(potrerosData)
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    // Realizar la petición a Cerebras
    const response = await cerebras.chat.completions.create({
      model: MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9
    })

    // Extraer el contenido de la respuesta
    const assistantMessage = response.choices[0]?.message?.content

    if (!assistantMessage) {
      throw new Error('No se recibió respuesta del modelo')
    }

    return assistantMessage

  } catch (error) {
    console.error('Error al comunicarse con Cerebras:', error)
    
    // Mensajes de error más específicos
    if (error.message?.includes('API key')) {
      throw new Error('Error de autenticación. Verifica tu API key de Cerebras.')
    } else if (error.message?.includes('rate limit')) {
      throw new Error('Se ha excedido el límite de solicitudes. Intenta de nuevo en unos momentos.')
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Error de conexión. Verifica tu conexión a internet.')
    }
    
    throw new Error('Error al procesar tu consulta. Por favor, intenta de nuevo.')
  }
}

/**
 * Envía un mensaje en modo streaming (para futuras mejoras)
 * @param {Array} messages - Historial de mensajes
 * @param {Object} potrerosData - Datos de los potreros
 * @param {Function} onChunk - Callback para cada chunk recibido
 */
export async function sendMessageToCerebrasStream(messages, potrerosData, onChunk) {
  try {
    const cerebras = initializeCerebrasClient()
    const systemPrompt = createSystemPrompt(potrerosData)
    
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const stream = await cerebras.chat.completions.create({
      model: MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      stream: true
    })

    let fullResponse = ''

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullResponse += content
        if (onChunk) {
          onChunk(content)
        }
      }
    }

    return fullResponse

  } catch (error) {
    console.error('Error en streaming con Cerebras:', error)
    throw new Error('Error al procesar tu consulta en streaming.')
  }
}

/**
 * Verifica si la API key está configurada
 */
export function isCerebrasConfigured() {
  return !!CEREBRAS_API_KEY && CEREBRAS_API_KEY !== 'your-api-key-here'
}
