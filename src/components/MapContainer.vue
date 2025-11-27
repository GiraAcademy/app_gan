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
import { fetchSuelo } from '@/services/sueloService'
import {
  createPotreroPopupContent,
  potreroPopupOptions,
  createLandUseChartData,
  createSueloPopupContent,
  sueloPopupOptions,
  createVegetacionChartData
} from '@/components/map/popupHelpers'
import { extractPotreroPopupData } from '@/utils/potreroDataHelpers'
import {
  potreroDefaultStyle,
  perimetroDefaultStyle,
  bosquesDefaultStyle,
  getBosquesStyle,
  potreroTooltipOptions,
  sueloDefaultStyle,
  sueloHoverStyle,
  getSueloStyle,
  getSueloHoverStyle
} from '@/components/map/layerStyles'
import { logBosquesCacheInfo } from '@/utils/cacheUtils'
import {
  createSatelliteLayer,
  createMdeLayer,
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
    fitMapToBounds({
      map: mapInstance.value,
      getBounds,
      geoJSONData: potrerosGeoJSON.value
    })
  }
}

const props = defineProps({
  layers: Object,
  selectedPotrero: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['updateLoading', 'updateError', 'updatePotrerosData', 'updatePerimetroData', 'updateBosquesData', 'updateSueloData'])

const mapContainer = ref(null)
const mapInstance = ref(null)

let satelliteLayer = null
let mdeLayer = null
let potrerosLayer = null
let perimetroLayer = null
let bosquesLayer = null
let sueloLayer = null
let highlightLayer = null
let activeChart = null
let activeSueloChart = null
let potrerosLayersMap = new Map() // Mapa de id -> layer para actualizar popups

// Función para limpiar el gráfico anterior
function destroyActiveChart() {
  if (activeChart) {
    try {
      activeChart.destroy()
      activeChart = null
    } catch (error) {
      console.error('❌ Error al destruir gráfico anterior:', error)
    }
  }
}

// Función para limpiar el gráfico de suelo anterior
function destroyActiveSueloChart() {
  if (activeSueloChart) {
    try {
      activeSueloChart.destroy()
      activeSueloChart = null
    } catch (error) {
      console.error('❌ Error al destruir gráfico de suelo anterior:', error)
    }
  }
}

// Función para crear gráfico de torta en el popup
function createPopupChart(properties) {

  const maxAttempts = 50 // Máximo 50 intentos (aprox 1 segundo a 60fps)
  let attempts = 0

  function tryCreateChart() {
    attempts++

    let popupElement = document.querySelector('.leaflet-popup-content')
    if (!popupElement) {
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryCreateChart)
      } else {
        console.error('❌ No se pudo encontrar .leaflet-popup-content después de', maxAttempts, 'intentos')
      }
      return
    }

    let chartContainer = popupElement.querySelector('.pie-chart-container')
    if (!chartContainer) {
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryCreateChart)
      } else {
        console.error('❌ No se pudo encontrar .pie-chart-container después de', maxAttempts, 'intentos')
      }
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
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = chartContainer.offsetWidth || 300
    canvas.height = 150
    chartContainer.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ Unable to get 2D context from canvas')
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
          responsive: true,
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
      console.error('❌ Error al crear gráfico:', error)
      chartContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">Error al renderizar gráfico</p>'
    }
  }

  tryCreateChart()
}

