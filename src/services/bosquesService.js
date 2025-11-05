/**
 * Servicio para gestionar los datos de bosques desde la API con caché optimizado usando IndexedDB
 */

import { saveToIndexedDB, getFromIndexedDB, cleanExpiredCache, BOSQUES_STORE } from '@/utils/cacheUtils'

const API_BASE_URL = 'https://palma.gira360.com'
const BOSQUES_CACHE_KEY = 'bosques_data_v2'
const CACHE_VERSION = '2.0'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Obtiene los datos de bosques con caché inteligente usando IndexedDB
 * @returns {Promise<Object>} Datos GeoJSON con los bosques
 */
export async function fetchBosques() {
  try {
    // Intentar obtener desde IndexedDB primero
    const cached = await getFromIndexedDB(BOSQUES_CACHE_KEY, BOSQUES_STORE)

    if (cached && isCacheValid(cached.metadata)) {
      console.log('🌲 Usando datos de bosques desde IndexedDB')
      return cached.data
    }

    console.log('🌲 Descargando datos de bosques desde API...')

    // Configurar timeout y headers optimizados
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    const response = await fetch(`${API_BASE_URL}/bosques`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const rawData = await response.json()

    // Validar datos
    if (!rawData || !rawData.features || !Array.isArray(rawData.features)) {
      throw new Error('Formato de datos inválido: se esperaba GeoJSON con features')
    }

    // Optimizar datos antes de guardar
    const optimizedData = optimizeGeoJSONData(rawData)

    // Guardar en IndexedDB con metadata
    await saveToIndexedDB(BOSQUES_CACHE_KEY, optimizedData, {
      version: CACHE_VERSION,
      originalSize: JSON.stringify(rawData).length,
      optimizedSize: JSON.stringify(optimizedData).length
    }, BOSQUES_STORE)

    console.log(`💾 Bosques guardados en IndexedDB (${calculateSizeReduction(rawData, optimizedData)}% reducción)`)

    return optimizedData

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ Timeout descargando bosques')
    } else {
      console.error('❌ Error obteniendo bosques:', error)
    }

    // Intentar usar datos expirados como fallback
    const cached = await getFromIndexedDB(BOSQUES_CACHE_KEY, BOSQUES_STORE)
    if (cached) {
      console.log('⚠️ Usando datos de bosques expirados como fallback')
      return cached.data
    }

    throw error
  }
}

/**
 * Verifica si el caché es válido
 */
function isCacheValid(metadata) {
  if (!metadata) return false

  const age = Date.now() - metadata.timestamp
  const isExpired = age > CACHE_DURATION
  const versionMatch = metadata.version === CACHE_VERSION

  return !isExpired && versionMatch
}

/**
 * Obtiene datos de bosques desde el caché local (función legacy para compatibilidad)
 * @param {boolean} allowExpired - Si permitir datos expirados
 * @returns {Object|null} Datos en caché o null si no hay o están expirados
 */
function getCachedBosques(allowExpired = false) {
  // Esta función se mantiene por compatibilidad pero ahora usa IndexedDB internamente
  console.warn('getCachedBosques() está deprecated, usar getFromIndexedDB()')
  return null
}

/**
 * Guarda los datos de bosques en el caché local (función legacy para compatibilidad)
 * @param {Object} data - Datos GeoJSON a guardar
 */
function saveBosquesToCache(data) {
  // Esta función se mantiene por compatibilidad pero ahora usa IndexedDB internamente
  console.warn('saveBosquesToCache() está deprecated, usar saveToIndexedDB()')
}

/**
 * Limpia el caché de bosques manualmente
 */
export async function clearBosquesCache() {
  try {
    // Limpiar IndexedDB
    const db = await initIndexedDB()
    const transaction = db.transaction([BOSQUES_STORE], 'readwrite')
    const store = transaction.objectStore(BOSQUES_STORE)
    const request = store.delete(BOSQUES_CACHE_KEY)

    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    console.log('🗑️ Caché de bosques limpiado de IndexedDB')
  } catch (error) {
    console.error('Error limpiando caché de IndexedDB:', error)
    // Fallback a localStorage
    localStorage.removeItem(BOSQUES_CACHE_KEY)
  }
}

