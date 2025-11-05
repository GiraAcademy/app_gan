<script setup>
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  PieController
} from 'chart.js'
import { useGeoJSONLayer } from '@/composables/useGeoJSONLayer'
import { fetchPotreros } from '@/services/potrerosService'
import { fetchPerimetro } from '@/services/perimetroService'
import { fetchBosques } from '@/services/bosquesService'
import {
  createPotreroPopupContent,
  potreroPopupOptions,
  createLandUseChartData
} from '@/components/map/popupHelpers'
import { extractPotreroPopupData } from '@/utils/potreroDataHelpers'
import {
  potreroDefaultStyle,
  perimetroDefaultStyle,
  bosquesDefaultStyle,
  getBosquesStyle
} from '@/components/map/layerStyles'
import { logBosquesCacheInfo } from '@/utils/cacheUtils'
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
import casaIcon from '@/assets/casa.png'

// Registrar elementos de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, PieController)

// Función para volver a la vista inicial del mapa
function goHome() {
  if (mapInstance.value && potrerosGeoJSON.value) {
    console.log('Volviendo a vista inicial del mapa')
    fitMapToBounds({
      map: mapInstance.value,
      getBounds,
      geoJSONData: potrerosGeoJSON.value
    })
  } else {
    console.log('No se puede volver a vista inicial: mapa o datos no disponibles')
  }
}

