/**
 * Servicio para gestionar los datos de potreros desde la API con caché optimizado usando IndexedDB
 */

import { saveToIndexedDB, getFromIndexedDB, cleanExpiredCache, BOSQUES_STORE, POTREROS_STORE } from '@/utils/cacheUtils'

const API_BASE_URL = 'https://palma.gira360.com'
const POTREROS_CACHE_KEY = 'potreros_data_v3'
const CACHE_VERSION = '3.0'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Obtiene los potreros en formato GeoJSON con caché inteligente usando IndexedDB
 * @returns {Promise<Object>} Datos GeoJSON con los potreros
 */
export async function fetchPotreros() {
  try {
    // Intentar obtener desde IndexedDB primero
    const cached = await getFromIndexedDB(POTREROS_CACHE_KEY, POTREROS_STORE)

    if (cached && isCacheValid(cached.metadata)) {
      return cached.data
    }

    // Configurar timeout y headers optimizados
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    const response = await fetch(`${API_BASE_URL}/potreros`, {
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
    await saveToIndexedDB(POTREROS_CACHE_KEY, optimizedData, {
      version: CACHE_VERSION,
      originalSize: JSON.stringify(rawData).length,
      optimizedSize: JSON.stringify(optimizedData).length
    }, POTREROS_STORE)

    return optimizedData

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ Timeout descargando potreros')
    } else {
      console.error('❌ Error obteniendo potreros:', error)
    }

    // Intentar usar datos expirados como fallback
    const cached = await getFromIndexedDB(POTREROS_CACHE_KEY, POTREROS_STORE)
    if (cached) {
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
        // Mantener TODAS las propiedades necesarias para popups y funcionalidad
        id: feature.properties?.id,
        nombre: feature.properties?.nombre,
        area_ha: feature.properties?.area_ha,
        super_ha: feature.properties?.super_ha,
        tipo: feature.properties?.tipo,
        // Propiedades necesarias para popups
        bosques_ha: feature.properties?.bosques_ha,
        laguna_ha: feature.properties?.laguna_ha,
        pecuari_ha: feature.properties?.pecuari_ha,
        // Mantener cualquier otra propiedad que pueda existir
        ...feature.properties
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
 * Limpia el caché de potreros
 */
export async function clearPotrerosCache() {
  try {
    // Limpiar IndexedDB
    const db = await initIndexedDB()
    const transaction = db.transaction([POTREROS_STORE], 'readwrite')
    const store = transaction.objectStore(POTREROS_STORE)
    const request = store.delete(POTREROS_CACHE_KEY)

    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

  } catch (error) {
    console.error('Error limpiando caché de IndexedDB:', error)
    // Fallback a localStorage
    localStorage.removeItem(POTREROS_CACHE_KEY)
  }
}

/**
 * Obtiene información del caché actual
 */
export async function getPotrerosCacheInfo() {
  try {
    const cached = await getFromIndexedDB(POTREROS_CACHE_KEY, POTREROS_STORE)
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

// Funciones auxiliares de IndexedDB se importan desde cacheUtils
