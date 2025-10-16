import { ref, computed } from 'vue'

/**
 * Composable para manejar la funcionalidad de búsqueda/filtrado en tablas
 * @param {Array} data - Array de datos a filtrar
 * @param {Array} searchableFields - Campos en los que buscar (opcional)
 */
export function useTableFilter(data, searchableFields = []) {
  const searchQuery = ref('')

  /**
   * Datos filtrados según la búsqueda
   */
  const filteredData = computed(() => {
    if (!searchQuery.value.trim()) return data.value

    const query = searchQuery.value.toLowerCase().trim()

    return data.value.filter(row => {
      // Si hay campos específicos, buscar solo en ellos
      if (searchableFields.length > 0) {
        return searchableFields.some(field => {
          const value = getNestedValue(row, field)
          return matchesQuery(value, query)
        })
      }

      // Si no hay campos específicos, buscar en todos
      return Object.values(row).some(value => matchesQuery(value, query))
    })
  })

  /**
   * Número de registros filtrados
   */
  const filteredCount = computed(() => {
    return searchQuery.value.trim() ? filteredData.value.length : 0
  })

  /**
   * Indica si hay filtros activos
   */
  const hasActiveFilter = computed(() => {
    return searchQuery.value.trim().length > 0
  })

  /**
   * Verifica si un valor coincide con la consulta de búsqueda
   * @param {*} value - Valor a comparar
   * @param {String} query - Query de búsqueda
   */
  const matchesQuery = (value, query) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'object') return false
    return String(value).toLowerCase().includes(query)
  }

  /**
   * Obtiene un valor anidado de un objeto
   * @param {Object} obj - Objeto
   * @param {String} path - Path del valor
   */
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Limpia el filtro de búsqueda
   */
  const clearFilter = () => {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    filteredData,
    filteredCount,
    hasActiveFilter,
    clearFilter
  }
}
