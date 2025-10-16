<template>
  <header 
    class="flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50" 
    role="banner" 
    aria-labelledby="attribute-panel-title"
  >
    <div class="flex items-center">
      <slot name="icon">
        <svg class="w-5 h-5 mr-2 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clip-rule="evenodd" />
        </svg>
      </slot>
      <h1 id="attribute-panel-title" class="text-sm font-semibold text-gray-800">
        {{ title }}
      </h1>
      <span class="ml-3 text-xs text-gray-600 font-normal bg-teal-100 px-2 py-1 rounded-full">
        {{ recordCount }} {{ recordCountLabel }}
      </span>
    </div>

    <nav class="flex items-center space-x-2" role="navigation" aria-label="Acciones del panel">
      <slot name="actions">
        <button 
          v-if="showResetButton"
          @click="$emit('reset')"
          class="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1.5 font-medium border border-gray-300" 
          aria-label="Reiniciar selección"
          type="button"
          title="Reiniciar selección y restaurar mapa"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reiniciar
        </button>
        
        <button 
          v-if="showExportButton"
          @click="$emit('export')"
          class="px-3 py-1.5 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors flex items-center gap-1.5 font-medium shadow-sm" 
          aria-label="Exportar datos"
          type="button"
        >
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Exportar
        </button>
      </slot>
      
      <button 
        @click="$emit('close')"
        class="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors" 
        aria-label="Cerrar panel"
        type="button"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </nav>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  recordCount: {
    type: Number,
    default: 0
  },
  recordCountLabel: {
    type: String,
    default: 'registros'
  },
  showExportButton: {
    type: Boolean,
    default: true
  },
  showResetButton: {
    type: Boolean,
    default: true
  }
})

defineEmits(['export', 'close', 'reset'])
</script>
