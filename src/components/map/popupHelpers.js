/**
 * Helpers para crear popups reutilizables en el mapa
 */

/**
 * Crea el contenido HTML para el popup de un potrero
 * @param {Object} potreroData - Datos del potrero
 * @param {string} potreroData.nombre - Nombre del potrero
 * @param {number} potreroData.superficie - Superficie en hectáreas
 * @param {string} [variant='default'] - Variante del popup ('default' o 'selected')
 * @returns {string} HTML del popup
 */
export function createPotreroPopupContent(potreroData, variant = 'default') {
  const { nombre, superficie } = potreroData
  
  const isSelected = variant === 'selected'
  const icon = isSelected ? '📍' : '🟩'
  const titleClass = isSelected ? 'text-orange-700' : 'text-teal-700'
  
  return `
    <div class="p-2">
      <h3 class="font-semibold text-base ${titleClass} mb-1">
        ${icon} ${nombre || 'Sin nombre'}
      </h3>
      <p class="text-xs text-gray-700">
        <strong>Superficie:</strong> ${superficie ? superficie.toFixed(2) : 'N/A'} ha
      </p>
    </div>
  `
}

/**
 * Opciones de configuración para popups de potreros
 */
export const potreroPopupOptions = {
  default: {
    className: 'potrero-popup',
    closeButton: true,
    maxWidth: 250,
    minWidth: 180
  },
  selected: {
    className: 'selected-potrero-popup',
    closeButton: true,
    maxWidth: 250,
    minWidth: 180
  }
}

/**
 * Crea un popup de Leaflet configurado para un potrero
 * @param {L.Map} map - Instancia del mapa de Leaflet
 * @param {L.LatLng} latLng - Coordenadas donde mostrar el popup
 * @param {Object} potreroData - Datos del potrero
 * @param {string} [variant='default'] - Variante del popup
 * @returns {L.Popup} Popup de Leaflet
 */
export function createPotreroPopup(map, latLng, potreroData, variant = 'default') {
  const content = createPotreroPopupContent(potreroData, variant)
  const options = potreroPopupOptions[variant] || potreroPopupOptions.default
  
  const L = window.L
  return L.popup(options)
    .setLatLng(latLng)
    .setContent(content)
    .openOn(map)
}
