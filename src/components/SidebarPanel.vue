<script setup>
import { ref, computed } from 'vue'
import CapasTab from './sidebar/CapasTab.vue'
import AnalisisTab from './sidebar/AnalisisTab.vue'

const props = defineProps({
  isOpen: Boolean,
  sidebarOpen: {
    type: Boolean,
    default: false
  },
  layersState: {
    type: Object,
    default: () => ({})
  },
  layersLoading: {
    type: Object,
    default: () => ({})
  },
  layersError: {
    type: Object,
    default: () => ({})
  }
})

// Debug log
console.log('SidebarPanel mounted, isOpen:', props.isOpen)

// Clases del sidebar
const sidebarClasses = computed(() => {
  const baseClasses = 'bg-white flex flex-col h-full transition-all duration-300 ease-in-out'
  
  // Desktop: always visible
  const desktopClasses = 'lg:block'
  
  // Mobile: conditional width and visibility
  const mobileClasses = props.sidebarOpen ? 'block' : 'w-0 overflow-hidden'
  
  return `${baseClasses} ${desktopClasses} ${mobileClasses}`
})

const emit = defineEmits(['toggle', 'toggleLayer', 'selectPotrero', 'toggleAttributeTable'])

const activeTab = ref('capas')

function switchTab(tab) {
  activeTab.value = tab
}

function handleToggleLayer(layerName, value) {
  emit('toggleLayer', layerName, value)
}

function handleSelectPotrero(potreroData) {
  emit('selectPotrero', potreroData)
}

function handleToggleAttributeTable(layerType) {
  emit('toggleAttributeTable', layerType)
}
</script>

<template>
  <nav 
    :class="sidebarClasses"
    aria-label="Navegación de pestañas"
  >
    <!-- Tabs Navigation -->
    <ul class="list-none m-0 p-0 flex border-b-2 border-gray-100 bg-white" role="tablist" aria-orientation="horizontal">
      <li class="flex-1 flex" role="presentation">
        <button 
          @click="switchTab('capas')"
          :class="['tab-button flex-1 px-2 py-3 bg-transparent border-none text-gray-700 text-sm font-medium font-montserrat cursor-pointer transition-all duration-300 border-b-[3px] border-transparent flex items-center justify-center gap-2 hover:text-gray-800 hover:bg-teal-50',
                   activeTab === 'capas' ? 'active text-gray-800 font-semibold border-teal-600 bg-teal-50' : '']"
          id="tab-capas"
          role="tab"
          :aria-selected="activeTab === 'capas'"
          aria-controls="capas"
          :tabindex="activeTab === 'capas' ? 0 : -1"
        >
          🛰️ Capas
        </button>
      </li>
      <li class="flex-1 flex" role="presentation">
        <button 
          @click="switchTab('analisis')"
          :class="['tab-button flex-1 px-2 py-3 bg-transparent border-none text-gray-700 text-sm font-medium font-montserrat cursor-pointer transition-all duration-300 border-b-[3px] border-transparent flex items-center justify-center gap-2 hover:text-gray-800 hover:bg-teal-50',
                   activeTab === 'analisis' ? 'active text-gray-800 font-semibold border-teal-600 bg-teal-50' : '']"
          id="tab-analisis"
          role="tab"
          :aria-selected="activeTab === 'analisis'"
          aria-controls="analisis"
          :tabindex="activeTab === 'analisis' ? 0 : -1"
        >
          📊 Análisis
        </button>
      </li>
    </ul>

    <!-- Tab Panels Container -->
    <section class="flex-1 overflow-y-auto overflow-x-hidden relative z-10 min-h-0 w-full sidebar-scroll">
      <CapasTab 
        v-show="activeTab === 'capas'"
        :layersState="layersState"
        :layersLoading="layersLoading"
        :layersError="layersError"
        @toggleLayer="handleToggleLayer"
        @toggleAttributeTable="handleToggleAttributeTable"
      />
      <AnalisisTab 
        v-show="activeTab === 'analisis'"
        @selectPotrero="handleSelectPotrero"
      />
    </section>

    <!-- Footer con copyright -->
    <footer class="px-5 py-4 border-t border-gray-200 bg-white">
      <p class="text-center text-xs text-gray-500">
        © 2025 <strong class="font-semibold text-teal-700">GIRA</strong> - Grupo de Investigación en<br>
        Recursos Agrícolas
      </p>
    </footer>
  </nav>
</template>

<style scoped>
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: #0396A6 #f1f5f9;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: #0396A6;
  border-radius: 3px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: #015059;
}

@media (max-width: 768px) {
  /* Styles handled by Tailwind classes now */
}
</style>
