<template>
  <div class="absolute bottom-4 left-4 z-[999]">
    <!-- Coordenadas del cursor en EPSG:2202 -->
    <div 
      class="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200"
      v-if="coordinates.x && coordinates.y"
    >
      <div class="flex items-center gap-2 text-xs font-mono">
        <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div class="flex flex-col">
          <span class="text-gray-600">
            <span class="font-semibold text-gray-800">X:</span> {{ coordinates.x }}
          </span>
          <span class="text-gray-600">
            <span class="font-semibold text-gray-800">Y:</span> {{ coordinates.y }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import proj4 from 'proj4'

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

const coordinates = ref({
  x: null,
  y: null
})

let mouseMoveHandler = null

// Definir sistemas de coordenadas
// WGS84 (usado por Leaflet)
const WGS84 = 'EPSG:4326'

// EPSG:2202 - Panama Transverse Mercator
// Definición obtenida de https://epsg.io/2202
const EPSG2202 = '+proj=tmerc +lat_0=0 +lon_0=-80 +k=0.9996 +x_0=500000 +y_0=0 +ellps=clrk66 +units=m +no_defs +type=crs'

// Registrar la proyección EPSG:2202
proj4.defs('EPSG:2202', EPSG2202)

/**
 * Convierte coordenadas de WGS84 a EPSG:2202
 */
function convertToEPSG2202(lat, lng) {
  try {
    // proj4 espera [lng, lat] no [lat, lng]
    const [x, y] = proj4(WGS84, 'EPSG:2202', [lng, lat])
    return {
      x: x.toFixed(2), // Metros con 2 decimales
      y: y.toFixed(2)
    }
  } catch (error) {
    console.error('Error convirtiendo coordenadas:', error)
    return { x: null, y: null }
  }
}

/**
 * Inicializa los event listeners del mapa
 */
function initializeEventListeners() {
  const mapObj = props.map
  if (!mapObj) return
  
  // Event listener para movimiento del mouse
  mouseMoveHandler = (e) => {
    const converted = convertToEPSG2202(e.latlng.lat, e.latlng.lng)
    coordinates.value = {
      x: converted.x,
      y: converted.y
    }
  }
  
  mapObj.on('mousemove', mouseMoveHandler)
}

/**
 * Limpia los event listeners
 */
function cleanupEventListeners() {
  const mapObj = props.map
  if (!mapObj) return
  
  mapObj.off('mousemove', mouseMoveHandler)
}

// Watch para reinicializar cuando el mapa esté listo
watch(() => props.map, (newMap) => {
  if (newMap) {
    cleanupEventListeners()
    setTimeout(() => {
      initializeEventListeners()
    }, 100)
  }
}, { immediate: true })

onMounted(() => {
  // Esperar un tick para asegurar que el mapa esté inicializado
  setTimeout(() => {
    initializeEventListeners()
  }, 100)
})

onUnmounted(() => {
  cleanupEventListeners()
})
</script>

<style scoped>
/* Animación suave para cambios */
.backdrop-blur-sm {
  transition: all 0.2s ease-in-out;
}
</style>
