<template>
  <div class="h-full bg-white overflow-hidden">
    <div class="bg-white border-t border-gray-200 h-full overflow-hidden">
      <section 
        class="h-full" 
        role="region" 
        :aria-label="ariaLabel"
      >
        <div class="h-full overflow-auto" role="table" :aria-label="ariaLabel">
          <table class="w-full" :style="{ minWidth: minWidth }">
            <!-- Table Header -->
            <thead 
              class="bg-gradient-to-r from-teal-600 to-blue-600 border-b-2 border-teal-700 sticky top-0 z-10" 
              role="rowgroup"
              style="box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 8px;"
            >
              <tr role="row">
                <th 
                  v-for="column in columns" 
                  :key="column.key"
                  scope="col" 
                  class="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-teal-700 transition-colors border-r border-teal-500/30 last:border-r-0" 
                  :aria-sort="getAriaSortValue(column.key)" 
                  role="columnheader" 
                  tabindex="0" 
                  :style="{ minWidth: column.minWidth || '120px' }"
                  @click="$emit('sort', column.key)"
                  @keydown.enter="$emit('sort', column.key)"
                  @keydown.space.prevent="$emit('sort', column.key)"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ column.label }}</span>
                    <svg 
                      v-if="sortColumn === column.key"
                      class="w-3.5 h-3.5 text-white transition-transform"
                      :class="{ 'rotate-180': sortDirection === 'desc' }"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody class="divide-y divide-gray-200 bg-white" role="rowgroup">
              <tr 
                v-for="(row, index) in data" 
                :key="getRowKey(row, index)"
                class="hover:bg-teal-50 transition-colors cursor-pointer" 
                :class="{ 'bg-teal-100 border-l-4 border-teal-600': isRowSelected(row, index) }"
                role="row" 
                tabindex="0" 
                :aria-selected="isRowSelected(row, index)"
                :title="rowSelectLabel"
                @click="$emit('row-select', row, index)"
                @keydown.enter="$emit('row-select', row, index)"
                @keydown.space.prevent="$emit('row-select', row, index)"
              >
                <td 
                  v-for="column in columns" 
                  :key="column.key"
                  class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100 last:border-r-0" 
                  role="gridcell" 
                  :data-label="column.label"
                  :style="{ minWidth: column.minWidth || '120px' }"
                >
                  <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                    <span>{{ formatCellValue(row[column.key], column) }}</span>
                  </slot>
                </td>
              </tr>
              
              <!-- Empty State -->
              <tr v-if="data.length === 0">
                <td 
                  :colspan="columns.length" 
                  class="px-4 py-8 text-center text-gray-500"
                >
                  <slot name="empty">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p class="text-sm font-medium">No hay datos disponibles</p>
                    </div>
                  </slot>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  minWidth: {
    type: String,
    default: '1200px'
  },
  sortColumn: {
    type: String,
    default: ''
  },
  sortDirection: {
    type: String,
    default: 'asc',
    validator: (value) => ['asc', 'desc'].includes(value)
  },
  selectedRowIndex: {
    type: Number,
    default: null
  },
  rowKey: {
    type: String,
    default: null
  },
  ariaLabel: {
    type: String,
    default: 'Tabla de datos'
  },
  rowSelectLabel: {
    type: String,
    default: 'Clic para seleccionar'
  }
})

defineEmits(['sort', 'row-select'])

// Methods
const formatCellValue = (value, column) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return '[Object]'
  
  // Formateo personalizado por tipo de columna
  if (column.format) {
    return column.format(value)
  }
  
  // Formateo numérico
  if (typeof value === 'number' && column.type === 'number') {
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: column.decimals || 0,
      maximumFractionDigits: column.decimals || 2
    })
  }
  
  return String(value)
}

const getRowKey = (row, index) => {
  return props.rowKey ? row[props.rowKey] : index
}

const isRowSelected = (row, index) => {
  return props.selectedRowIndex === index
}

const getAriaSortValue = (columnKey) => {
  if (props.sortColumn !== columnKey) return 'none'
  return props.sortDirection === 'asc' ? 'ascending' : 'descending'
}
</script>

<style scoped>
/* Custom scrollbar styles - Corporate theme */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #0396A6;
  border-radius: 4px;
  border: 2px solid #f1f5f9;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #015059;
}

.overflow-auto::-webkit-scrollbar-corner {
  background: #f1f5f9;
}

/* Firefox scrollbar */
.overflow-auto {
  scrollbar-width: thin;
  scrollbar-color: #0396A6 #f1f5f9;
}
</style>
