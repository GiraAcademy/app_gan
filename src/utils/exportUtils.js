/**
 * Utilidad para exportar datos a formato CSV
 * @param {Array} data - Array de objetos a exportar
 * @param {Array} columns - Columnas a incluir (opcional)
 * @param {String} filename - Nombre del archivo
 */
export function exportToCSV(data, columns = null, filename = 'export.csv') {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar')
    return
  }

  // Si no se especifican columnas, usar todas las claves del primer objeto
  const headers = columns 
    ? columns.map(col => col.key || col)
    : Object.keys(data[0])

  const headerLabels = columns
    ? columns.map(col => col.label || col.key || col)
    : headers

  // Construir CSV
  const csvRows = []
  
  // Añadir encabezados
  csvRows.push(headerLabels.map(escapeCSVValue).join(','))
  
  // Añadir filas
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      return escapeCSVValue(value)
    })
    csvRows.push(values.join(','))
  }
  
  const csvContent = csvRows.join('\n')
  
  // Descargar archivo
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
}

/**
 * Escapa valores para CSV
 * @param {*} value - Valor a escapar
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) return ''
  
  const stringValue = String(value)
  
  // Si contiene comas, comillas o saltos de línea, envolver en comillas
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Descarga un archivo en el navegador
 * @param {String} content - Contenido del archivo
 * @param {String} filename - Nombre del archivo
 * @param {String} mimeType - Tipo MIME
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Genera un nombre de archivo con fecha actual
 * @param {String} baseName - Nombre base
 * @param {String} extension - Extensión (sin punto)
 */
export function generateFilename(baseName, extension = 'csv') {
  const date = new Date()
  const dateString = date.toISOString().split('T')[0]
  const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-')
  return `${baseName}_${dateString}_${timeString}.${extension}`
}
