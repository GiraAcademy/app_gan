<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { usePotrerosStats } from '@/composables/usePotrerosStats'

const emit = defineEmits(['selectPotrero'])

const selectedPotrero = ref('')
const searchTerm = ref('')
const isDropdownOpen = ref(false)
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })
const dropdownRef = ref(null)

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

// Filtrar potreros según el término de búsqueda
const filteredPotreros = computed(() => {
  if (!searchTerm.value) return potrerosNames.value

  const term = searchTerm.value.toLowerCase()
  return potrerosNames.value.filter(p =>
    p.nombre.toLowerCase().includes(term)
  )
})

// Computed para obtener el potrero seleccionado
const selectedPotreroData = computed(() => {
  if (!selectedPotrero.value) return null
  return potrerosNames.value.find(p => p.id == selectedPotrero.value)
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

// Manejar selección de potrero desde el dropdown
function selectPotrero(potreroId) {
  selectedPotrero.value = potreroId
  searchTerm.value = ''
  isDropdownOpen.value = false
}

// Actualizar posición del dropdown
function updateDropdownPosition(event) {
  if (event.target && isDropdownOpen.value) {
    const rect = event.target.getBoundingClientRect()
    dropdownPosition.value = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    }
  }
}

// Manejar error de carga de imagen
function handleImageError(event) {
  console.warn(`Error cargando imagen: ${event.target.src}`)
}

// Limpiar la selección del potrero
function clearSelection() {
  selectedPotrero.value = ''
  searchTerm.value = ''
  isDropdownOpen.value = false
}
</script>

<template>
  <section
    id="analisis"
    class="tab-panel sidebar-content w-full p-5 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-200px)]"
    role="tabpanel"
    aria-labelledby="tab-analisis"
  >
    <section class="mb-3 relative z-10">
      <h2 class="mb-2 text-gray-800 text-base font-semibold font-montserrat border-b-2 border-teal-600 pb-1 relative uppercase tracking-wide z-10 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-8 after:h-0.5 after:bg-gradient-to-r after:from-teal-600 after:to-blue-500 after:rounded-sm">
        Información del Proyecto
      </h2>
      <div class="py-1.5 border-b border-slate-200 font-normal leading-tight transition-all duration-300 relative z-10 text-gray-700 text-xs">
        <strong>Parcela:</strong> La Palma
      </div>
      <div class="py-1.5 border-b border-slate-200 font-normal leading-tight transition-all duration-300 relative z-10 text-gray-700 text-xs">
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
      <div class="py-1.5 border-b border-slate-200 font-normal leading-tight transition-all duration-300 relative z-10 text-gray-700 text-xs">
        <strong>Total de Potreros: </strong>
        <span v-if="isLoading" class="text-teal-600">...</span>
        <span v-else class="font-semibold text-teal-700">{{ totalPotreros }}</span>
      </div>

      <!-- Filtro de Potreros con Dropdown y Búsqueda -->
      <div class="py-1.5 border-b border-slate-200 font-normal leading-tight transition-all duration-300 relative text-gray-700 text-xs">
        <label for="search-potreros" class="block text-xs font-medium text-gray-700 mb-1">
          Filtrar Potreros
        </label>

        <!-- Input de búsqueda -->
        <div class="relative">
          <input
            ref="dropdownRef"
            id="search-potreros"
            v-model="searchTerm"
            type="text"
            placeholder="Buscar potrero..."
            :disabled="isLoading"
            @focus="isDropdownOpen = true; updateDropdownPosition($event)"
            @input="updateDropdownPosition($event)"
            class="w-full text-xs p-2 pr-12 border border-slate-200 rounded-md bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-200 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <!-- Iconos de búsqueda y limpiar -->
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              v-if="searchTerm"
              @click="clearFilter"
              class="p-1 text-gray-400 hover:text-red-500 transition"
              title="Limpiar filtro"
            >
              🗑️
            </button>
            <span class="text-gray-400 pointer-events-none">🔍</span>
          </div>
        </div>

        <!-- Dropdown de opciones con posición fija -->
        <Teleport to="body">
          <div
            v-if="isDropdownOpen && filteredPotreros.length > 0"
            class="fixed bg-white border border-slate-200 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto"
            :style="{
              top: dropdownPosition.top + 'px',
              left: dropdownPosition.left + 'px',
              width: dropdownPosition.width + 'px'
            }"
          >
            <div
              v-for="potrero in filteredPotreros"
              :key="potrero.id"
              @click="selectPotrero(potrero.id)"
              class="px-3 py-2 hover:bg-teal-50 cursor-pointer transition text-xs text-gray-700 flex justify-between items-center border-b border-slate-100 last:border-b-0"
            >
              <span>{{ potrero.nombre }}</span>
              <span class="text-xs text-gray-500">{{ potrero.superficie.toFixed(1) }} ha</span>
            </div>
          </div>

          <!-- Mensaje cuando no hay resultados -->
          <div
            v-if="isDropdownOpen && filteredPotreros.length === 0"
            class="fixed bg-white border border-slate-200 rounded-md shadow-xl z-50 p-3 text-center text-gray-500 text-xs"
            :style="{
              top: dropdownPosition.top + 'px',
              left: dropdownPosition.left + 'px',
              width: dropdownPosition.width + 'px'
            }"
          >
            No se encontraron potreros
          </div>
        </Teleport>

        <!-- Información del potrero seleccionado -->
        <div v-if="selectedPotreroData" class="mt-2 p-2 bg-teal-50 rounded-md border border-teal-200 relative">
          <button
            @click="clearSelection"
            class="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 transition"
            title="Limpiar selección"
          >
            ✕
          </button>

          <p class="text-xs text-gray-700 pr-4">
            <strong class="text-teal-800">Potrero:</strong>
            <span class="text-xs font-semibold text-teal-900">
              {{ selectedPotreroData.nombre }}
            </span>
          </p>
          <p class="text-xs text-gray-600 mt-0.5">
            <strong>Superficie:</strong> {{ selectedPotreroData.superficie.toFixed(2) }} ha
          </p>

          <!-- Imagen del potrero desde Google Drive -->
          <div v-if="selectedPotreroData.url_drive && selectedPotreroData.url_drive.iframeUrl" class="mt-2">
            <p class="text-xs font-semibold text-gray-700 mb-1">Imagen del Potrero:</p>
            <div class="bg-white rounded-md border-2 border-teal-300 overflow-hidden">
              <!-- Mostrar iframe de Google Drive -->
              <iframe
                :src="selectedPotreroData.url_drive.iframeUrl"
                class="w-full h-48 border-0 block"
                allow="autoplay"
              ></iframe>
            </div>
          </div>
          <div v-else class="mt-4">
            <p class="text-xs text-gray-500 italic">Sin imagen disponible para este potrero</p>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
