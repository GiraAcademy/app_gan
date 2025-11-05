/**
 * Utilidades para gestión de caché de capas
 */

import { getBosquesCacheInfo, clearBosquesCache } from '@/services/bosquesService'

/**
 * Muestra información del caché de bosques en la consola
 */
export function logBosquesCacheInfo() {
  const info = getBosquesCacheInfo()

  if (!info.hasCache) {
    console.log('📭 No hay datos de bosques en caché')
    return
  }

  console.group('🌲 Información del caché de bosques')
  console.log(`📅 Timestamp: ${info.timestamp}`)
  console.log(`⏱️ Edad: ${info.age} minutos`)
  console.log(`⏳ Expira en: ${info.expiresIn} minutos`)
  console.log(`📊 Estado: ${info.isExpired ? 'EXPIRADO' : 'VÁLIDO'}`)
  console.groupEnd()

  if (info.isExpired) {
    console.warn('⚠️ El caché ha expirado. Los próximos datos se cargarán desde la API.')
  }
}

/**
 * Función global para limpiar caché de bosques (disponible en consola)
 */
export function clearBosquesCacheGlobal() {
  clearBosquesCache()
  console.log('🗑️ Caché de bosques limpiado desde consola')
}

/**
 * Función global para mostrar info del caché (disponible en consola)
 */
export function showBosquesCacheInfo() {
  logBosquesCacheInfo()
}

// Hacer disponible en window para acceso desde consola
if (typeof window !== 'undefined') {
  window.logBosquesCacheInfo = logBosquesCacheInfo
  window.clearBosquesCache = clearBosquesCacheGlobal
  window.showBosquesCacheInfo = showBosquesCacheInfo

  // Mostrar instrucciones de uso al cargar
  console.log(`
🌲 Sistema de caché de bosques activado
📋 Comandos disponibles en consola:
  • showBosquesCacheInfo() - Ver información del caché
  • clearBosquesCache() - Limpiar caché manualmente
  • logBosquesCacheInfo() - Alias de showBosquesCacheInfo
  `)
}