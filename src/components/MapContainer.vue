<script setup>
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { useGeoJSONLayer } from '@/composables/useGeoJSONLayer'
import { fetchPotreros } from '@/services/potrerosService'
import { fetchPerimetro } from '@/services/perimetroService'
import {
  createPotreroPopupContent,
  potreroPopupOptions
} from '@/components/map/popupHelpers'
import { extractPotreroPopupData } from '@/utils/potreroDataHelpers'
import { potreroDefaultStyle, perimetroDefaultStyle } from '@/components/map/layerStyles'
import { 
  createSatelliteLayer,
  initialMapConfig
} from '@/components/map/baseLayersConfig'
import { 
  highlightPotrero,
  clearHighlight
} from '@/components/map/highlightHelpers'
import { 
  fitMapToBounds,
  toggleLayer,
  initializeMap
} from '@/components/map/mapUtils'
import MapCoordinatesScale from '@/components/map/MapCoordinatesScale.vue'

const props = defineProps({
  layers: Object,
  selectedPotrero: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['updateLoading', 'updateError', 'updatePotrerosData', 'updatePerimetroData'])

const mapContainer = ref(null)
const mapInstance = ref(null) // Ref reactivo para el mapa

let satelliteLayer = null
let potrerosLayer = null
let perimetroLayer = null
let highlightLayer = null // Capa para resaltar el potrero seleccionado

// Usar composable para manejar la capa de potreros
const {
  geoJSONData: potrerosGeoJSON,
  isLoading,
  error,
  loadData: loadPotreros,
  createLayer,
  getBounds
} = useGeoJSONLayer({
  fetchData: fetchPotreros,
  styleFunction: () => potreroDefaultStyle,
  onEachFeature: (feature, layer) => {
    if (!feature.properties) return
    
    // Extraer datos del potrero usando helper reutilizable
    const popupData = extractPotreroPopupData(feature.properties)
    
    // Popup al hacer clic (variante 'default')
    const popupContent = createPotreroPopupContent(popupData, 'default')
    layer.bindPopup(popupContent, potreroPopupOptions.default)
  }
})

// Usar composable para manejar la capa de perímetro
const {
  geoJSONData: perimetroGeoJSON,
  isLoading: perimetroLoading,
  error: perimetroError,
  loadData: loadPerimetro,
  createLayer: createPerimetroLayer,
  getBounds: getPerimetroBounds
} = useGeoJSONLayer({
  fetchData: fetchPerimetro,
  styleFunction: () => perimetroDefaultStyle,
  onEachFeature: (feature, layer) => {
    // Perímetro podría tener popup si es necesario
    // Por ahora, sin popup
  }
})

// Watch para emitir cambios en el estado de carga
watch(isLoading, (loading) => {
  emit('updateLoading', 'potreros', loading)
})

// Watch para emitir errores
watch(error, (err) => {
  emit('updateError', 'potreros', err)
})

// Watch para emitir datos de potreros al chatbot
watch(potrerosGeoJSON, (data) => {
  if (data) {
    emit('updatePotrerosData', data)
  }
})

// Watch para emitir cambios en el estado de carga del perímetro
watch(perimetroLoading, (loading) => {
  emit('updateLoading', 'perimetro', loading)
})

// Watch para emitir errores del perímetro
watch(perimetroError, (err) => {
  emit('updateError', 'perimetro', err)
})

// Watch para emitir datos de perímetro
watch(perimetroGeoJSON, (data) => {
  if (data) {
    emit('updatePerimetroData', data)
  }
})

onMounted(async () => {
  // Cargar datos de potreros y perímetro en paralelo
  await Promise.all([loadPotreros(), loadPerimetro()])

  // Inicializar mapa con configuración estándar
  mapInstance.value = initializeMap({
    container: mapContainer.value,
    center: initialMapConfig.center,
    zoom: initialMapConfig.zoom,
    L
  })

  // Crear capa satelital
  satelliteLayer = createSatelliteLayer(L)

  // Crear capa de potreros desde GeoJSON
  potrerosLayer = potrerosGeoJSON.value 
    ? createLayer(potrerosGeoJSON.value)
    : L.layerGroup()

  // Crear capa de perímetro desde GeoJSON
  perimetroLayer = perimetroGeoJSON.value 
    ? createPerimetroLayer(perimetroGeoJSON.value)
    : L.layerGroup()

  // Ajustar el mapa a los límites de los potreros (prioridad)
  if (potrerosGeoJSON.value) {
    fitMapToBounds({ 
      map: mapInstance.value, 
      getBounds, 
      geoJSONData: potrerosGeoJSON.value 
    })
  }

  // Agregar capas iniciales según props
  if (props.layers?.satellite) {
    satelliteLayer.addTo(mapInstance.value)
  }
  if (props.layers?.potreros) {
    potrerosLayer.addTo(mapInstance.value)
  }
  if (props.layers?.perimetro) {
    perimetroLayer.addTo(mapInstance.value)
  }
})

// Watch para cambios en las capas
watch(() => props.layers, (newLayers) => {
  if (!mapInstance.value) return

  // Capa Satelite
  toggleLayer({
    map: mapInstance.value,
    layer: satelliteLayer,
    shouldShow: newLayers.satellite
  })

  // Capa Potreros
  toggleLayer({
    map: mapInstance.value,
    layer: potrerosLayer,
    shouldShow: newLayers.potreros
  })

  // Capa Perímetro
  toggleLayer({
    map: mapInstance.value,
    layer: perimetroLayer,
    shouldShow: newLayers.perimetro
  })
}, { deep: true })

// Watch para recargar potreros si cambian los datos
watch(potrerosGeoJSON, (newData) => {
  if (!mapInstance.value || !newData) return

  // Remover la capa antigua
  if (potrerosLayer && mapInstance.value.hasLayer(potrerosLayer)) {
    mapInstance.value.removeLayer(potrerosLayer)
  }

  // Crear nueva capa usando el composable
  potrerosLayer = createLayer(newData)

  // Agregar si debe estar visible
  if (props.layers?.potreros) {
    potrerosLayer.addTo(mapInstance.value)
  }

  // Ajustar vista
  fitMapToBounds({ 
    map: mapInstance.value, 
    getBounds, 
    geoJSONData: newData 
  })
})

// Watch para recargar perímetro si cambian los datos
watch(perimetroGeoJSON, (newData) => {
  if (!mapInstance.value) return

  // Remover la capa antigua
  if (perimetroLayer && mapInstance.value.hasLayer(perimetroLayer)) {
    mapInstance.value.removeLayer(perimetroLayer)
  }

  // Crear nueva capa usando el composable
  if (newData) {
    perimetroLayer = createPerimetroLayer(newData)
  } else {
    perimetroLayer = L.layerGroup()
  }

  // Agregar si debe estar visible
  if (props.layers?.perimetro) {
    perimetroLayer.addTo(mapInstance.value)
  }
})

// Watch para manejar la selección de potrero
watch(() => props.selectedPotrero, (potreroData) => {
  if (!mapInstance.value) return

  if (potreroData && potreroData.geometry) {
    // Crear y mostrar resaltado
    highlightLayer = highlightPotrero({
      map: mapInstance.value,
      potreroData,
      currentHighlight: highlightLayer,
      L
    })
  } else {
    // Limpiar resaltado y volver a vista general
    clearHighlight({ map: mapInstance.value, highlightLayer })
    highlightLayer = null
    
    if (potrerosGeoJSON.value) {
      fitMapToBounds({ 
        map: mapInstance.value, 
        getBounds, 
        geoJSONData: potrerosGeoJSON.value 
      })
    }
  }
}, { deep: true })

// Exponer métodos públicos para control externo
defineExpose({
  clearSelection() {
    if (mapInstance.value && highlightLayer) {
      clearHighlight({ map: mapInstance.value, highlightLayer })
      highlightLayer = null
      
      // Volver a vista general
      if (potrerosGeoJSON.value) {
        fitMapToBounds({ 
          map: mapInstance.value, 
          getBounds, 
          geoJSONData: potrerosGeoJSON.value 
        })
      }
    }
  }
})
</script>

<template>
  <div class="w-full h-full relative">
    <div ref="mapContainer" class="w-full h-full"></div>
    
    <!-- Componente de coordenadas y escala -->
    <MapCoordinatesScale v-if="mapInstance" :map="mapInstance" />
  </div>
</template>
