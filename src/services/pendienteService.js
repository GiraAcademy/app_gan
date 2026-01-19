/**
 * Servicio para cargar la capa de Pendiente (Slope)
 * desde GeoServer mediante WMS
 *
 * Nota: La configuración del WMS se mantiene en baseLayersConfig.js
 * para evitar dependencias circulares y mantener un único punto de configuración
 */
import { getPendienteWmsConfig } from '@/components/map/baseLayersConfig.js'

/**
 * Valida que el servicio WMS de Pendiente sea accesible
 * @returns {Promise<boolean>} true si el WMS es accesible
 */
export async function validatePendienteWmsService() {
  try {
    const config = getPendienteWmsConfig()
    const capabilitiesUrl = `${config.baseUrl}?service=WMS&version=${config.version}&request=GetCapabilities`

    await fetch(capabilitiesUrl, {
      method: 'HEAD',
      mode: 'no-cors'
    })

    console.log('✅ Servicio WMS Pendiente de GeoServer accesible')
    return true
  } catch (error) {
    console.error('❌ Error al acceder al servicio WMS Pendiente:', error)
    return false
  }
}

/**
 * Obtiene información sobre las capas disponibles en el WMS de Pendiente
 * @returns {Promise<string>} XML con capacidades del WMS
 */
export async function getPendienteWmsCapabilities() {
  try {
    const config = getPendienteWmsConfig()
    const capabilitiesUrl = `${config.baseUrl}?service=WMS&version=${config.version}&request=GetCapabilities`

    const response = await fetch(capabilitiesUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: No se pudo obtener capacidades del WMS`)
    }

    const xml = await response.text()

    console.log('📊 Capacidades del WMS Pendiente obtenidas correctamente')
    console.log('📍 Capas disponibles:', config.layers)
    console.log('🌐 URL del servicio:', config.baseUrl)

    return xml
  } catch (error) {
    console.error('❌ Error al obtener capacidades del WMS Pendiente:', error)
    throw error
  }
}

/**
 * Obtiene información detallada sobre la capa de Pendiente
 * @returns {Object} Información de configuración y metadata
 */
export function getPendienteLayerInfo() {
  const config = getPendienteWmsConfig()

  return {
    name: 'Pendiente',
    description: 'Capa raster que representa la inclinación del terreno',
    service: config.baseUrl,
    layer: config.layers,
    format: config.format,
    srs: config.srs,
    transparent: config.transparent,
    provider: 'GeoServer GIRA360'
  }
}

export default {
  validatePendienteWmsService,
  getPendienteWmsCapabilities,
  getPendienteLayerInfo
}
