<template>
  <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
    <section class="flex items-center space-x-4" role="search" aria-label="Controles de filtrado">
      <!-- Search Input -->
      <div class="flex-1">
        <label :for="searchId" class="sr-only">{{ searchPlaceholder }}</label>
        <div class="relative">
          <svg 
            class="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            :id="searchId"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            type="text" 
            :placeholder="searchPlaceholder"
            class="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
          >
        </div>
      </div>

      <!-- Records Per Page Selector -->
      <div class="flex items-center space-x-2">
        <label :for="selectId" class="text-sm text-gray-700 font-medium whitespace-nowrap">
          {{ recordsLabel }}
        </label>
        <select 
          :id="selectId"
          :value="recordsPerPage"
          @change="$emit('update:recordsPerPage', Number($event.target.value))"
          class="text-sm bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer font-medium" 
          :aria-label="`Número de registros por página, actualmente ${recordsPerPage}`"
        >
          <option 
            v-for="option in pageOptions" 
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  recordsPerPage: {
    type: Number,
    default: 25
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  searchPlaceholder: {
    type: String,
    default: 'Buscar en los atributos...'
  },
  recordsLabel: {
    type: String,
    default: 'Mostrar:'
  },
  searchId: {
    type: String,
    default: 'attribute-search'
  },
  selectId: {
    type: String,
    default: 'records-per-page'
  },
  pageOptions: {
    type: Array,
    default: () => [
      { value: 10, label: '10' },
      { value: 25, label: '25' },
      { value: 50, label: '50' },
      { value: 100, label: '100' }
    ]
  }
})

defineEmits(['update:modelValue', 'update:recordsPerPage'])

// Agregar opción "Todos" si hay datos
const pageOptions = computed(() => {
  const options = [...props.pageOptions]
  if (props.totalRecords > 0) {
    options.push({ value: props.totalRecords, label: 'Todos' })
  }
  return options
})
</script>
