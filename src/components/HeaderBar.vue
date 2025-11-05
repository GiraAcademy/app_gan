<script setup>
const props = defineProps({
  onToggleSidebar: Function
})

const emit = defineEmits(['toggleSidebar'])

function handleToggle() {
  console.log('HeaderBar handleToggle called')
  if (props.onToggleSidebar) {
    console.log('Calling props.onToggleSidebar')
    props.onToggleSidebar()
  }
  emit('toggleSidebar')
}
</script>

<template>
  <header 
    class="bg-white text-gray-800 px-6 py-4 h-[70px] flex items-center justify-between shadow-lg z-[1000] relative border-b-[3px] border-teal-600" 
    role="banner"
  >
    <span class="absolute inset-0 bg-gradient-to-r from-teal-50 via-white to-blue-50 pointer-events-none" aria-hidden="true"></span>
    
    <section class="flex items-center gap-4 z-10 relative" aria-labelledby="site-title">
      <img 
        src="../assets/favicon.png" 
        alt="Logo de Hato La Palma" 
        class="w-10 h-10 object-contain"
        role="img"
      >
      <hgroup>
        <h1 id="site-title" class="m-0 text-2xl font-semibold font-montserrat tracking-tight text-gray-800">
          Hato La Palma
        </h1>
        <p class="m-0 text-sm text-gray-600 font-medium hidden lg:block">
          Registra hallazgos y coordina en campo
        </p>
      </hgroup>
    </section>
    
    <button 
      @click="handleToggle"
      class="lg:hidden z-10 relative p-2 rounded-lg hover:bg-teal-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2" 
      aria-label="Abrir menú de navegación"
      aria-controls="sidebar"
      aria-expanded="false"
      type="button"
    >
      <svg 
        class="w-6 h-6 text-gray-700" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>
  </header>
</template>
