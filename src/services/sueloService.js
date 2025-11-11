/**
 * Servicio para gestionar los datos de suelo desde la API con caché optimizado usando IndexedDB
 */

import { saveToIndexedDB, getFromIndexedDB, cleanExpiredCache, SUELO_STORE } from '@/utils/cacheUtils'

const API_BASE_URL = 'https://palma.gira360.com'
const SUELO_CACHE_KEY = 'suelo_data_v1'
const CACHE_VERSION = '1.0'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Obtiene los puntos de suelo en formato GeoJSON con caché inteligente usando IndexedDB
 * @returns {Promise<Object>} Datos GeoJSON con los puntos de suelo
 */
export async function fetchSuelo() {
  try {
    // Intentar obtener desde IndexedDB primero
    const cached = await getFromIndexedDB(SUELO_CACHE_KEY, SUELO_STORE)

    if (cached && isCacheValid(cached.metadata)) {
      console.log('🌍 Usando datos de suelo desde IndexedDB')
      return cached.data
    }

    console.log('🌍 Descargando datos de suelo desde API...')

    // Configurar timeout y headers optimizados
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    const response = await fetch(`${API_BASE_URL}/suelo`, {
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

    // Guardar en IndexedDB con metadata
    await saveToIndexedDB(SUELO_CACHE_KEY, rawData, { version: CACHE_VERSION }, SUELO_STORE)

    console.log(`✅ Suelo cargado exitosamente: ${rawData.features.length} puntos`)
    return rawData
  } catch (error) {
    console.error('❌ Error al obtener datos de suelo:', error)
    throw error
  }
}

/**
 * Verifica si el caché es válido basado en la metadata
 * @param {Object} metadata - Metadata del caché
 * @returns {boolean} True si el caché es válido
 */
function isCacheValid(metadata) {
  if (!metadata || !metadata.timestamp) return false
  const now = Date.now()
  const age = now - metadata.timestamp
  return age < CACHE_DURATION
}
