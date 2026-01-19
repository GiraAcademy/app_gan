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

/**
 * Configuración del servicio WMS para MDE
 * Se define aquí para evitar dependencias circulares
 */
const MDE_WMS_CONFIG = {
  baseUrl: 'https://geoserver.gira360.com/geoserver/palma/wms',
  layers: 'palma:Ti_MDE',
  styles: '',
  format: 'image/png',
  transparent: true,
  srs: 'EPSG:32619',
  version: '1.1.0'
}

/**
 * Crea una capa MDE (Modelo Digital de Elevación) desde WMS de GeoServer
 * @param {Object} L - Librería Leaflet
 * @returns {L.TileLayer.WMS} Capa MDE configurada
 */
export function createMdeLayer(L) {
  return L.tileLayer.wms(
    MDE_WMS_CONFIG.baseUrl,
    {
      layers: MDE_WMS_CONFIG.layers,
      styles: MDE_WMS_CONFIG.styles,
      format: MDE_WMS_CONFIG.format,
      transparent: MDE_WMS_CONFIG.transparent,
      srs: MDE_WMS_CONFIG.srs,
      version: MDE_WMS_CONFIG.version,
      attribution: '© GeoServer GIRA360 - Modelo Digital de Elevación',
      maxZoom: 22,
      minZoom: 1,
      opacity: 0.8, // Permitir ver capas debajo
      zIndex: 100
    }
  )
}

/**
 * Obtiene la configuración del WMS para MDE
 * @returns {Object} Configuración del WMS
 */
export function getMdeWmsConfig() {
  return MDE_WMS_CONFIG
}

/**
 * Configuración del servicio WMS para Pendiente (Slope)
 * Se define aquí para evitar dependencias circulares
 */
const PENDIENTE_WMS_CONFIG = {
  baseUrl: 'https://geoserver.gira360.com/geoserver/palma/wms',
  layers: 'palma:Ti_Pendiente',
  styles: '',
  format: 'image/png',
  transparent: true,
  srs: 'EPSG:32619',
  version: '1.1.0'
}

/**
 * Crea una capa de Pendiente desde WMS de GeoServer
 * @param {Object} L - Librería Leaflet
 * @returns {L.TileLayer.WMS} Capa Pendiente configurada
 */
export function createPendienteLayer(L) {
  return L.tileLayer.wms(
    PENDIENTE_WMS_CONFIG.baseUrl,
    {
      layers: PENDIENTE_WMS_CONFIG.layers,
      styles: PENDIENTE_WMS_CONFIG.styles,
      format: PENDIENTE_WMS_CONFIG.format,
      transparent: PENDIENTE_WMS_CONFIG.transparent,
      srs: PENDIENTE_WMS_CONFIG.srs,
      version: PENDIENTE_WMS_CONFIG.version,
      attribution: '© GeoServer GIRA360 - Pendiente',
      maxZoom: 22,
      minZoom: 1,
      opacity: 0.8, // Permitir ver capas debajo
      zIndex: 100
    }
  )
}

/**
 * Obtiene la configuración del WMS para Pendiente
 * @returns {Object} Configuración del WMS
 */
export function getPendienteWmsConfig() {
  return PENDIENTE_WMS_CONFIG
}
