import jwt from 'jsonwebtoken'
import { HttpError } from '../middlewares/errores.js'

const RECURSOS_SERVICE_URL = process.env.RECURSOS_SERVICE_URL || 'http://localhost:4004'
const TIMEOUT_MS = 3000

// Mismo patron que el resto de llamadas entre servicios: token de corta
// duracion firmado con el JWT_SECRET compartido, sin usuario real detras.
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'reservas-service', rol: 'Administrador del sistema', servicio: true },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// E2-21: antes de aceptar una reserva de equipo se pregunta a
// recursos-service (duenio del inventario) cuantas unidades de ese equipo
// estan Disponibles. A diferencia de la indexacion o la sincronizacion de
// stock, esta llamada SI bloquea: si recursos-service no responde se
// devuelve 503 y no se crea una reserva inconsistente (guia 8.5).
export async function unidadesDisponibles(nombreEquipo) {
  const url = `${RECURSOS_SERVICE_URL}/recursos?nombre=${encodeURIComponent(nombreEquipo)}&estado=Disponible`
  let respuesta
  try {
    respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenServicio()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[reservas-service] recursos-service no respondio:', err.message)
    throw new HttpError(
      503,
      'No se pudo verificar la disponibilidad del equipo porque el servicio de recursos no responde. Intenta de nuevo en unos minutos.',
      'SERVICE_UNAVAILABLE',
    )
  }
  if (!respuesta.ok) {
    console.error(`[reservas-service] recursos-service respondio ${respuesta.status}`)
    throw new HttpError(503, 'El servicio de recursos no pudo responder la consulta de disponibilidad.', 'SERVICE_UNAVAILABLE')
  }
  const recursos = await respuesta.json()
  return Array.isArray(recursos) ? recursos.length : 0
}
