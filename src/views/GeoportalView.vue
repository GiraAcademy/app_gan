<script setup>
import { ref, computed } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'
import SidebarPanel from '../components/SidebarPanel.vue'
import MapContainer from '../components/MapContainer.vue'
import FloatingChatbot from '../components/FloatingChatbot.vue'
import AttributeTable from '../components/AttributeTable.vue'
import { getTableConfig, generateColumnsFromData } from '../config/tableConfigs'
import { normalizePotreroData } from '../utils/potreroDataHelpers'

const sidebarOpen = ref(false)
const showAttributeTable = ref(false)
const currentLayerType = ref('potreros') // Tipo de capa actual para la tabla
const mapContainerRef = ref(null) // Referencia al componente MapContainer
const layers = ref({
  satellite: true,
  potreros: true,
  perimetro: true
})

// Estado de carga de las capas
const layersLoading = ref({})
const layersError = ref({})

// Estado del potrero seleccionado
const selectedPotrero = ref(null)

// Datos de potreros (para el chatbot)
const potrerosData = ref(null)

// Datos de perímetro (para la tabla de atributos)
const perimetroData = ref(null)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function handleToggleLayer(layerName, isVisible) {
  layers.value[layerName] = isVisible
}

// Funciones para actualizar el estado de las capas desde MapContainer
function updateLayerLoadingState(layerId, isLoading) {
  layersLoading.value[layerId] = isLoading
}

function updateLayerError(layerId, errorMessage) {
  layersError.value[layerId] = errorMessage
}

// Manejar selección de potrero
function handleSelectPotrero(potreroData) {
  selectedPotrero.value = potreroData
}

// Actualizar datos de potreros (desde MapContainer)
function updatePotrerosData(data) {
  potrerosData.value = data
}

// Actualizar datos de perímetro (desde MapContainer)
function updatePerimetroData(data) {
  perimetroData.value = data
}

// Manejar tabla de atributos
function toggleAttributeTable(layerType = 'potreros') {
  currentLayerType.value = layerType
  showAttributeTable.value = !showAttributeTable.value
}

// Configuración de la tabla según el tipo de capa
const tableConfig = computed(() => {
  return getTableConfig(currentLayerType.value)
})

// Preparar datos para la tabla de atributos
const tableData = computed(() => {
  let data = null
  
  // Seleccionar los datos según el tipo de capa actual
  switch (currentLayerType.value) {
    case 'potreros':
      data = potrerosData.value
      break
    case 'perimetro':
      data = perimetroData.value
      break
    default:
      data = potrerosData.value // fallback
  }
  
  if (!data || !data.features) return []
  
  return data.features.map((feature, index) => {
    // Obtener el tipo de geometría
    const geometryType = feature.geometry?.type || '-'
    
    // Construir objeto con todas las propiedades
    const rowData = {
      id: index + 1,
      geometry: geometryType,
      ...feature.properties
    }
    
    return rowData
  })
})

// Columnas de la tabla - usar configuración o generar dinámicamente
const tableColumns = computed(() => {
  const config = tableConfig.value
  
  // Si la configuración tiene columnas definidas, usarlas
  if (config.columns && config.columns.length > 0) {
    return config.columns
  }
  
  // Si no, generar desde los datos
  if (tableData.value.length > 0) {
    return generateColumnsFromData(tableData.value)
  }
  
  // Columnas por defecto
  return [
    { key: 'id', label: 'ID', minWidth: '80px' },
    { key: 'geometry', label: 'GEOMETRÍA', minWidth: '120px' },
    { key: 'nombre', label: 'NOMBRE', minWidth: '150px' }
  ]
})

// Manejar selección desde la tabla
function handleTableRowSelected(row) {
  // Solo manejar selección para potreros por ahora
  if (currentLayerType.value !== 'potreros') return
  
  // El row.id es el índice + 1 (lo agregamos en tableData)
  const featureIndex = row.id - 1
  
  // Obtener el feature completo del GeoJSON original
  if (potrerosData.value?.features && potrerosData.value.features[featureIndex]) {
    const feature = potrerosData.value.features[featureIndex]
    
    // Normalizar los datos usando el helper reutilizable
    const potreroData = normalizePotreroData(feature)
    
    // Pasar al manejador principal de selección
    if (potreroData) {
      handleSelectPotrero(potreroData)
    }
  } else {
    // Fallback: buscar por propiedades si el índice no funciona
    const feature = potrerosData.value?.features.find(
      f => f.properties?.gid === row.gid || 
           f.properties?.nombre === row.nombre
    )
    
    if (feature) {
      const potreroData = normalizePotreroData(feature)
      if (potreroData) {
        handleSelectPotrero(potreroData)
      }
    }
  }
}

// Manejar exportación de datos
// La exportación ahora se maneja dentro del componente AttributeTable
function handleExportData(data) {
  // Este evento se emite desde AttributeTable después de exportar
  console.log(`✅ Exportados ${data.length} registros de ${tableConfig.value.layerName}`)
}

// Manejar reinicio de selección desde la tabla
function handleResetSelection() {
  // Limpiar selección del potrero
  selectedPotrero.value = null
  
  // Limpiar selección visual en el mapa
  if (mapContainerRef.value) {
    mapContainerRef.value.clearSelection()
  }
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <HeaderBar :on-toggle-sidebar="toggleSidebar" />

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden relative">
      <!-- Sidebar -->
      <SidebarPanel 
        :is-open="sidebarOpen"
        :layersState="layers"
        :layersLoading="layersLoading"
        :layersError="layersError"
        @toggle="toggleSidebar"
        @toggle-layer="handleToggleLayer"
        @select-potrero="handleSelectPotrero"
        @toggle-attribute-table="toggleAttributeTable"
      />

      <!-- Map Container -->
      <div class="flex-1 relative">
        <MapContainer 
          ref="mapContainerRef"
          :layers="layers"
          :selectedPotrero="selectedPotrero"
          @update-loading="updateLayerLoadingState"
          @update-error="updateLayerError"
          @update-potreros-data="updatePotrerosData"
          @update-perimetro-data="updatePerimetroData"
        />
        
        <!-- Chatbot Flotante con datos -->
        <FloatingChatbot 
          :potrerosData="potrerosData"
          :selectedPotrero="selectedPotrero"
          @select-potrero="handleSelectPotrero"
          @toggle-layer="handleToggleLayer"
        />
        
        <!-- Tabla de atributos - Reutilizable para diferentes capas -->
        <AttributeTable
          :is-visible="showAttributeTable"
          :layer-name="tableConfig.layerName"
          :data="tableData"
          :columns="tableColumns"
          :config="tableConfig"
          @close="showAttributeTable = false"
          @row-selected="handleTableRowSelected"
          @export="handleExportData"
          @refresh="updatePotrerosData"
          @reset="handleResetSelection"
        />
      </div>
    </div>
  </div>
</template>
