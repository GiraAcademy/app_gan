/**
 * Servicio para gestionar los datos de perímetro desde la API
 */

const API_BASE_URL = 'https://palma.gira360.com'

/**
 * Obtiene el perímetro en formato GeoJSON
 * @returns {Promise<Object>} Datos GeoJSON con el perímetro
 * @throws {Error} Si hay un error en la petición
 */
export async function fetchPerimetro() {
  try {
    const response = await fetch(`${API_BASE_URL}/perimetro`)

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
    console.error('❌ Error al cargar perímetro:', error)
    throw error
  }
}