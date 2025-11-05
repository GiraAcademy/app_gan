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
import {
  createPotreroPopupContent,
  potreroPopupOptions,
  createLandUseChartData
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

// Registrar elementos de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, PieController)

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
let activeChart = null // Referencia al gráfico activo

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
  // Buscar el contenedor del gráfico en el popup abierto (actual)
  let popupElement = document.querySelector('.leaflet-popup-content')
  if (!popupElement) {
    console.warn('No popup element found - retrying')
    // Reintentar después de un delay adicional
    setTimeout(() => createPopupChart(properties), 100)
    return
  }
  
  let chartContainer = popupElement.querySelector('.pie-chart-container')
  if (!chartContainer) {
    console.warn('No chart container found in popup - retrying')
    // Reintentar después de un delay adicional
    setTimeout(() => createPopupChart(properties), 100)
    return
  }
  
  // Validar que existan datos de uso del suelo
  const bosquesHa = properties?.bosques_ha || 0
  const lagunaHa = properties?.laguna_ha || 0
  const pecuariHa = properties?.pecuari_ha || 0
  const total = bosquesHa + lagunaHa + pecuariHa
  
  // Si no hay datos, mostrar mensaje
  if (total === 0) {
    chartContainer.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">Sin datos disponibles</p>'
    return
  }
  
  // Limpiar contenedor completamente - Esto es crítico para el segundo popup
  chartContainer.innerHTML = ''
  
  // Crear canvas con id único basado en timestamp
  const canvasId = `pie-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const canvas = document.createElement('canvas')
  canvas.id = canvasId
  canvas.width = chartContainer.offsetWidth || 300
  canvas.height = 150
  chartContainer.appendChild(canvas)
  
  // Obtener contexto inmediatamente
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('Unable to get 2D context from canvas')
    chartContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">Error al renderizar gráfico</p>'
    return
  }
  
  // Crear datos del gráfico
  const chartData = createLandUseChartData(properties)
  
  try {
    // Destruir gráfico anterior si existe
    destroyActiveChart()
    
    // Crear nueva instancia del gráfico y guardar referencia
    activeChart = new ChartJS(ctx, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        layout: {
          padding: 10
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 11
              },
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
    
    // Extraer datos del potrero usando helper reutilizable
    const popupData = extractPotreroPopupData(feature.properties)
    
    // Crear popup con gráfico
    const popupContent = createPotreroPopupContent({
      ...popupData,
      properties: feature.properties
    }, 'default')
    
    layer.bindPopup(popupContent, potreroPopupOptions.default)
    
    // Agregar evento para crear el gráfico cuando se abre el popup
    layer.on('popupopen', (e) => {
      // Destruir gráfico anterior si existe (por si se abre otro popup sin cerrar)
      destroyActiveChart()
      
      // Crear nuevo gráfico con delay aumentado para asegurar que el DOM esté listo
      // Aumentamos a 300ms porque Leaflet puede tardar más en actualizar el popup
      setTimeout(() => {
        createPopupChart(feature.properties)
      }, 300)
    })
    
    // Agregar evento para limpiar el gráfico cuando se cierra el popup
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
  if (props.layers?.perimetro) {
    perimetroLayer.addTo(mapInstance.value)
  }
  if (props.layers?.potreros) {
    potrerosLayer.addTo(mapInstance.value)
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

  // Capa Perímetro
  toggleLayer({
    map: mapInstance.value,
    layer: perimetroLayer,
    shouldShow: newLayers.perimetro
  })

  // Capa Potreros
  toggleLayer({
    map: mapInstance.value,
    layer: potrerosLayer,
    shouldShow: newLayers.potreros
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

  // Reordenar capas para mantener perímetro debajo de potreros
  if (perimetroLayer && mapInstance.value.hasLayer(perimetroLayer)) {
    mapInstance.value.removeLayer(perimetroLayer)
  }
  if (potrerosLayer && props.layers?.potreros) {
    mapInstance.value.removeLayer(potrerosLayer)
  }
  
  // Agregar en orden correcto: perímetro primero, luego potreros
  if (props.layers?.perimetro && perimetroLayer) {
    perimetroLayer.addTo(mapInstance.value)
  }
  if (props.layers?.potreros && potrerosLayer) {
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

  // Reordenar capas para mantener perímetro debajo de potreros
  if (perimetroLayer && mapInstance.value.hasLayer(perimetroLayer)) {
    mapInstance.value.removeLayer(perimetroLayer)
  }
  if (potrerosLayer && mapInstance.value.hasLayer(potrerosLayer)) {
    mapInstance.value.removeLayer(potrerosLayer)
  }
  
  // Agregar en orden correcto: perímetro primero, luego potreros
  if (props.layers?.perimetro && perimetroLayer) {
    perimetroLayer.addTo(mapInstance.value)
  }
  if (props.layers?.potreros && potrerosLayer) {
    potrerosLayer.addTo(mapInstance.value)
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