// Función para crear gráfico de vegetación en el popup de suelo
function createSueloVegetacionChart(properties) {
  const maxAttempts = 50
  let attempts = 0

  function tryCreateChart() {
    attempts++

    let popupElement = document.querySelector('.leaflet-popup-content')
    if (!popupElement) {
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryCreateChart)
      } else {
        console.error('❌ No se pudo encontrar popup después de', maxAttempts, 'intentos')
      }
      return
    }

    const chartContainer = popupElement.querySelector('.pie-chart-container-suelo')
    if (!chartContainer) {
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryCreateChart)
      } else {
        console.error('❌ No se pudo encontrar .pie-chart-container-suelo')
      }
      return
    }

    // Acceder a propiedades sin tildes (como vienen de la API)
    const gramineas = properties?.gramineas || 0
    const leguminosas = properties?.leguminosas || 0
    const malezas = properties?.malezas || 0
    const total = gramineas + leguminosas + malezas

    if (total === 0) {
      chartContainer.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">Sin datos de vegetación</p>'
      return
    }

    chartContainer.innerHTML = ''
    const canvasId = `suelo-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const canvas = document.createElement('canvas')
    canvas.id = canvasId
    canvas.style.width = '100%'
    canvas.style.height = '150px'
    chartContainer.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ Unable to get 2D context from canvas')
      chartContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-2">Error al renderizar gráfico</p>'
      return
    }

    const chartData = createVegetacionChartData(properties)

    try {
      destroyActiveSueloChart()
      activeSueloChart = new ChartJS(ctx, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 5 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 10 },
                padding: 8,
                usePointStyle: true,
                boxHeight: 6
              }
            },
            tooltip: {
              padding: 8,
              titleFont: { size: 10 },
              bodyFont: { size: 9 },
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed || 0
                  return `${label}: ${value}%`
                }
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('❌ Error al crear gráfico de suelo:', error)
      chartContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-2">Error al renderizar</p>'
    }
  }

  tryCreateChart()
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

    // Guardar referencia a la layer por id
    const potreroId = feature.properties?.id
    if (potreroId) {
      potrerosLayersMap.set(potreroId, layer)
    }

    // Determinar si está seleccionado
    const isSelected = props.selectedPotrero?.id === potreroId
    const variant = isSelected ? 'selected' : 'default'

    const popupData = extractPotreroPopupData(feature.properties)
    const popupContent = createPotreroPopupContent({
      ...popupData,
      properties: feature.properties
    }, variant)

    layer.bindPopup(popupContent, potreroPopupOptions[variant])

    // Agregar tooltip con el nombre del potrero
    if (feature.properties?.nombre) {
      layer.bindTooltip(feature.properties.nombre, potreroTooltipOptions)
    }

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

// Usar composable para manejar la capa de suelo
const {
  geoJSONData: sueloGeoJSON,
  isLoading: sueloLoading,
  error: sueloError,
  loadData: loadSuelo,
  createLayer: createSueloLayer,
  getBounds: getSueloBounds
} = useGeoJSONLayer({
  fetchData: fetchSuelo,
  styleFunction: (feature) => getSueloStyle(feature),
  onEachFeature: (feature, layer) => {
    // Crear popup con información del suelo
    if (feature.properties) {
      const popupContent = createSueloPopupContent(feature)
      layer.bindPopup(popupContent, sueloPopupOptions)
    }

    // Efecto hover
    layer.on('mouseover', () => {
      if (layer.setStyle) {
        layer.setStyle(getSueloHoverStyle(feature))
      }
    })
    layer.on('mouseout', () => {
      if (layer.setStyle) {
        layer.setStyle(getSueloStyle(feature))
      }
    })

    // Crear gráfico cuando se abre el popup
    layer.on('popupopen', (e) => {
      destroyActiveSueloChart()
      setTimeout(() => {
        createSueloVegetacionChart(feature.properties)
      }, 300)
    })

    layer.on('popupclose', () => {
      destroyActiveSueloChart()
    })
  }
})

// Estado para controlar si bosques ya se cargó (lazy loading)
const bosquesLoaded = ref(false)
const sueloLoaded = ref(false)

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

watch(sueloLoading, (loading) => {
  emit('updateLoading', 'suelo', loading)
})

watch(sueloError, (err) => {
  emit('updateError', 'suelo', err)
})

watch(sueloGeoJSON, (data) => {
  if (data) {
    emit('updateSueloData', data)

    if (mapInstance.value && sueloLayer) {
      if (mapInstance.value.hasLayer(sueloLayer)) {
        mapInstance.value.removeLayer(sueloLayer)
      }
      sueloLayer = createSueloLayer(data)
      if (props.layers.suelo) {
        mapInstance.value.addLayer(sueloLayer)
      }
    }
  }
})

onMounted(async () => {
  await Promise.all([loadPotreros(), loadPerimetro(), loadSuelo()])

  // Limpiar mapa de capas anteriores
  potrerosLayersMap.clear()

  mapInstance.value = initializeMap({
    container: mapContainer.value,
    center: initialMapConfig.center,
    zoom: initialMapConfig.zoom,
    L
  })

  satelliteLayer = createSatelliteLayer(L)
  mdeLayer = createMdeLayer(L)
  potrerosLayer = potrerosGeoJSON.value
    ? createLayer(potrerosGeoJSON.value)
    : L.layerGroup()
  perimetroLayer = perimetroGeoJSON.value
    ? createPerimetroLayer(perimetroGeoJSON.value)
    : L.layerGroup()
  bosquesLayer = bosquesGeoJSON.value
    ? createBosquesLayer(bosquesGeoJSON.value)
    : L.layerGroup()
  sueloLayer = sueloGeoJSON.value
    ? createSueloLayer(sueloGeoJSON.value)
    : L.layerGroup()

  if (potrerosGeoJSON.value) {
    fitMapToBounds({
      map: mapInstance.value,
      getBounds,
      geoJSONData: potrerosGeoJSON.value
    })
  }

  if (props.layers?.satellite) satelliteLayer.addTo(mapInstance.value)
  if (props.layers?.mde) mdeLayer.addTo(mapInstance.value)
  if (props.layers?.perimetro) perimetroLayer.addTo(mapInstance.value)
  if (props.layers?.bosques) bosquesLayer.addTo(mapInstance.value)
  if (props.layers?.potreros) potrerosLayer.addTo(mapInstance.value)
  if (props.layers?.suelo) sueloLayer.addTo(mapInstance.value)
})

// Watch para cambios en las capas
watch(() => props.layers, (newLayers) => {
  if (!mapInstance.value) return

  toggleLayer({ map: mapInstance.value, layer: satelliteLayer, shouldShow: newLayers.satellite })
  toggleLayer({ map: mapInstance.value, layer: mdeLayer, shouldShow: newLayers.mde })
  toggleLayer({ map: mapInstance.value, layer: perimetroLayer, shouldShow: newLayers.perimetro })
  toggleLayer({ map: mapInstance.value, layer: potrerosLayer, shouldShow: newLayers.potreros })

  if (newLayers.bosques && !bosquesLoaded.value) {
    bosquesLoaded.value = true
    loadBosques()
  }
  toggleLayer({ map: mapInstance.value, layer: bosquesLayer, shouldShow: newLayers.bosques })

  if (newLayers.suelo && !sueloLoaded.value) {
    sueloLoaded.value = true
    loadSuelo()
  }
  toggleLayer({ map: mapInstance.value, layer: sueloLayer, shouldShow: newLayers.suelo })
}, { deep: true })

// Watch para selección de potrero
watch(() => props.selectedPotrero, (potreroData, oldPotreroData) => {
  if (!mapInstance.value) return

  // Actualizar popup del potrero previamente seleccionado
  if (oldPotreroData?.id && potrerosLayersMap.has(oldPotreroData.id)) {
    const oldLayer = potrerosLayersMap.get(oldPotreroData.id)
    const popupData = extractPotreroPopupData(oldLayer.feature.properties)
    const popupContent = createPotreroPopupContent({
      ...popupData,
      properties: oldLayer.feature.properties
    }, 'default')
    oldLayer.setPopupContent(popupContent)
    oldLayer.options.popupOptions = potreroPopupOptions.default
    
    // Si el popup está abierto, actualizar el gráfico
    if (mapInstance.value.hasLayer(oldLayer) && oldLayer.getPopup() && oldLayer.getPopup().isOpen()) {
      setTimeout(() => createPopupChart(oldLayer.feature.properties), 100)
    }
  }

  // Actualizar popup del potrero actualmente seleccionado
  if (potreroData?.id && potrerosLayersMap.has(potreroData.id)) {
    const newLayer = potrerosLayersMap.get(potreroData.id)
    const popupData = extractPotreroPopupData(newLayer.feature.properties)
    const popupContent = createPotreroPopupContent({
      ...popupData,
      properties: newLayer.feature.properties
    }, 'selected')
    newLayer.setPopupContent(popupContent)
    newLayer.options.popupOptions = potreroPopupOptions.selected
    
    // Si el popup está abierto, actualizar el gráfico
    if (mapInstance.value.hasLayer(newLayer) && newLayer.getPopup() && newLayer.getPopup().isOpen()) {
      setTimeout(() => createPopupChart(newLayer.feature.properties), 100)
    } else {
      // Si el popup no está abierto, abrirlo automáticamente
      newLayer.openPopup()
    }
  }

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
    // Resetear popup del potrero seleccionado
    if (props.selectedPotrero?.id && potrerosLayersMap.has(props.selectedPotrero.id)) {
      const layer = potrerosLayersMap.get(props.selectedPotrero.id)
      const popupData = extractPotreroPopupData(layer.feature.properties)
      const popupContent = createPotreroPopupContent({
        ...popupData,
        properties: layer.feature.properties
      }, 'default')
      layer.setPopupContent(popupContent)
      layer.options.popupOptions = potreroPopupOptions.default
      
      // Si el popup está abierto, actualizar el gráfico
      if (mapInstance.value.hasLayer(layer) && layer.getPopup() && layer.getPopup().isOpen()) {
        setTimeout(() => createPopupChart(layer.feature.properties), 100)
      }
    }

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

  selectSueloFeature(feature) {
    // Encontrar la layer del suelo y resaltarla
    if (sueloLayer && mapInstance.value) {
      sueloLayer.eachLayer((layer) => {
        if (layer.feature === feature) {
          // Cambiar el estilo para resaltar
          const highlightStyle = {
            color: '#FFD700',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9,
            radius: 10
          }
          layer.setStyle(highlightStyle)
          
          // Centrar el mapa en el feature
          if (layer.getLatLng) {
            mapInstance.value.setView(layer.getLatLng(), 15)
          }
        } else {
          // Resetear otros features
          layer.setStyle(getSueloStyle(layer.feature))
        }
      })
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