const props = defineProps({
  layers: Object,
  selectedPotrero: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['updateLoading', 'updateError', 'updatePotrerosData', 'updatePerimetroData', 'updateBosquesData'])

const mapContainer = ref(null)
const mapInstance = ref(null)

let satelliteLayer = null
let potrerosLayer = null
let perimetroLayer = null
let bosquesLayer = null
let highlightLayer = null
let activeChart = null

// Función para limpiar el gráfico anterior
function destroyActiveChart() {
  if (activeChart) {
    try {
      activeChart.destroy()
      activeChart = null
    } catch (error) {
      console.error('Error al destruir gráfico anterior:', error)
    }
  }
}

// Función para crear gráfico de torta en el popup
function createPopupChart(properties) {
  let popupElement = document.querySelector('.leaflet-popup-content')
  if (!popupElement) {
    setTimeout(() => createPopupChart(properties), 100)
    return
  }

  let chartContainer = popupElement.querySelector('.pie-chart-container')
  if (!chartContainer) {
    setTimeout(() => createPopupChart(properties), 100)
    return
  }

  const bosquesHa = properties?.bosques_ha || 0
  const lagunaHa = properties?.laguna_ha || 0
  const pecuariHa = properties?.pecuari_ha || 0
  const total = bosquesHa + lagunaHa + pecuariHa

  if (total === 0) {
    chartContainer.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Sin datos disponibles</p>'
    return
  }

  chartContainer.innerHTML = ''
  const canvasId = `pie-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const canvas = document.createElement('canvas')
  canvas.id = canvasId
  canvas.width = chartContainer.offsetWidth || 300
  canvas.height = 150
  chartContainer.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('Unable to get 2D context from canvas')
    chartContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">Error al renderizar gráfico</p>'
    return
  }

  const chartData = createLandUseChartData(properties)

  try {
    destroyActiveChart()
    activeChart = new ChartJS(ctx, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11 },
              padding: 12,
              usePointStyle: true,
              boxHeight: 8
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                return `${label}: ${value.toFixed(2)} ha (${percentage}%)`
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error al crear gráfico:', error)
    chartContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">Error al renderizar gráfico</p>'
  }
}

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

    const popupData = extractPotreroPopupData(feature.properties)
    const popupContent = createPotreroPopupContent({
      ...popupData,
      properties: feature.properties
    }, 'default')

    layer.bindPopup(popupContent, potreroPopupOptions.default)

    layer.on('popupopen', (e) => {
      destroyActiveChart()
      setTimeout(() => {
        createPopupChart(feature.properties)
      }, 300)
    })

    layer.on('popupclose', () => {
      destroyActiveChart()
    })
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
    // Sin popup por ahora
  }
})

// Usar composable para manejar la capa de bosques
const {
  geoJSONData: bosquesGeoJSON,
  isLoading: bosquesLoading,
  error: bosquesError,
  loadData: loadBosques,
  createLayer: createBosquesLayer,
  getBounds: getBosquesBounds
} = useGeoJSONLayer({
  fetchData: fetchBosques,
  styleFunction: getBosquesStyle,
  onEachFeature: (feature, layer) => {
    // Sin popup por ahora
  }
})

// Estado para controlar si bosques ya se cargó (lazy loading)
const bosquesLoaded = ref(false)

// Watchers para emitir eventos
watch(isLoading, (loading) => {
  emit('updateLoading', 'potreros', loading)
})

watch(error, (err) => {
  emit('updateError', 'potreros', err)
})

watch(potrerosGeoJSON, (data) => {
  if (data) {
    emit('updatePotrerosData', data)
  }
})

watch(perimetroLoading, (loading) => {
  emit('updateLoading', 'perimetro', loading)
})

watch(perimetroError, (err) => {
  emit('updateError', 'perimetro', err)
})

watch(perimetroGeoJSON, (data) => {
  if (data) {
    emit('updatePerimetroData', data)
  }
})

watch(bosquesLoading, (loading) => {
  emit('updateLoading', 'bosques', loading)
})

watch(bosquesError, (err) => {
  emit('updateError', 'bosques', err)
})

watch(bosquesGeoJSON, (data) => {
  if (data) {
    emit('updateBosquesData', data)
    logBosquesCacheInfo()

    if (mapInstance.value && bosquesLayer) {
      if (mapInstance.value.hasLayer(bosquesLayer)) {
        mapInstance.value.removeLayer(bosquesLayer)
      }
      bosquesLayer = createBosquesLayer(data)
      if (props.layers.bosques) {
        mapInstance.value.addLayer(bosquesLayer)
      }
    }
  }
})

onMounted(async () => {
  await Promise.all([loadPotreros(), loadPerimetro()])

  mapInstance.value = initializeMap({
    container: mapContainer.value,
    center: initialMapConfig.center,
    zoom: initialMapConfig.zoom,
    L
  })

  satelliteLayer = createSatelliteLayer(L)
  potrerosLayer = potrerosGeoJSON.value
    ? createLayer(potrerosGeoJSON.value)
    : L.layerGroup()
  perimetroLayer = perimetroGeoJSON.value
    ? createPerimetroLayer(perimetroGeoJSON.value)
    : L.layerGroup()
  bosquesLayer = bosquesGeoJSON.value
    ? createBosquesLayer(bosquesGeoJSON.value)
    : L.layerGroup()

  if (potrerosGeoJSON.value) {
    fitMapToBounds({
      map: mapInstance.value,
      getBounds,
      geoJSONData: potrerosGeoJSON.value
    })
  }

  if (props.layers?.satellite) satelliteLayer.addTo(mapInstance.value)
  if (props.layers?.perimetro) perimetroLayer.addTo(mapInstance.value)
  if (props.layers?.bosques) bosquesLayer.addTo(mapInstance.value)
  if (props.layers?.potreros) potrerosLayer.addTo(mapInstance.value)
})

// Watch para cambios en las capas
watch(() => props.layers, (newLayers) => {
  if (!mapInstance.value) return

  toggleLayer({ map: mapInstance.value, layer: satelliteLayer, shouldShow: newLayers.satellite })
  toggleLayer({ map: mapInstance.value, layer: perimetroLayer, shouldShow: newLayers.perimetro })
  toggleLayer({ map: mapInstance.value, layer: potrerosLayer, shouldShow: newLayers.potreros })

  if (newLayers.bosques && !bosquesLoaded.value) {
    bosquesLoaded.value = true
    loadBosques()
  }
  toggleLayer({ map: mapInstance.value, layer: bosquesLayer, shouldShow: newLayers.bosques })
}, { deep: true })

// Watch para selección de potrero
watch(() => props.selectedPotrero, (potreroData) => {
  if (!mapInstance.value) return

  if (potreroData && potreroData.geometry) {
    highlightLayer = highlightPotrero({
      map: mapInstance.value,
      potreroData,
      currentHighlight: highlightLayer,
      L
    })
  } else {
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

// Exponer métodos públicos
defineExpose({
  clearSelection() {
    if (mapInstance.value && highlightLayer) {
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
  },

  goHome() {
    if (mapInstance.value && potrerosGeoJSON.value) {
      fitMapToBounds({
        map: mapInstance.value,
        getBounds,
        geoJSONData: potrerosGeoJSON.value
      })
    }
  }
})
</script>

<template>
  <div class="w-full h-full relative">
    <div ref="mapContainer" class="w-full h-full"></div>
    <MapCoordinatesScale v-if="mapInstance" :map="mapInstance" />
    <button
      v-if="mapInstance && potrerosGeoJSON"
      @click="goHome"
      class="absolute z-[1000] bg-white hover:bg-gray-100 border-2 border-[rgba(0,0,0,0.2)] rounded flex items-center justify-center transition-colors cursor-pointer"
      style="top: 90px; left: 11px; width: 36px; height: 36px; box-shadow: 0 1px 5px rgba(0,0,0,0.65);"
      title="Volver a vista inicial"
      aria-label="Volver a vista inicial del mapa"
    >
      <img :src="casaIcon" alt="Home" class="w-5 h-5" />
    </button>
  </div>
</template>
