import jwt from 'jsonwebtoken'
import { HttpError } from '../middlewares/errores.js'

const RESERVAS_SERVICE_URL = process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003'

// Token de corta duracion para la llamada de servicio a servicio, firmado
// con el mismo JWT_SECRET que comparten todos los microservicios (el
// unico acoplamiento entre ellos, ya usado para validar sesiones de
// usuario). No representa a ningun usuario real.
function firmarTokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'recursos-service', rol: 'Administrador del sistema', servicio: true },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// Mantiene sincronizado el catalogo de equipos reservables de
// reservas-service con los recursos de tipo Audiovisual/Equipo de
// computo. Si reservas-service no responde, se registra el error pero
// no se interrumpe la operacion sobre el recurso (crear/eliminar debe
// funcionar aunque el otro servicio este caido).
export async function sincronizarEquipoEnReservas({ codigo, nombre, tipo, delta, eliminarSiVacio }) {
  try {
    await fetch(`${RESERVAS_SERVICE_URL}/reservas/equipos/sync`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firmarTokenServicio()}`,
      },
      body: JSON.stringify({ codigo, nombre, tipo, delta, eliminarSiVacio }),
    })
  } catch (err) {
    console.error('[recursos-service] no se pudo sincronizar con reservas-service:', err.message)
  }
}

// Cuenta las reservas vigentes (Pendiente o Confirmada, de hoy en adelante) de
// un equipo. reservas-service es el dueño de esos datos: se consulta su API
// con el token de servicio, que tiene vista completa de las reservas.
//
// A diferencia de la sincronizacion de stock, esta consulta SI bloquea: si
// reservas-service no responde se devuelve 503 y no se elimina el recurso, en
// lugar de asumir que no hay reservas (guia 8.5).
export async function reservasVigentesDeEquipo(nombreEquipo) {
  let respuesta
  try {
    respuesta = await fetch(`${RESERVAS_SERVICE_URL}/reservas`, {
      headers: { Authorization: `Bearer ${firmarTokenServicio()}` },
      signal: AbortSignal.timeout(3000),
    })
  } catch (err) {
    console.error('[recursos-service] reservas-service no respondio:', err.message)
    throw new HttpError(
      503,
      'No se pudo verificar si el equipo tiene reservas porque el servicio de reservas no responde. El recurso no fue eliminado; intenta de nuevo en unos minutos.',
      'SERVICE_UNAVAILABLE',
    )
  }
  if (!respuesta.ok) {
    console.error(`[recursos-service] reservas-service respondio ${respuesta.status}`)
    throw new HttpError(503, 'El servicio de reservas no pudo verificar las reservas del equipo.', 'SERVICE_UNAVAILABLE')
  }
  const reservas = await respuesta.json()
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  return reservas.filter(
    (r) =>
      r.tipoEspacio === 'equipo' &&
      r.espacio === nombreEquipo &&
      ['Pendiente', 'Confirmada'].includes(r.estado) &&
      r.fecha >= hoy,
  ).length
}
