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
  weight: 2
}

/**
 * Estilo para bosques
 */
export const bosquesDefaultStyle = {
  color: '#228B22',
  fillColor: '#228B22',
  fillOpacity: 0.3,
  weight: 2
}

/**
 * Función de estilo dinámico para bosques según tipo de vegetación
 * Laguna: azul
 * Vegetación boscosa: verde oscuro
 * Área agropecuaria: amarillo claro (tipo crema)
 */
export function getBosquesStyle(feature) {
  const vegetacion = feature?.properties?.vegetacion
  
  switch (vegetacion) {
    case 'Laguna':
      return {
        color: '#0066CC',      // Azul para lagunas
        fillColor: '#0066CC',
        fillOpacity: 0.4,
        weight: 2
      }
    case 'Vegetacion boscosa':
      return {
        color: '#006400',      // Verde oscuro para vegetación boscosa
        fillColor: '#006400',
        fillOpacity: 0.35,
        weight: 2
      }
    case 'Area agropecuaria':
      return {
        color: '#F5DEB3',      // Amarillo claro/crema para área agropecuaria
        fillColor: '#F5DEB3',
        fillOpacity: 0.3,
        weight: 2
      }
    default:
      // Estilo por defecto si no hay tipo definido
      return {
        color: '#228B22',
        fillColor: '#228B22',
        fillOpacity: 0.3,
        weight: 2
      }
  }
}

/**
 * Estilo para perímetro
 */
export const perimetroDefaultStyle = {
  color: '#FF0000',
  fillColor: 'transparent',
  fillOpacity: 0,
  weight: 5,
  opacity: 0.8
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

/**
 * Estilo para puntos de suelo
 */
export const sueloDefaultStyle = {
  radius: 6,
  fillColor: '#8B6914',
  color: '#5C4409',
  weight: 2,
  opacity: 0.8,
  fillOpacity: 0.7
}

/**
 * Estilo para puntos de suelo en hover
 */
export const sueloHoverStyle = {
  radius: 8,
  fillColor: '#FFD700',
  color: '#8B6914',
  weight: 3,
  opacity: 1,
  fillOpacity: 0.9
}

/**
 * Función de estilo dinámico para puntos de suelo según fertilidad
 * Ligeras: Azul claro (#6495ED)
 * Moderadas: Verde (#00AA00)
 * Fuertes: Naranja (#FF8C00)
 * Severas: Rojo (#FF0000)
 * Sin datos: Gris (#808080)
 */
export function getSueloStyle(feature) {
  const fertilidad = feature?.properties?.fertilidad || 'Sin datos'
  
  const colorMap = {
    'Ligeras': {
      fillColor: '#6495ED',
      color: '#4169E1',
      radius: 6
    },
    'Moderadas': {
      fillColor: '#00AA00',
      color: '#006400',
      radius: 6
    },
    'Fuertes': {
      fillColor: '#FF8C00',
      color: '#FF6347',
      radius: 6
    },
    'Severas': {
      fillColor: '#FF0000',
      color: '#DC143C',
      radius: 6
    },
    'Sin datos': {
      fillColor: '#808080',
      color: '#505050',
      radius: 6
    }
  }
  
  const style = colorMap[fertilidad] || colorMap['Sin datos']
  
  return {
    radius: style.radius,
    fillColor: style.fillColor,
    color: style.color,
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.7
  }
}

/**
 * Función de estilo hover dinámico para puntos de suelo
 */
export function getSueloHoverStyle(feature) {
  const style = getSueloStyle(feature)
  return {
    ...style,
    radius: 8,
    weight: 3,
    opacity: 1,
    fillOpacity: 0.9
  }
}