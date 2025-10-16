/**
 * Composable para gestionar capas GeoJSON en Leaflet
 */
import { ref } from 'vue'
import L from 'leaflet'

/**
 * Hook para manejar capas GeoJSON dinámicas
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.fetchData - Función async que retorna datos GeoJSON
 * @param {Function} options.styleFunction - Función que retorna el estilo del feature
 * @param {Function} options.onEachFeature - Función para configurar cada feature
 * @returns {Object} Estado y métodos para manejar la capa
 */
export function useGeoJSONLayer(options = {}) {
  const {
    fetchData,
    styleFunction,
    onEachFeature
  } = options

  const geoJSONData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Carga los datos desde la fuente
   */
  async function loadData() {
    if (!fetchData) {
      error.value = 'No se proporcionó una función fetchData'
      return
    }

    try {
      isLoading.value = true
      error.value = null
      
      const data = await fetchData()
      geoJSONData.value = data
      
    } catch (err) {
      error.value = `Error al cargar datos: ${err.message}`
      console.error('Error en useGeoJSONLayer:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crea una capa de Leaflet desde los datos GeoJSON
   * @param {Object} data - Datos GeoJSON
   * @returns {L.LayerGroup} Capa de Leaflet
   */
  function createLayer(data) {
    if (!data || !data.features) {
      console.warn('No hay datos GeoJSON para crear la capa')
      return L.layerGroup()
    }

    const layer = L.geoJSON(data, {
      style: styleFunction,
      onEachFeature: onEachFeature
    })

    return layer
  }

  /**
   * Calcula los límites geográficos de los datos
   * @param {Object} data - Datos GeoJSON
   * @returns {L.LatLngBounds|null} Límites o null si no hay datos
   */
  function getBounds(data) {
    if (!data || !data.features || data.features.length === 0) {
      return null
    }

    try {
      const tempLayer = L.geoJSON(data)
      const bounds = tempLayer.getBounds()
      return bounds.isValid() ? bounds : null
    } catch (err) {
      console.error('Error al calcular límites:', err)
      return null
    }
  }

  return {
    geoJSONData,
    isLoading,
    error,
    loadData,
    createLayer,
    getBounds
  }
}
