import { ref, computed } from 'vue'

/**
 * Composable para manejar la funcionalidad de ordenamiento de tablas
 * @param {Array} data - Array de datos a ordenar
 * @param {String} initialColumn - Columna inicial para ordenar
 * @param {String} initialDirection - Dirección inicial ('asc' o 'desc')
 */
export function useTableSort(data, initialColumn = '', initialDirection = 'asc') {
  const sortColumn = ref(initialColumn)
  const sortDirection = ref(initialDirection)

  /**
   * Ordena los datos según la columna y dirección actuales
   */
  const sortedData = computed(() => {
    if (!sortColumn.value) return data.value

    return [...data.value].sort((a, b) => {
      const aValue = getNestedValue(a, sortColumn.value)
      const bValue = getNestedValue(b, sortColumn.value)

      // Manejar valores nulos o indefinidos
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Comparación
      let comparison = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'es-ES', {
          numeric: true,
          sensitivity: 'base'
        })
      }

      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  })

  /**
   * Cambia el ordenamiento por la columna especificada
   * @param {String} columnKey - Clave de la columna
   */
  const sortBy = (columnKey) => {
    if (sortColumn.value === columnKey) {
      // Toggle direction si es la misma columna
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      // Nueva columna, ordenar ascendente
      sortColumn.value = columnKey
      sortDirection.value = 'asc'
    }
  }

  /**
   * Resetea el ordenamiento
   */
  const resetSort = () => {
    sortColumn.value = initialColumn
    sortDirection.value = initialDirection
  }

  /**
   * Obtiene un valor anidado de un objeto usando notación de punto
   * @param {Object} obj - Objeto
   * @param {String} path - Path del valor (ej: 'user.name')
   */
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  return {
    sortColumn,
    sortDirection,
    sortedData,
    sortBy,
    resetSort
  }
}
