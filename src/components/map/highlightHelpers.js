/**
 * Gestión de capas de resaltado/selección en el mapa
 */
import { potreroHighlightStyle } from './layerStyles'
import { createPotreroPopupContent, potreroPopupOptions } from './popupHelpers'

/**
 * Crea y muestra el resaltado de un potrero seleccionado
 * @param {Object} params - Parámetros de configuración
 * @param {L.Map} params.map - Instancia del mapa
 * @param {Object} params.potreroData - Datos del potrero (nombre, superficie, geometry)
 * @param {L.Layer} params.currentHighlight - Capa de resaltado actual (para limpiar)
 * @param {Object} params.L - Librería Leaflet
 * @returns {L.Layer} Nueva capa de resaltado
 */
export function highlightPotrero({ map, potreroData, currentHighlight, L }) {
  // Limpiar resaltado anterior
  if (currentHighlight) {
    map.removeLayer(currentHighlight)
  }

  // Cerrar cualquier popup abierto
  map.closePopup()

  if (!potreroData || !potreroData.geometry) {
    return null
  }

  // Crear capa de resaltado
  const highlightLayer = L.geoJSON(potreroData.geometry, {
    style: () => potreroHighlightStyle
  }).addTo(map)

  // Obtener el centro del polígono para el popup
  const bounds = highlightLayer.getBounds()
  const center = bounds.getCenter()
  
  // Abrir popup con información del potrero
  const popupContent = createPotreroPopupContent(potreroData, 'selected')
  
  L.popup(potreroPopupOptions.selected)
    .setLatLng(center)
    .setContent(popupContent)
    .openOn(map)

  return highlightLayer
}

/**
 * Limpia el resaltado de un potrero
 * @param {Object} params - Parámetros de configuración
 * @param {L.Map} params.map - Instancia del mapa
 * @param {L.Layer} params.highlightLayer - Capa de resaltado a limpiar
 */
export function clearHighlight({ map, highlightLayer }) {
  if (highlightLayer) {
    map.removeLayer(highlightLayer)
  }
  map.closePopup()
}
