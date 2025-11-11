/**
 * Configuraciones de tabla de atributos para capas vectoriales
 * Este archivo centraliza la configuración de columnas y opciones
 * de forma reutilizable para futuras capas
 */

/**
 * Configuración para la capa de Potreros (única capa actual)
 */
export const potrerosTableConfig = {
  layerName: 'Potreros',
  panelHeight: 350,
  minTableWidth: '1200px',
  searchPlaceholder: 'Buscar potreros...',
  rowSelectLabel: 'Clic para seleccionar potrero en el mapa',
  // Las columnas se generarán dinámicamente desde los datos de la API
  // Esto permite flexibilidad si cambia la estructura de datos
  columns: []
}

/**
 * Configuración para la capa de Perímetro
 */
export const perimetroTableConfig = {
  layerName: 'Perímetro',
  panelHeight: 350,
  minTableWidth: '1200px',
  searchPlaceholder: 'Buscar perímetro...',
  rowSelectLabel: 'Clic para seleccionar perímetro en el mapa',
  // Las columnas se generarán dinámicamente desde los datos de la API
  columns: []
}

/**
 * Configuración para la capa de Bosques
 */
export const bosquesTableConfig = {
  layerName: 'Bosques',
  panelHeight: 350,
  minTableWidth: '1200px',
  searchPlaceholder: 'Buscar bosques...',
  rowSelectLabel: 'Clic para seleccionar bosque en el mapa',
  // Las columnas se generarán dinámicamente desde los datos de la API
  columns: []
}

/**
 * Configuración para la capa de Suelo
 */
export const sueloTableConfig = {
  layerName: 'Puntos de Suelo',
  panelHeight: 350,
  minTableWidth: '1200px',
  searchPlaceholder: 'Buscar puntos de suelo...',
  rowSelectLabel: 'Clic para seleccionar punto en el mapa',
  // Las columnas se generarán dinámicamente desde los datos de la API
  columns: []
}

/**
 * Configuración genérica por defecto para futuras capas
 */
export const defaultTableConfig = {
  layerName: 'Datos',
  panelHeight: 350,
  minTableWidth: '1200px',
  searchPlaceholder: 'Buscar...',
  rowSelectLabel: 'Clic para seleccionar elemento en el mapa',
  columns: []
}

/**
 * Obtiene la configuración de tabla para un tipo de capa específico
 * @param {String} layerType - Tipo de capa (actualmente solo 'potreros')
 * @returns {Object} Configuración de la tabla
 */
export function getTableConfig(layerType = 'potreros') {
  // Mapa de configuraciones disponibles
  const configs = {
    potreros: potrerosTableConfig,
    perimetro: perimetroTableConfig,
    bosques: bosquesTableConfig,
    suelo: sueloTableConfig
    // Aquí se pueden agregar más capas en el futuro:
    // rios: riosTableConfig,
    // etc.
  }

  return configs[layerType] || defaultTableConfig
}

/**
 * Genera columnas dinámicamente desde los datos de la API
 * Útil cuando no se conoce la estructura exacta de antemano
 * @param {Array} data - Array de datos GeoJSON features procesados
 * @returns {Array} Array de columnas formateadas
 */
export function generateColumnsFromData(data) {
  if (!data || data.length === 0) return []

  const firstRow = data[0]
  const columns = []

  // Definir el orden preferido de columnas comunes
  const preferredOrder = ['id', 'geometry', 'nombre', 'area', 'perimetro']
  const allKeys = Object.keys(firstRow)
  
  // Primero agregar las columnas en el orden preferido
  preferredOrder.forEach(key => {
    if (allKeys.includes(key)) {
      columns.push(createColumnConfig(key, firstRow[key]))
    }
  })
  
  // Luego agregar el resto de columnas
  allKeys.forEach(key => {
    if (!preferredOrder.includes(key)) {
      columns.push(createColumnConfig(key, firstRow[key]))
    }
  })

  return columns
}

/**
 * Crea una configuración de columna basada en el tipo de dato
 * @param {String} key - Clave de la propiedad
 * @param {*} value - Valor de ejemplo
 * @returns {Object} Configuración de columna
 */
function createColumnConfig(key, value) {
  const config = {
    key,
    label: formatColumnLabel(key),
    minWidth: '120px',
    type: typeof value === 'number' ? 'number' : 'string'
  }

  // Ajustar ancho según el tipo de columna
  if (key === 'id') config.minWidth = '80px'
  if (key === 'nombre' || key === 'name') config.minWidth = '200px'
  if (key === 'geometry') config.minWidth = '130px'
  
  // Configurar decimales para números
  if (config.type === 'number') {
    if (key.includes('area') || key.includes('perimetro')) {
      config.decimals = 2
    } else if (key.includes('coord') || key.includes('lat') || key.includes('lon')) {
      config.decimals = 6
    }
  }

  return config
}

/**
 * Formatea el nombre de una columna para display
 * @param {String} key - Clave de la columna
 * @returns {String} Label formateado
 */
function formatColumnLabel(key) {
  // Casos especiales
  const specialCases = {
    'id': 'ID',
    'gid': 'GID',
    'geometry': 'GEOMETRÍA',
    'area': 'ÁREA (ha)',
    'perimetro': 'PERÍMETRO (m)',
    'nombre': 'NOMBRE'
  }

  if (specialCases[key.toLowerCase()]) {
    return specialCases[key.toLowerCase()]
  }

  // Formato general: reemplazar guiones bajos y poner en mayúsculas
  return key.toUpperCase().replace(/_/g, ' ')
}
