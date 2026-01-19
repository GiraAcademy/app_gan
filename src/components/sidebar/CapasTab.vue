<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['toggleLayer', 'toggleAttributeTable'])

// Props para recibir el estado de las capas desde el componente padre
const props = defineProps({
  layersLoading: {
    type: Object,
    default: () => ({})
  },
  layersError: {
    type: Object,
    default: () => ({})
  },
  layersState: {
    type: Object,
    default: () => ({
      satellite: true,
      potreros: true,
      perimetro: true,
      bosques: true,
      mde: false,
      pendiente: false,
      suelo: true
    })
  }
})

// Estructura de datos para capas - Fácil de extender
const baseLayers = ref([
  {
    id: 'satellite',
    name: 'Google Satellite Hybrid',
    icon: '🛰️',
    enabled: true,
    description: 'Capa de satélite híbrida de Google'
  },
  {
    id: 'mde',
    name: 'Modelo Digital de Elevación',
    icon: '🏔️',
    enabled: false,
    description: 'Capa raster WMS que muestra la elevación del terreno desde GeoServer GIRA360'
  },
  {
    id: 'pendiente',
    name: 'Pendiente',
    icon: '📐',
    enabled: false,
    description: 'Capa raster WMS que muestra la inclinación del terreno desde GeoServer GIRA360'
  }
])

const vectorLayers = ref([
  {
    id: 'potreros',
    name: 'Potreros',
    icon: '🟩',
    enabled: true,
    description: 'Polígonos de potreros cargados desde API',
    hasAttributes: true,
    requiresAPI: true // Indica que esta capa necesita cargar datos de API
  },
  {
    id: 'bosques',
    name: 'Bosques',
    icon: '🌲',
    enabled: true,
    description: 'Áreas boscosas cargadas desde API',
    hasAttributes: true,
    requiresAPI: true // Indica que esta capa necesita cargar datos de API
  },
  {
    id: 'perimetro',
    name: 'Perímetro',
    icon: '🟥',
    enabled: true,
    description: 'Límites del perímetro cargados desde API',
    hasAttributes: true,
    requiresAPI: true // Indica que esta capa necesita cargar datos de API
  },
  {
    id: 'suelo',
    name: 'Muestra de Suelo',
    icon: '🧪',
    enabled: true,
    description: 'Puntos de análisis de suelo cargados desde API',
    hasAttributes: true,
    requiresAPI: true // Indica que esta capa necesita cargar datos de API
  }
])

// Sincronizar el estado local con las props
watch(() => props.layersState, (newState) => {
  // Actualizar capas base
  baseLayers.value.forEach(layer => {
    if (newState[layer.id] !== undefined) {
      layer.enabled = newState[layer.id]
    }
  })

  // Actualizar capas vectoriales
  vectorLayers.value.forEach(layer => {
    if (newState[layer.id] !== undefined) {
      layer.enabled = newState[layer.id]
    }
  })
}, { deep: true, immediate: true })

// Estado reactivo de todas las capas
const layerStates = computed(() => {
  const states = {}
  baseLayers.value.forEach(layer => {
    states[layer.id] = layer.enabled
  })
  vectorLayers.value.forEach(layer => {
    states[layer.id] = layer.enabled
  })
  return states
})

function toggleLayer(layerId) {
  // Buscar en capas base
  const baseLayer = baseLayers.value.find(l => l.id === layerId)
  if (baseLayer) {
    const newState = !baseLayer.enabled
    emit('toggleLayer', layerId, newState)
    return
  }

  // Buscar en capas vectoriales
  const vectorLayer = vectorLayers.value.find(l => l.id === layerId)
  if (vectorLayer) {
    const newState = !vectorLayer.enabled
    emit('toggleLayer', layerId, newState)
  }
}

function clearBosquesCacheHandler() {
  clearBosquesCache()
  // Opcional: mostrar notificación al usuario
  alert('Caché de bosques limpiado. Los datos se recargarán desde la API en la próxima carga.')
}

function showLayerAttributes(layerId) {
  emit('toggleAttributeTable', layerId)
}

// Helper para verificar si una capa está cargando
function isLayerLoading(layerId) {
  return props.layersLoading[layerId] === true
}

// Helper para obtener el error de una capa
function getLayerError(layerId) {
  return props.layersError[layerId]
}
</script>

