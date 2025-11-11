/**
 * Helpers para crear popups reutilizables en el mapa
 */

/**
 * Helpers para crear popups reutilizables en el mapa
 */

/**
 * Crea el contenido HTML para el popup de un potrero
 * @param {Object} potreroData - Datos del potrero
 * @param {string} potreroData.nombre - Nombre del potrero
 * @param {number} potreroData.superficie - Superficie en hectáreas
 * @param {Object} potreroData.properties - Propiedades completas del feature
 * @param {string} [variant='default'] - Variante del popup ('default' o 'selected')
 * @returns {string} HTML del popup
 */
export function createPotreroPopupContent(potreroData, variant = 'default') {
  const { nombre, superficie, properties } = potreroData

  const isSelected = variant === 'selected'
  const icon = isSelected ? '📍' : '🟩'
  const titleClass = isSelected ? 'text-orange-700' : 'text-teal-700'

  // Extraer datos para el gráfico de torta
  const bosquesHa = properties?.bosques_ha || 0
  const lagunaHa = properties?.laguna_ha || 0
  const pecuariHa = properties?.pecuari_ha || 0

  // Calcular porcentajes
  const totalUsos = bosquesHa + lagunaHa + pecuariHa
  const bosquesPct = totalUsos > 0 ? ((bosquesHa / totalUsos) * 100).toFixed(1) : 0
  const lagunaPct = totalUsos > 0 ? ((lagunaHa / totalUsos) * 100).toFixed(1) : 0
  const pecuariPct = totalUsos > 0 ? ((pecuariHa / totalUsos) * 100).toFixed(1) : 0

  return `
    <div class="p-3 max-w-xs">
      <h3 class="font-semibold text-base ${titleClass} mb-2">
        ${icon} ${nombre || 'Sin nombre'}
      </h3>

      <div class="space-y-1 text-xs text-gray-700 mb-3">
        <p><strong>Superficie total:</strong> ${superficie ? superficie.toFixed(2) : 'N/A'} ha</p>
      </div>

      <div class="border-t pt-2">
        <h4 class="font-medium text-sm text-gray-800 mb-2">Distribución de uso del suelo</h4>

        <div class="space-y-1 text-xs hidden">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>Bosques</span>
            </div>
            <span class="font-medium">${bosquesHa.toFixed(2)} ha (${bosquesPct}%)</span>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>Laguna</span>
            </div>
            <span class="font-medium">${lagunaHa.toFixed(2)} ha (${lagunaPct}%)</span>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span>Pecuari</span>
            </div>
            <span class="font-medium">${pecuariHa.toFixed(2)} ha (${pecuariPct}%)</span>
          </div>
        </div>

        <div class="mt-3 pie-chart-container" style="width: 100%; height: 150px; position: relative;">
          <!-- Aquí se insertará el gráfico de torta dinámicamente -->
        </div>
      </div>
    </div>
  `
}

/**
 * Crea datos para el gráfico de torta de distribución de uso del suelo
 * @param {Object} properties - Propiedades del feature del potrero
 * @returns {Object} Datos para Chart.js
 */
export function createLandUseChartData(properties) {
  const bosquesHa = properties?.bosques_ha || 0
  const lagunaHa = properties?.laguna_ha || 0
  const pecuariHa = properties?.pecuari_ha || 0

  return {
    labels: ['Bosques', 'Laguna', 'Pecuaria'],
    datasets: [{
      data: [bosquesHa, lagunaHa, pecuariHa],
      backgroundColor: [
        '#10B981', // verde para bosques
        '#3B82F6', // azul para laguna
        '#F59E0B'  // amarillo para pecuaria
      ],
      borderColor: [
        '#059669',
        '#2563EB',
        '#D97706'
      ],
      borderWidth: 2
    }]
  }
}
export const potreroPopupOptions = {
  default: {
    className: 'potrero-popup',
    closeButton: true,
    maxWidth: 350,
    minWidth: 300,
    maxHeight: 400
  },
  selected: {
    className: 'selected-potrero-popup',
    closeButton: true,
    maxWidth: 350,
    minWidth: 300,
    maxHeight: 400
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

/**
 * Crea el contenido HTML para el popup de un punto de suelo
 * @param {Object} sueloData - Datos del punto de suelo
 * @param {Object} sueloData.properties - Propiedades del feature
 * @returns {string} HTML del popup
 */
export function createSueloPopupContent(sueloData) {
  const props = sueloData.properties || {}
  
  // Mapeo de colores según fertilidad
  const fertilidadColors = {
    'Ligeras': '#6495ED',
    'Moderadas': '#00AA00',
    'Fuertes': '#FF8C00',
    'Severas': '#FF0000',
    'Sin datos': '#808080'
  }
  
  const fertilidad = props.fertilidad || 'Sin datos'
  const perfil = props.perfil || 'Sin perfil'
  const icon = '📍'
  const titleClass = 'text-teal-700'
  const fertilidadColor = fertilidadColors[fertilidad] || '#808080'

  return `
    <div class="p-2 max-w-xs text-xs text-gray-700">
      <h3 class="font-semibold text-sm ${titleClass} mb-2">
        ${icon} Muestra de Suelo (${perfil})
      </h3>

      <div class="space-y-1">
        <!-- Fertilidad -->
        <div class="flex items-start gap-2">
          <span class="font-medium whitespace-nowrap">Fertilidad:</span>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${fertilidadColor}; border: 1px solid #333;"></div>
            <span>${fertilidad}</span>
          </div>
        </div>

        <!-- Profundidad -->
        ${props.profundidad ? `<div><span class="font-medium">Profundidad:</span> ${props.profundidad}</div>` : ''}

        <!-- Pedregosidad -->
        ${props.pedregosidad ? `<div><span class="font-medium">Pedregosidad:</span> ${props.pedregosidad}</div>` : ''}

        <!-- Drenaje -->
        ${props.drenaje ? `<div><span class="font-medium">Drenaje:</span> ${props.drenaje}</div>` : ''}

        <!-- Erosión -->
        ${props.erosion ? `<div><span class="font-medium">Erosión:</span> ${props.erosion}</div>` : ''}

        <!-- Inundación -->
        ${props.inundacion ? `<div><span class="font-medium">Inundación:</span> ${props.inundacion}</div>` : ''}

        <!-- Vegetación -->
        ${props.vegetacion ? `<div><span class="font-medium">Vegetación:</span> ${props.vegetacion}</div>` : ''}

        <!-- Observaciones -->
        ${props.observaciones ? `<div><span class="font-medium">Observaciones:</span> ${props.observaciones}</div>` : ''}
      </div>
    </div>
  `
}

/**
 * Opciones de popup para suelo
 */
export const sueloPopupOptions = {
  className: 'suelo-popup',
  closeButton: true,
  maxWidth: 280,
  minWidth: 250,
  maxHeight: 450
}
