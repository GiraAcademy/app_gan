<script setup>
import { ref, onMounted, watch } from 'vue'
import { usePotrerosStats } from '@/composables/usePotrerosStats'

const emit = defineEmits(['selectPotrero'])

const selectedPotrero = ref('')

// Usar composable para obtener estadísticas de potreros
const {
  isLoading,
  error,
  totalSuperficie,
  totalPotreros,
  potrerosNames,
  loadPotrerosData,
  getPotreroById
} = usePotrerosStats()

// Cargar datos al montar el componente
onMounted(async () => {
  await loadPotrerosData()
})

// Watch para emitir cuando cambia la selección
watch(selectedPotrero, (newPotreroId) => {
  if (newPotreroId) {
    const potreroData = getPotreroById(newPotreroId)
    if (potreroData) {
      emit('selectPotrero', potreroData)
    }
  } else {
    // Si se deselecciona, emitir null para limpiar selección
    emit('selectPotrero', null)
  }
})
</script>

<template>
  <section 
    id="analisis" 
    class="tab-panel sidebar-content w-full p-5" 
    role="tabpanel" 
    aria-labelledby="tab-analisis"
  >
    <section class="mb-6 relative z-10">
      <h2 class="mb-4 text-gray-800 text-base font-semibold font-montserrat border-b-2 border-teal-600 pb-2 relative uppercase tracking-wide z-10 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-8 after:h-0.5 after:bg-gradient-to-r after:from-teal-600 after:to-blue-500 after:rounded-sm">
        Información del Proyecto
      </h2>
      <div class="py-2.5 border-b border-slate-200 font-normal leading-relaxed transition-all duration-300 relative z-10 text-gray-700 text-sm">
        <strong>Parcela:</strong> La Palma
      </div>
      <div class="py-2.5 border-b border-slate-200 font-normal leading-relaxed transition-all duration-300 relative z-10 text-gray-700 text-sm">
        <strong>Superficie: </strong> 
        <span v-if="isLoading" class="text-teal-600">
          <svg class="inline animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Calculando...
        </span>
        <span v-else-if="error" class="text-red-600" :title="error">
          Error al cargar
        </span>
        <span v-else id="total-superficie" class="font-semibold text-teal-700">
          {{ totalSuperficie.toFixed(2) }}
        </span>
        <span v-if="!isLoading && !error"> ha</span>
      </div>
      <div class="py-2.5 border-b border-slate-200 font-normal leading-relaxed transition-all duration-300 relative z-10 text-gray-700 text-sm">
        <strong>Total de Potreros: </strong> 
        <span v-if="isLoading" class="text-teal-600">...</span>
        <span v-else class="font-semibold text-teal-700">{{ totalPotreros }}</span>
      </div>
      
      <!-- Filtro de Potreros -->
      <div class="py-2.5 border-b border-slate-200 font-normal leading-relaxed transition-all duration-300 relative z-10 text-gray-700 text-sm">
        <label for="select-potreros" class="block text-sm font-medium text-gray-700 mb-2">
          Filtrar Potreros
        </label>
        <select 
          id="select-potreros" 
          v-model="selectedPotrero"
          :disabled="isLoading"
          class="w-full text-sm p-2 border border-slate-200 rounded-md bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-200 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {{ isLoading ? 'Cargando potreros...' : '-- Seleccione un potrero --' }}
          </option>
          <option 
            v-for="potrero in potrerosNames" 
            :key="potrero.id" 
            :value="potrero.id"
          >
            {{ potrero.nombre }}
          </option>
        </select>
        
        <!-- Información del potrero seleccionado -->
        <div v-if="selectedPotrero" class="mt-3 p-3 bg-teal-50 rounded-md border border-teal-200">
          <p class="text-xs text-gray-700">
            <strong class="text-teal-800">Potrero seleccionado:</strong><br>
            <span class="text-sm font-semibold text-teal-900">
              {{ potrerosNames.find(p => p.id === selectedPotrero)?.nombre }}
            </span>
          </p>
          <p class="text-xs text-gray-600 mt-1">
            <strong>Superficie:</strong> 
            {{ potrerosNames.find(p => p.id === selectedPotrero)?.superficie.toFixed(2) }} ha
          </p>
        </div>
      </div>
    </section>
  </section>
</template>
