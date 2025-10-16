<script setup>
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { useGeoJSONLayer } from '@/composables/useGeoJSONLayer'
import { fetchPotreros } from '@/services/potrerosService'
import {
  createPotreroPopupContent,
  potreroPopupOptions
} from '@/components/map/popupHelpers'
import { extractPotreroPopupData } from '@/utils/potreroDataHelpers'
import { potreroDefaultStyle } from '@/components/map/layerStyles'
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

const props = defineProps({
  layers: Object,
  selectedPotrero: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['updateLoading', 'updateError', 'updatePotrerosData'])

const mapContainer = ref(null)

let map = null
let satelliteLayer = null
let potrerosLayer = null
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

onMounted(async () => {
  // Cargar datos de potreros primero
  await loadPotreros()

  // Inicializar mapa con configuración estándar
  map = initializeMap({
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

  // Ajustar el mapa a los límites de los potreros
  if (potrerosGeoJSON.value) {
    fitMapToBounds({ 
      map, 
      getBounds, 
      geoJSONData: potrerosGeoJSON.value 
    })
  }

  // Agregar capas iniciales según props
  if (props.layers?.satellite) {
    satelliteLayer.addTo(map)
  }
  if (props.layers?.potreros) {
    potrerosLayer.addTo(map)
  }
})

// Watch para cambios en las capas
watch(() => props.layers, (newLayers) => {
  if (!map) return

  // Capa Satelite
  toggleLayer({
    map,
    layer: satelliteLayer,
    shouldShow: newLayers.satellite
  })

  // Capa Potreros
  toggleLayer({
    map,
    layer: potrerosLayer,
    shouldShow: newLayers.potreros
  })
}, { deep: true })

// Watch para recargar potreros si cambian los datos
watch(potrerosGeoJSON, (newData) => {
  if (!map || !newData) return

  // Remover la capa antigua
  if (potrerosLayer && map.hasLayer(potrerosLayer)) {
    map.removeLayer(potrerosLayer)
  }

  // Crear nueva capa usando el composable
  potrerosLayer = createLayer(newData)

  // Agregar si debe estar visible
  if (props.layers?.potreros) {
    potrerosLayer.addTo(map)
  }

  // Ajustar vista
  fitMapToBounds({ 
    map, 
    getBounds, 
    geoJSONData: newData 
  })
})

// Watch para manejar la selección de potrero
watch(() => props.selectedPotrero, (potreroData) => {
  if (!map) return

  if (potreroData && potreroData.geometry) {
    // Crear y mostrar resaltado
    highlightLayer = highlightPotrero({
      map,
      potreroData,
      currentHighlight: highlightLayer,
      L
    })
  } else {
    // Limpiar resaltado y volver a vista general
    clearHighlight({ map, highlightLayer })
    highlightLayer = null
    
    if (potrerosGeoJSON.value) {
      fitMapToBounds({ 
        map, 
        getBounds, 
        geoJSONData: potrerosGeoJSON.value 
      })
    }
  }
}, { deep: true })

// Exponer métodos públicos para control externo
defineExpose({
  clearSelection() {
    if (map && highlightLayer) {
      clearHighlight({ map, highlightLayer })
      highlightLayer = null
      
      // Volver a vista general
      if (potrerosGeoJSON.value) {
        fitMapToBounds({ 
          map, 
          getBounds, 
          geoJSONData: potrerosGeoJSON.value 
        })
      }
    }
  }
})
</script>

<template>
  <div ref="mapContainer" class="w-full h-full"></div>
</template>
