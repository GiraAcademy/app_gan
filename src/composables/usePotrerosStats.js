/**
 * Composable para calcular estadísticas de potreros
 */
import { ref, computed } from 'vue'
import { fetchPotreros } from '@/services/potrerosService'

export function usePotrerosStats() {
  const potrerosData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Carga los datos de potreros
   */
  async function loadPotrerosData() {
    try {
      isLoading.value = true
      error.value = null
      
      const data = await fetchPotreros()
      potrerosData.value = data
      
    } catch (err) {
      error.value = `Error al cargar datos: ${err.message}`
      console.error('Error en usePotrerosStats:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Calcula la superficie total sumando todos los super_ha
   */
  const totalSuperficie = computed(() => {
    if (!potrerosData.value || !potrerosData.value.features) {
      return 0
    }

    return potrerosData.value.features.reduce((total, feature) => {
      const superHa = feature.properties?.super_ha || 0
      return total + superHa
    }, 0)
  })

  /**
   * Obtiene la cantidad total de potreros
   */
  const totalPotreros = computed(() => {
    return potrerosData.value?.features?.length || 0
  })

  /**
   * Obtiene la lista de nombres de potreros ordenados alfabéticamente
   */
  const potrerosNames = computed(() => {
    if (!potrerosData.value || !potrerosData.value.features) {
      return []
    }

    return potrerosData.value.features
      .map(feature => ({
        id: feature.properties?.id,
        nombre: feature.properties?.nombre || 'Sin nombre',
        superficie: feature.properties?.super_ha || 0
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  })

  /**
   * Obtiene información de un potrero específico por ID
   */
  function getPotreroById(id) {
    if (!potrerosData.value || !potrerosData.value.features) {
      return null
    }

    const feature = potrerosData.value.features.find(
      f => f.properties?.id === id
    )

    if (!feature) return null

    return {
      id: feature.properties?.id,
      nombre: feature.properties?.nombre || 'Sin nombre',
      superficie: feature.properties?.super_ha || 0,
      geometry: feature.geometry
    }
  }

  /**
   * Calcula estadísticas básicas de superficie
   */
  const superficieStats = computed(() => {
    if (!potrerosData.value || !potrerosData.value.features || potrerosData.value.features.length === 0) {
      return {
        min: 0,
        max: 0,
        promedio: 0
      }
    }

    const superficies = potrerosData.value.features.map(
      f => f.properties?.super_ha || 0
    )

    return {
      min: Math.min(...superficies),
      max: Math.max(...superficies),
      promedio: superficies.reduce((a, b) => a + b, 0) / superficies.length
    }
  })

  return {
    // Estado
    potrerosData,
    isLoading,
    error,
    
    // Funciones
    loadPotrerosData,
    getPotreroById,
    
    // Computed
    totalSuperficie,
    totalPotreros,
    potrerosNames,
    superficieStats
  }
}
