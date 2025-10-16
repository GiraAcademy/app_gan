/**
 * Utilidades generales para operaciones del mapa
 */

/**
 * Ajusta el mapa a los límites de una capa GeoJSON
 * @param {Object} params - Parámetros de configuración
 * @param {L.Map} params.map - Instancia del mapa
 * @param {Function} params.getBounds - Función que obtiene los límites
 * @param {Object} params.geoJSONData - Datos GeoJSON
 * @param {Array} [params.padding=[50, 50]] - Padding para el ajuste
 * @param {number} [params.maxZoom] - Zoom máximo opcional
 */
export function fitMapToBounds({ map, getBounds, geoJSONData, padding = [50, 50], maxZoom }) {
  if (!map || !geoJSONData) return
  
  const bounds = getBounds(geoJSONData)
  if (bounds) {
    const options = { padding }
    if (maxZoom) {
      options.maxZoom = maxZoom
    }
    map.fitBounds(bounds, options)
  }
}

/**
 * Verifica si una capa está agregada al mapa
 * @param {L.Map} map - Instancia del mapa
 * @param {L.Layer} layer - Capa a verificar
 * @returns {boolean} True si la capa está en el mapa
 */
export function isLayerOnMap(map, layer) {
  return layer && map && map.hasLayer(layer)
}

/**
 * Agrega o remueve una capa del mapa basado en una condición
 * @param {Object} params - Parámetros de configuración
 * @param {L.Map} params.map - Instancia del mapa
 * @param {L.Layer} params.layer - Capa a gestionar
 * @param {boolean} params.shouldShow - Si debe mostrar la capa
 */
export function toggleLayer({ map, layer, shouldShow }) {
  if (!map || !layer) return

  const isOnMap = map.hasLayer(layer)

  if (shouldShow && !isOnMap) {
    layer.addTo(map)
  } else if (!shouldShow && isOnMap) {
    map.removeLayer(layer)
  }
}

/**
 * Inicializa un mapa de Leaflet con configuración estándar
 * @param {Object} params - Parámetros de configuración
 * @param {HTMLElement} params.container - Elemento DOM contenedor
 * @param {Array} params.center - Coordenadas [lat, lng]
 * @param {number} params.zoom - Nivel de zoom inicial
 * @param {Object} params.L - Librería Leaflet
 * @returns {L.Map} Instancia del mapa
 */
export function initializeMap({ container, center, zoom, L }) {
  return L.map(container).setView(center, zoom)
}
