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
 * Crea los datos para el gráfico de vegetación de suelo
 * @param {Object} properties - Propiedades del feature
 * @returns {Object} Datos para Chart.js
 */
export function createVegetacionChartData(properties) {
  // Acceder a propiedades sin tildes (como vienen de la API)
  const gramineas = parseFloat(properties?.gramineas) || 0
  const leguminosas = parseFloat(properties?.leguminosas) || 0
  const malezas = parseFloat(properties?.malezas) || 0

  return {
    labels: ['Gramíneas', 'Leguminosas', 'Malezas'],
    datasets: [{
      data: [gramineas, leguminosas, malezas],
      backgroundColor: [
        '#90EE90', // Verde claro para gramíneas
        '#FFD700', // Oro para leguminosas
        '#FF6B6B'  // Rojo para malezas
      ],
      borderColor: [
        '#228B22',
        '#DAA520',
        '#DC143C'
      ],
      borderWidth: 2
    }]
  }
}

/**
 * Crea el contenido HTML para el popup de un punto de suelo
 * @param {Object} sueloData - Datos del punto de suelo
 * @param {Object} sueloData.properties - Propiedades del feature
 * @returns {string} HTML del popup
 */
export function createSueloPopupContent(sueloData) {
  const props = sueloData.properties || {}
  
  const perfil = props.perfil || 'Sin perfil'
  const icon = '📍'
  const titleClass = 'text-teal-700'
  
  // Helper para mostrar valor o "S/I" si no existe
  const getValue = (value) => value ? value : 'S/I'

  return `
    <div class="p-2 max-w-xs text-xs text-gray-700">
      <h3 class="font-semibold text-sm ${titleClass} mb-3">
        ${icon} Muestra de Suelo (${perfil})
      </h3>

      <!-- Gráfico de Vegetación -->
      <div class="mb-3 border-b pb-3">
        <h4 class="font-medium text-xs text-gray-800 mb-2">Composición de Vegetación</h4>
        <div class="pie-chart-container-suelo" style="width: 100%; height: 140px; position: relative;"></div>
      </div>

      <div class="space-y-1.5">
        <!-- Cobertura -->
        <div><span class="font-medium">Cobertura:</span> ${getValue(props.cobertura)}${props.cobertura ? '%' : ''}</div>

        <!-- Profundidad -->
        <div><span class="font-medium">Profundidad:</span> ${getValue(props.profundidad)}</div>

        <!-- Pedregosidad -->
        <div><span class="font-medium">Pedregosidad:</span> ${getValue(props.pedregosidad)}</div>

        <!-- Drenaje -->
        <div><span class="font-medium">Drenaje:</span> ${getValue(props.drenaje)}</div>

        <!-- Erosión -->
        <div><span class="font-medium">Erosión:</span> ${getValue(props.erosion)}</div>

        <!-- Textura -->
        <div><span class="font-medium">Textura:</span> ${getValue(props.textura)}</div>
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
