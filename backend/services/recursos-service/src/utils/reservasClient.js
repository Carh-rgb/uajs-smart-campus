import jwt from 'jsonwebtoken'
import { ErrorApi } from './errores.js'

const RESERVAS_SERVICE_URL = process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003'

// Token de corta duracion para la llamada de servicio a servicio, firmado
// con el mismo JWT_SECRET que comparten todos los microservicios (el
// unico acoplamiento entre ellos, ya usado para validar sesiones de
// usuario). No representa a ningun usuario real.
function firmarTokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'recursos-service', rol: 'Administrador del sistema' },
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

// Cuantas reservas activas (Pendiente/Confirmada, de hoy en adelante) tiene
// un equipo, segun reservas-service (dueño de esos datos). Se usa para no
// eliminar un recurso del que dependen reservas vigentes. Si reservas-service
// no responde NO se asume "sin reservas": se devuelve 503 y no se elimina.
export async function contarReservasActivas(nombre) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)
  try {
    const respuesta = await fetch(`${RESERVAS_SERVICE_URL}/reservas/equipos/uso?nombre=${encodeURIComponent(nombre)}`, {
      headers: { Authorization: `Bearer ${firmarTokenServicio()}` },
      signal: controller.signal,
    })
    if (!respuesta.ok) throw new Error(`reservas-service respondio ${respuesta.status}`)
    const { activas } = await respuesta.json()
    return activas
  } catch (err) {
    console.error('[recursos-service] no se pudo consultar reservas-service:', err.message)
    throw new ErrorApi(
      503,
      'No se pudo verificar si el recurso tiene reservas activas porque reservas-service no esta disponible. No se elimino; intenta de nuevo.',
      'SERVICIO_NO_DISPONIBLE',
    )
  } finally {
    clearTimeout(timeout)
  }
}