<template>
  <section
    id="capas"
    class="tab-panel sidebar-content w-full p-5"
    role="tabpanel"
    aria-labelledby="tab-capas"
  >
    <!-- Capas Base Section -->
    <section class="mb-2 relative z-10" aria-labelledby="base-layers-heading">
      <h2
        id="base-layers-heading"
        class="mb-4 text-gray-800 text-base font-semibold font-montserrat border-b-2 border-teal-600 pb-2 relative uppercase tracking-wide z-10 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-8 after:h-0.5 after:bg-gradient-to-r after:from-teal-600 after:to-blue-500 after:rounded-sm"
      >
        Capas Base
      </h2>

      <ul class="list-none m-0 p-0" role="list">
        <li
          v-for="layer in baseLayers"
          :key="layer.id"
          class="py-2.5 border-b border-slate-200 last:border-b-0"
        >
          <div class="flex items-center gap-2.5 transition-all duration-300 hover:pl-4 hover:bg-teal-50 hover:-mx-2.5 hover:pr-2.5 hover:rounded-md group">
            <input
              :id="layer.id"
              type="checkbox"
              :checked="layer.enabled"
              @change="toggleLayer(layer.id)"
              :aria-checked="layer.enabled"
              :aria-describedby="`${layer.id}-description`"
              class="w-[18px] h-[18px] accent-teal-600 cursor-pointer transition-transform hover:scale-110 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
            <label
              :for="layer.id"
              class="flex-1 cursor-pointer text-sm text-gray-700 font-normal select-none group-hover:text-gray-800 transition-colors"
            >
              <span class="mr-1.5">{{ layer.icon }}</span>
              <span>{{ layer.name }}</span>
            </label>
          </div>
          <!-- Descripción oculta para screen readers -->
          <span :id="`${layer.id}-description`" class="sr-only">
            {{ layer.description }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Datos Vectoriales Section -->
    <section class="mb-2 relative z-10" aria-labelledby="vector-layers-heading">
      <h2
        id="vector-layers-heading"
        class="mb-4 text-gray-800 text-base font-semibold font-montserrat border-b-2 border-teal-600 pb-2 relative uppercase tracking-wide z-10 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-8 after:h-0.5 after:bg-gradient-to-r after:from-teal-600 after:to-blue-500 after:rounded-sm"
      >
        Datos Vectoriales
      </h2>

      <ul class="list-none m-0 p-0" role="list">
        <li
          v-for="layer in vectorLayers"
          :key="layer.id"
          class="py-2.5 border-b border-slate-200 last:border-b-0"
        >
          <div class="flex items-center gap-2.5 transition-all duration-300 hover:pl-4 hover:bg-teal-50 hover:-mx-2.5 hover:pr-2.5 hover:rounded-md group">
            <input
              :id="layer.id"
              type="checkbox"
              :checked="layer.enabled"
              @change="toggleLayer(layer.id)"
              :disabled="isLayerLoading(layer.id)"
              :aria-checked="layer.enabled"
              :aria-describedby="`${layer.id}-description`"
              class="w-[18px] h-[18px] accent-teal-600 cursor-pointer transition-transform hover:scale-110 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <label
              :for="layer.id"
              class="flex-1 cursor-pointer text-sm text-gray-700 font-normal select-none group-hover:text-gray-800 transition-colors"
              :class="{ 'opacity-50': isLayerLoading(layer.id) }"
            >
              <span class="mr-1.5">{{ layer.icon }}</span>
              <span>{{ layer.name }}</span>

              <!-- Indicador de carga -->
              <span
                v-if="isLayerLoading(layer.id)"
                class="ml-2 inline-flex items-center text-xs text-teal-600"
              >
                <svg class="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando...
              </span>
            </label>

            <!-- Botón de atributos (solo si la capa lo soporta y no está cargando) -->
            <button
              v-if="layer.hasAttributes && !isLayerLoading(layer.id)"
              @click="showLayerAttributes(layer.id)"
              type="button"
              :aria-label="`Ver atributos de ${layer.name}`"
              class="ml-2 p-1.5 rounded-md text-gray-600 hover:bg-teal-100 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
              title="Ver atributos"
            >
              <svg
                class="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          <!-- Mensaje de error si existe -->
          <div
            v-if="getLayerError(layer.id)"
            class="mt-2 ml-7 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200"
          >
            <span class="font-semibold">⚠️ Error:</span> {{ getLayerError(layer.id) }}
          </div>

          <!-- Descripción oculta para screen readers -->
          <span :id="`${layer.id}-description`" class="sr-only">
            {{ layer.description }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Leyenda Section Principal -->
    <section class="mb-2 relative z-10">
      <h2 class="mb-4 text-gray-800 text-base font-semibold font-montserrat border-b-2 border-teal-600 pb-2 relative uppercase tracking-wide z-10 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-8 after:h-0.5 after:bg-gradient-to-r after:from-teal-600 after:to-blue-500 after:rounded-sm">
        Leyenda
      </h2>

      <!-- Subtítulo: Bosques -->
      <h3 class="mb-2 text-xs font-semibold text-gray-700 mt-3">🌲 Bosques</h3>
      <div class="space-y-2 mb-4">
        <!-- Laguna -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded border border-gray-300" style="background-color: #0066CC;"></div>
          <span class="text-xs text-gray-700">Laguna</span>
        </div>

        <!-- Vegetación boscosa -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded border border-gray-300" style="background-color: #006400;"></div>
          <span class="text-xs text-gray-700">Vegetación boscosa</span>
        </div>

        <!-- Área agropecuaria -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded border border-gray-300" style="background-color: #F5DEB3;"></div>
          <span class="text-xs text-gray-700">Área agropecuaria</span>
        </div>
      </div>

      <!-- Subtítulo: Fertilidad de Suelo -->
      <h3 class="mb-2 text-xs font-semibold text-gray-700 mt-3">🌱 Fertilidad de Suelo</h3>
      <div class="space-y-2">
        <!-- Ligeras -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: #22c55e;"></div>
          <span class="text-xs text-gray-700">Ligeras</span>
        </div>

        <!-- Moderadas -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: #eab308;"></div>
          <span class="text-xs text-gray-700">Moderadas</span>
        </div>

        <!-- Fuertes -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: #ff8c00;"></div>
          <span class="text-xs text-gray-700">Fuertes</span>
        </div>

        <!-- Severas -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: #ef4444;"></div>
          <span class="text-xs text-gray-700">Severas</span>
        </div>

        <!-- Sin datos -->
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full border border-gray-300" style="background-color: #9ca3af;"></div>
          <span class="text-xs text-gray-700">Sin datos</span>
        </div>
      </div>
    </section>
  </section>
</template>
