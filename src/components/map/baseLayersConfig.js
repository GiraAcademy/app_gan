/**
 * Configuración de capas base para el mapa
 */

/**
 * Opciones para la capa de satélite de Google
 */
export const satelliteLayerConfig = {
  url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  options: {
    maxZoom: 20,
    attribution: 'Imagery ©2025 Google'
  }
}

/**
 * Coordenadas iniciales del mapa
 */
export const initialMapConfig = {
  center: [9.667, -68.355],
  zoom: 13
}

/**
 * Opciones de padding para ajuste de límites
 */
export const mapBoundsPadding = {
  default: [50, 50],      // Vista general
  highlighted: [100, 100] // Vista de selección (no usado actualmente)
}

/**
 * Crea una capa de satélite de Google
 * @param {Object} L - Librería Leaflet
 * @returns {L.TileLayer} Capa de satélite configurada
 */
export function createSatelliteLayer(L) {
  return L.tileLayer(
    satelliteLayerConfig.url,
    satelliteLayerConfig.options
  )
}
