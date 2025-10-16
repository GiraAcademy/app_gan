import { ref, computed } from 'vue'

/**
 * Composable para manejar la paginación de tablas
 * @param {Array} data - Array de datos a paginar
 * @param {Number} initialPageSize - Tamaño inicial de página
 */
export function useTablePagination(data, initialPageSize = 25) {
  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)

  /**
   * Número total de páginas
   */
  const totalPages = computed(() => {
    return Math.ceil(data.value.length / pageSize.value)
  })

  /**
   * Datos de la página actual
   */
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return data.value.slice(start, end)
  })

  /**
   * Indica si hay una página anterior
   */
  const hasPreviousPage = computed(() => {
    return currentPage.value > 1
  })

  /**
   * Indica si hay una página siguiente
   */
  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  /**
   * Va a la página especificada
   * @param {Number} page - Número de página
   */
  const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
  }

  /**
   * Va a la página siguiente
   */
  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  /**
   * Va a la página anterior
   */
  const previousPage = () => {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  /**
   * Cambia el tamaño de página
   * @param {Number} size - Nuevo tamaño
   */
  const setPageSize = (size) => {
    pageSize.value = size
    currentPage.value = 1 // Resetear a primera página
  }

  /**
   * Resetea la paginación
   */
  const resetPagination = () => {
    currentPage.value = 1
    pageSize.value = initialPageSize
  }

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    resetPagination
  }
}
