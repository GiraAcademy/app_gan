/**
 * Utilidades para normalizar y transformar datos de potreros
 */

/**
 * Normaliza los datos de un potrero desde un feature GeoJSON
 * al formato esperado por los popups y highlights
 * @param {Object} feature - Feature GeoJSON del potrero
 * @returns {Object} Datos normalizados del potrero
 */
export function normalizePotreroData(feature) {
  if (!feature) return null

  const { nombre, super_ha } = feature.properties || {}

  return {
    nombre: nombre || 'Sin nombre',
    superficie: super_ha || 0,
    geometry: feature.geometry,
    properties: feature.properties
  }
}

/**
 * Normaliza datos de un row de tabla a formato de potrero
 * @param {Object} row - Fila de la tabla de atributos
 * @param {Object} feature - Feature GeoJSON original
 * @returns {Object} Datos normalizados del potrero
 */
export function normalizeTableRowToPotrero(row, feature) {
  if (!feature) return null

  return {
    nombre: row.nombre || feature.properties?.nombre || 'Sin nombre',
    superficie: row.super_ha || feature.properties?.super_ha || 0,
    geometry: feature.geometry,
    properties: feature.properties
  }
}

/**
 * Extrae datos del potrero para el popup desde properties
 * @param {Object} properties - Propiedades del feature
 * @returns {Object} Objeto con nombre y superficie
 */
export function extractPotreroPopupData(properties) {
  const { nombre, super_ha } = properties || {}
  
  return {
    nombre: nombre || 'Sin nombre',
    superficie: super_ha || 0
  }
}
