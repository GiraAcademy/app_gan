/**
 * Servicio para gestionar los datos de bosques desde la API con caché
 */

const API_BASE_URL = 'https://palma.gira360.com'
const CACHE_KEY = 'bosques_cache'
const CACHE_EXPIRY_HOURS = 24 // Cache expires after 24 hours

/**
 * Obtiene los datos de bosques desde caché o API
 * @returns {Promise<Object>} Datos GeoJSON con los bosques
 * @throws {Error} Si hay un error en la petición y no hay caché disponible
 */
export async function fetchBosques() {
  try {
    // Verificar si hay datos válidos en caché
    const cachedData = getCachedBosques()
    if (cachedData) {
      console.log('✅ Usando datos de bosques desde caché')
      return cachedData
    }

    console.log('🔄 Cargando datos de bosques desde API...')

    // Si no hay caché válido, hacer petición a la API
    const response = await fetch(`${API_BASE_URL}/bosques`)

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()

    // Validar estructura básica del GeoJSON
    if (!data || !data.features || !Array.isArray(data.features)) {
      throw new Error('Formato de datos inválido: se esperaba GeoJSON con features')
    }

    // Guardar en caché
    saveBosquesToCache(data)
    console.log('💾 Datos de bosques guardados en caché')

    return data

  } catch (error) {
    console.error('❌ Error al cargar bosques:', error)

    // Intentar usar caché como fallback si está disponible (aunque expirado)
    const expiredCache = getCachedBosques(true) // true para permitir datos expirados
    if (expiredCache) {
      console.warn('⚠️ Usando datos de bosques expirados desde caché como fallback')
      return expiredCache
    }

    throw error
  }
}

/**
 * Obtiene datos de bosques desde el caché local
 * @param {boolean} allowExpired - Si permitir datos expirados
 * @returns {Object|null} Datos en caché o null si no hay o están expirados
 */
function getCachedBosques(allowExpired = false) {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const cacheData = JSON.parse(cached)
    const now = Date.now()

    // Verificar si el caché ha expirado
    if (!allowExpired && (now - cacheData.timestamp) > (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)) {
      console.log('🗑️ Cachée de bosques expirado, eliminando...')
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return cacheData.data
  } catch (error) {
    console.error('Error al leer caché de bosques:', error)
    return null
  }
}

/**
 * Guarda los datos de bosques en el caché local
 * @param {Object} data - Datos GeoJSON a guardar
 */
function saveBosquesToCache(data) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error al guardar caché de bosques:', error)
  }
}

/**
 * Limpia el caché de bosques manualmente
 */
export function clearBosquesCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    console.log('🗑️ Cachée de bosques limpiado manualmente')
  } catch (error) {
    console.error('Error al limpiar caché de bosques:', error)
  }
}

/**
 * Obtiene información sobre el estado del caché
 * @returns {Object} Información del caché
 */
export function getBosquesCacheInfo() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) {
      return { hasCache: false, isExpired: true, timestamp: null }
    }

    const cacheData = JSON.parse(cached)
    const now = Date.now()
    const isExpired = (now - cacheData.timestamp) > (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)

    return {
      hasCache: true,
      isExpired,
      timestamp: new Date(cacheData.timestamp),
      age: Math.round((now - cacheData.timestamp) / (1000 * 60)), // edad en minutos
      expiresIn: isExpired ? 0 : Math.round(((cacheData.timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)) - now) / (1000 * 60)) // minutos restantes
    }
  } catch (error) {
    console.error('Error al obtener info del caché:', error)
    return { hasCache: false, isExpired: true, timestamp: null }
  }
}