/**
 * Servicio para gestionar los datos de perímetro desde la API con caché optimizado usando IndexedDB
 */

import { saveToIndexedDB, getFromIndexedDB, cleanExpiredCache, BOSQUES_STORE, POTREROS_STORE, PERIMETRO_STORE } from '@/utils/cacheUtils'

const API_BASE_URL = 'https://palma.gira360.com'
const PERIMETRO_CACHE_KEY = 'perimetro_data_v2'
const CACHE_VERSION = '2.0'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Obtiene el perímetro en formato GeoJSON con caché inteligente usando IndexedDB
 * @returns {Promise<Object>} Datos GeoJSON con el perímetro
 */
export async function fetchPerimetro() {
  try {
    // Intentar obtener desde IndexedDB primero
    const cached = await getFromIndexedDB(PERIMETRO_CACHE_KEY, PERIMETRO_STORE)

    if (cached && isCacheValid(cached.metadata)) {
      console.log('🏞️ Usando datos de perímetro desde IndexedDB')
      return cached.data
    }

    console.log('🏞️ Descargando datos de perímetro desde API...')

    // Configurar timeout y headers optimizados
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    const response = await fetch(`${API_BASE_URL}/perimetro`, {
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
    await saveToIndexedDB(PERIMETRO_CACHE_KEY, optimizedData, {
      version: CACHE_VERSION,
      originalSize: JSON.stringify(rawData).length,
      optimizedSize: JSON.stringify(optimizedData).length
    }, PERIMETRO_STORE)

    console.log(`💾 Perímetro guardado en IndexedDB (${calculateSizeReduction(rawData, optimizedData)}% reducción)`)

    return optimizedData

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ Timeout descargando perímetro')
    } else {
      console.error('❌ Error obteniendo perímetro:', error)
    }

    // Intentar usar datos expirados como fallback
    const cached = await getFromIndexedDB(PERIMETRO_CACHE_KEY, PERIMETRO_STORE)
    if (cached) {
      console.log('⚠️ Usando datos de perímetro expirados como fallback')
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
 * Optimización de datos GeoJSON para reducir tamaño
 */
export function optimizeGeoJSONData(geojson) {
  if (!geojson || !geojson.features) return geojson

  const optimized = {
    ...geojson,
    features: geojson.features.map(feature => ({
      type: 'Feature',
      geometry: optimizeGeometry(feature.geometry),
      properties: {
        // Mantener solo propiedades esenciales para perímetro
        id: feature.properties?.id,
        nombre: feature.properties?.nombre,
        area_ha: feature.properties?.area_ha,
        tipo: feature.properties?.tipo,
        // Agregar propiedades calculadas si es necesario
      }
    }))
  }

  return optimized
}

/**
 * Optimiza geometrías GeoJSON
 */
function optimizeGeometry(geometry) {
  if (!geometry) return geometry

  switch (geometry.type) {
    case 'Polygon':
      return {
        ...geometry,
        coordinates: geometry.coordinates.map(ring =>
          ring.map(coord => [
            Math.round(coord[0] * 1000000) / 1000000, // 6 decimales de precisión
            Math.round(coord[1] * 1000000) / 1000000
          ])
        )
      }

    case 'MultiPolygon':
      return {
        ...geometry,
        coordinates: geometry.coordinates.map(polygon =>
          polygon.map(ring =>
            ring.map(coord => [
              Math.round(coord[0] * 1000000) / 1000000,
              Math.round(coord[1] * 1000000) / 1000000
            ])
          )
        )
      }

    default:
      return geometry
  }
}

/**
 * Calcula el porcentaje de reducción de tamaño
 */
function calculateSizeReduction(original, optimized) {
  const originalSize = JSON.stringify(original).length
  const optimizedSize = JSON.stringify(optimized).length
  const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1)
  return reduction
}

/**
 * Limpia el caché de perímetro
 */
export async function clearPerimetroCache() {
  try {
    // Limpiar IndexedDB
    const db = await initIndexedDB()
    const transaction = db.transaction([PERIMETRO_STORE], 'readwrite')
    const store = transaction.objectStore(PERIMETRO_STORE)
    const request = store.delete(PERIMETRO_CACHE_KEY)

    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    console.log('🗑️ Caché de perímetro limpiado de IndexedDB')
  } catch (error) {
    console.error('Error limpiando caché de IndexedDB:', error)
    // Fallback a localStorage
    localStorage.removeItem(PERIMETRO_CACHE_KEY)
  }
}

/**
 * Obtiene información del caché actual
 */
export async function getPerimetroCacheInfo() {
  try {
    const cached = await getFromIndexedDB(PERIMETRO_CACHE_KEY, PERIMETRO_STORE)
    if (!cached) return null

    const age = Date.now() - cached.metadata.timestamp
    const ageHours = (age / (1000 * 60 * 60)).toFixed(1)

    return {
      exists: true,
      size: `${(cached.metadata.size / 1024).toFixed(1)} KB`,
      age: `${ageHours} horas`,
      version: cached.metadata.version,
      compressed: cached.metadata.compressed,
      valid: isCacheValid(cached.metadata)
    }
  } catch (error) {
    return null
  }
}

// Funciones auxiliares de IndexedDB
const DB_NAME = 'MapCacheDB'
const DB_VERSION = 3

/**
 * Inicializa IndexedDB para caché avanzado
 */
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Crear stores si no existen
      if (!db.objectStoreNames.contains(PERIMETRO_STORE)) {
        const store = db.createObjectStore(PERIMETRO_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('version', 'version', { unique: false })
      }
    }
  })
}