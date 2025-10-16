/**
 * Estilos reutilizables para capas del mapa
 */

/**
 * Estilo para potreros en estado normal
 */
export const potreroDefaultStyle = {
  color: '#00CBA9',
  fillColor: '#00CBA9',
  fillOpacity: 0.25,
  weight: 2.5
}

/**
 * Estilo para potrero seleccionado/resaltado
 */
export const potreroHighlightStyle = {
  color: '#FF5733',
  fillColor: '#FF5733',
  fillOpacity: 0.4,
  weight: 4,
  dashArray: '10, 5'
}

/**
 * Estilo para potrero al hacer hover
 */
export const potreroHoverStyle = {
  color: '#00CBA9',
  fillColor: '#00CBA9',
  fillOpacity: 0.5,
  weight: 3
}

/**
 * Opciones para tooltips de potreros
 */
export const potreroTooltipOptions = {
  permanent: false,
  direction: 'center',
  className: 'potrero-tooltip'
}
