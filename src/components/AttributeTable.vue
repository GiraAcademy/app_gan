<template>
  <div 
    v-if="isVisible"
    class="bg-white border-t-4 border-teal-600 shadow-2xl absolute bottom-0 left-0 right-0 z-[1000] flex flex-col" 
    role="region" 
    aria-label="Panel de atributos"
    :style="{ height: config.panelHeight + 'px' }"
  >
    <!-- Header Component -->
    <TableHeader
      :title="`Tabla de Atributos - ${layerName}`"
      :record-count="totalRecords"
      :show-export-button="true"
      :show-reset-button="true"
      @export="handleExport"
      @close="handleClose"
      @reset="handleReset"
    />

    <!-- Search and Controls Component -->
    <TableControls
      v-model="searchQuery"
      v-model:records-per-page="recordsPerPage"
      :total-records="totalRecords"
      :search-placeholder="config.searchPlaceholder"
    />

    <!-- Data Table Component - Flex para ocupar espacio restante -->
    <div class="flex-1 overflow-hidden">
      <DataTable
        :columns="columns"
        :data="displayData"
        :min-width="config.minTableWidth"
        :sort-column="sortColumn"
        :sort-direction="sortDirection"
        :selected-row-index="selectedRowIndex"
        :row-select-label="config.rowSelectLabel"
        @sort="handleSort"
        @row-select="handleRowSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TableHeader from './attributeTable/TableHeader.vue'
import TableControls from './attributeTable/TableControls.vue'
import DataTable from './attributeTable/DataTable.vue'
import { useTableSort } from '../composables/useTableSort'
import { useTableFilter } from '../composables/useTableFilter'
import { exportToCSV, generateFilename } from '../utils/exportUtils'

// ==========================================
// PROPS & EMITS
// ==========================================

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  layerName: {
    type: String,
    default: 'Capa'
  },
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  config: {
    type: Object,
    default: () => ({
      panelHeight: 350,
      minTableWidth: '1200px',
      searchPlaceholder: 'Buscar en los atributos...',
      rowSelectLabel: 'Clic para seleccionar fila y elemento en el mapa'
    })
  }
})

const emit = defineEmits(['close', 'row-selected', 'export', 'refresh', 'reset'])

// ==========================================
// COMPOSABLES
// ==========================================

// Ref reactivo para los datos
const dataRef = computed(() => props.data)

// Filtrado
const { searchQuery, filteredData } = useTableFilter(dataRef)

// Ordenamiento
const { sortColumn, sortDirection, sortedData, sortBy } = useTableSort(filteredData)

// ==========================================
// STATE
// ==========================================

const recordsPerPage = ref(25)
const selectedRowIndex = ref(null)

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

/**
 * Total de registros
 */
const totalRecords = computed(() => props.data.length)

/**
 * Datos a mostrar (ordenados, filtrados y paginados)
 */
const displayData = computed(() => {
  return sortedData.value.slice(0, recordsPerPage.value)
})

// ==========================================
// METHODS
// ==========================================

/**
 * Maneja el ordenamiento de columnas
 * @param {String} columnKey - Clave de la columna
 */
const handleSort = (columnKey) => {
  sortBy(columnKey)
}

/**
 * Maneja la selección de fila
 * @param {Object} row - Fila seleccionada
 * @param {Number} index - Índice de la fila
 */
const handleRowSelect = (row, index) => {
  selectedRowIndex.value = index
  emit('row-selected', row)
}

/**
 * Maneja el cierre del panel
 */
const handleClose = () => {
  // Resetear estado
  selectedRowIndex.value = null
  emit('close')
}

/**
 * Maneja el reinicio de selección
 */
const handleReset = () => {
  // Limpiar selección de fila
  selectedRowIndex.value = null
  // Emitir evento para limpiar selección en el mapa
  emit('reset')
}

/**
 * Maneja la exportación de datos
 */
const handleExport = () => {
  const filename = generateFilename(`tabla_${props.layerName.toLowerCase().replace(/\s+/g, '_')}`)
  
  // Exportar datos actuales (filtrados si hay filtro)
  const dataToExport = searchQuery.value ? filteredData.value : props.data
  
  exportToCSV(dataToExport, props.columns, filename)
  
  // Emitir evento para tracking o notificación
  emit('export', dataToExport)
}
</script>
