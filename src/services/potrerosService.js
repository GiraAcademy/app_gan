/**
 * Servicio para gestionar los datos de potreros desde la API
 */

const API_BASE_URL = 'https://palma.gira360.com'

/**
 * Obtiene los potreros en formato GeoJSON
 * @returns {Promise<Object>} Datos GeoJSON con los potreros
 * @throws {Error} Si hay un error en la petición
 */
export async function fetchPotreros() {
  try {
    const response = await fetch(`${API_BASE_URL}/potreros`)
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Validar estructura básica del GeoJSON
    if (!data || !data.features || !Array.isArray(data.features)) {
      throw new Error('Formato de datos inválido: se esperaba GeoJSON con features')
    }
    
    return data
    
  } catch (error) {
    console.error('❌ Error al cargar potreros:', error)
    throw error
  }
}