/**
 * Obtiene información sobre el estado del caché
 * @returns {Promise<Object>} Información del caché
 */
export async function getBosquesCacheInfo() {
  try {
    const cached = await getFromIndexedDB(BOSQUES_CACHE_KEY, BOSQUES_STORE)
    if (!cached) {
      return { hasCache: false, isExpired: true, timestamp: null }
    }

    const age = Date.now() - cached.metadata.timestamp
    const ageHours = (age / (1000 * 60 * 60)).toFixed(1)
    const isExpired = age > CACHE_DURATION

    return {
      hasCache: true,
      isExpired,
      timestamp: new Date(cached.metadata.timestamp),
      age: `${ageHours} horas`,
      version: cached.metadata.version,
      size: `${(cached.metadata.size / 1024).toFixed(1)} KB`,
      compressed: cached.metadata.compressed,
      expiresIn: isExpired ? 0 : Math.round((CACHE_DURATION - age) / (1000 * 60)) // minutos restantes
    }
  } catch (error) {
    console.error('Error obteniendo info del caché:', error)
    return { hasCache: false, isExpired: true, timestamp: null }
  }
}

/**
 * Optimiza los datos GeoJSON para mejor rendimiento
 * @param {Object} geojson - Datos GeoJSON originales
 * @returns {Object} Datos GeoJSON optimizados
 */
function optimizeGeoJSONData(geojson) {
  try {
    const optimized = {
      ...geojson,
      features: geojson.features.map(feature => {
        // Crear una copia optimizada de cada feature
        const optimizedFeature = {
          type: feature.type,
          geometry: feature.geometry,
          properties: {}
        }

        // Solo mantener propiedades esenciales para el mapa
        const essentialProps = ['id', 'vegetacion', 'super_ha']
        essentialProps.forEach(prop => {
          if (feature.properties && feature.properties[prop] !== undefined) {
            optimizedFeature.properties[prop] = feature.properties[prop]
          }
        })

        // Optimizar geometría si es necesario (reducir precisión de coordenadas)
        if (feature.geometry && feature.geometry.coordinates) {
          optimizedFeature.geometry = optimizeGeometry(feature.geometry)
        }

        return optimizedFeature
      })
    }

    console.log(`🔧 Datos optimizados: ${geojson.features.length} features, reducido ~${calculateSizeReduction(geojson, optimized)}%`)
    return optimized

  } catch (error) {
    console.warn('Error al optimizar datos, usando originales:', error)
    return geojson
  }
}

/**
 * Optimiza la geometría reduciendo precisión de coordenadas cuando es seguro
 * @param {Object} geometry - Geometría GeoJSON
 * @returns {Object} Geometría optimizada
 */
function optimizeGeometry(geometry) {
  // Para coordenadas, mantener precisión de ~1cm (5 decimales)
  // pero solo si no afecta la visualización
  function roundCoordinates(coords, precision = 5) {
    if (typeof coords[0] === 'number') {
      return coords.map(coord => parseFloat(coord.toFixed(precision)))
    }
    return coords.map(subCoords => roundCoordinates(subCoords, precision))
  }

  return {
    ...geometry,
    coordinates: roundCoordinates(geometry.coordinates)
  }
}

/**
 * Calcula la reducción de tamaño aproximada
 * @param {Object} original - Datos originales
 * @param {Object} optimized - Datos optimizados
 * @returns {number} Porcentaje de reducción
 */
function calculateSizeReduction(original, optimized) {
  const originalSize = JSON.stringify(original).length
  const optimizedSize = JSON.stringify(optimized).length
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100)
}

// Funciones auxiliares de IndexedDB
// Funciones auxiliares de IndexedDB se importan desde cacheUtils