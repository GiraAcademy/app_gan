/**
 * Utilidades para gestión de caché de capas con IndexedDB
 */

// Configuración de IndexedDB para caché avanzado
const DB_NAME = 'MapCacheDB'
const DB_VERSION = 4
const BOSQUES_STORE = 'bosques'
const POTREROS_STORE = 'potreros'
const PERIMETRO_STORE = 'perimetro'
const SUELO_STORE = 'suelo'

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

      // Crear store para bosques si no existe
      if (!db.objectStoreNames.contains(BOSQUES_STORE)) {
        const store = db.createObjectStore(BOSQUES_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('version', 'version', { unique: false })
      }

      // Crear store para potreros si no existe
      if (!db.objectStoreNames.contains(POTREROS_STORE)) {
        const store = db.createObjectStore(POTREROS_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('version', 'version', { unique: false })
      }

      // Crear store para perímetro si no existe
      if (!db.objectStoreNames.contains(PERIMETRO_STORE)) {
        const store = db.createObjectStore(PERIMETRO_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('version', 'version', { unique: false })
      }

      // Crear store para suelo si no existe
      if (!db.objectStoreNames.contains(SUELO_STORE)) {
        const store = db.createObjectStore(SUELO_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('version', 'version', { unique: false })
      }
    }
  })
}

/**
 * Guarda datos en IndexedDB con compresión
 */
export async function saveToIndexedDB(key, data, metadata = {}, storeName = BOSQUES_STORE) {
  try {
    const db = await initIndexedDB()
    
    // Verificar que el store existe
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store '${storeName}' no existe en IndexedDB, usando localStorage`)
      localStorage.setItem(key, JSON.stringify(data))
      return
    }
    
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    // Comprimir datos si son grandes
    const compressedData = data.length > 50000 ? await compressData(data) : data

    const cacheEntry = {
      id: key,
      data: compressedData,
      compressed: data.length > 50000,
      timestamp: Date.now(),
      version: metadata.version || '1.0',
      size: JSON.stringify(data).length,
      ...metadata
    }

    await new Promise((resolve, reject) => {
      const request = store.put(cacheEntry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error guardando en IndexedDB:', error)
    // Fallback a localStorage
    localStorage.setItem(key, JSON.stringify(data))
  }
}

/**
 * Obtiene datos desde IndexedDB con descompresión automática
 */
export async function getFromIndexedDB(key, storeName = BOSQUES_STORE) {
  try {
    const db = await initIndexedDB()
    
    // Verificar que el store existe
    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store '${storeName}' no existe en IndexedDB`)
      return null
    }
    
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)

    const cacheEntry = await new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (!cacheEntry) return null

    // Descomprimir si es necesario
    const data = cacheEntry.compressed ? await decompressData(cacheEntry.data) : cacheEntry.data

    return {
      data,
      metadata: {
        timestamp: cacheEntry.timestamp,
        version: cacheEntry.version,
        size: cacheEntry.size,
        compressed: cacheEntry.compressed
      }
    }
  } catch (error) {
    console.warn('Error obteniendo de IndexedDB:', error)
    // Fallback a localStorage
    const fallback = localStorage.getItem(key)
    return fallback ? { data: JSON.parse(fallback) } : null
  }
}

/**
 * Compresión simple usando LZ-string (si está disponible)
 */
async function compressData(data) {
  // Si tienes LZ-string instalado, puedes usarlo aquí
  // Por ahora, devolver datos sin comprimir
  return data
}

async function decompressData(data) {
  // Si tienes LZ-string instalado, puedes usarlo aquí
  return data
}

/**
 * Limpia entradas expiradas de IndexedDB
 */
export async function cleanExpiredCache(maxAgeHours = 24, storeName = null) {
  const storesToClean = storeName ? [storeName] : [BOSQUES_STORE, POTREROS_STORE, PERIMETRO_STORE, SUELO_STORE]

  for (const store of storesToClean) {
    try {
      const db = await initIndexedDB()
      
      // Verificar que el store existe
      if (!db.objectStoreNames.contains(store)) {
        continue
      }
      
      const transaction = db.transaction([store], 'readwrite')
      const storeObj = transaction.objectStore(store)
      const index = storeObj.index('timestamp')

      const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000)
      const range = IDBKeyRange.upperBound(cutoff)

      const request = index.openCursor(range)
      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        }
      }
    } catch (error) {
      console.error(`Error limpiando caché expirado de ${store}:`, error)
    }
  }
}

/**
 * Obtiene estadísticas del caché
 */
export async function getCacheStats(storeName = null) {
  const storesToCheck = storeName ? [storeName] : [BOSQUES_STORE, POTREROS_STORE, PERIMETRO_STORE]
  const allStats = {}

  for (const store of storesToCheck) {
    try {
      const db = await initIndexedDB()
      const transaction = db.transaction([store], 'readonly')
      const storeObj = transaction.objectStore(store)

      const stats = {
        totalEntries: 0,
        totalSize: 0,
        entries: []
      }

      await new Promise((resolve, reject) => {
        const request = storeObj.openCursor()

        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            const entry = cursor.value
            stats.totalEntries++
            stats.totalSize += entry.size
            stats.entries.push({
              id: entry.id,
              size: entry.size,
              timestamp: entry.timestamp,
              version: entry.version,
              compressed: entry.compressed
            })
            cursor.continue()
          } else {
            stats.totalSizeFormatted = `${(stats.totalSize / 1024).toFixed(1)} KB`
            resolve(stats)
          }
        }

        request.onerror = () => reject(request.error)
      })

      allStats[store] = stats
    } catch (error) {
      console.error(`Error obteniendo estadísticas del caché ${store}:`, error)
      allStats[store] = null
    }
  }

  return allStats
}

/**
 * Muestra información del caché de bosques en la consola
 */
export function logBosquesCacheInfo() {
}

/**
 * Función global para limpiar caché de bosques (disponible en consola)
 */
export function clearBosquesCacheGlobal() {
}

/**
 * Función global para mostrar info del caché (disponible en consola)
 */
export function showBosquesCacheInfo() {
}

// Hacer disponible en window para acceso desde consola
if (typeof window !== 'undefined') {
  window.logBosquesCacheInfo = logBosquesCacheInfo
  window.clearBosquesCache = clearBosquesCacheGlobal
  window.showBosquesCacheInfo = showBosquesCacheInfo
}

// Exportar constantes para uso en otros módulos
export { BOSQUES_STORE, POTREROS_STORE, PERIMETRO_STORE, SUELO_STORE }