import jwt from 'jsonwebtoken'

const URL_NOTIFICACIONES = process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:4006'

// Token de servicio (servicio: true) firmado con el JWT_SECRET compartido:
// notificaciones-service solo acepta el endpoint interno con este tipo de token.
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'reservas-service', rol: 'Administrador del sistema', servicio: true },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// E2-32: crea una notificacion para un usuario cuando ocurre algo en este
// servicio. Es fire-and-forget: si notificaciones-service esta caido o
// tarda, la operacion principal igual se completa y el error queda en el log.
export async function notificar({ usuarioId, categoria, titulo, mensaje, entidadRelacionada, entidadId }) {
  try {
    const respuesta = await fetch(`${URL_NOTIFICACIONES}/notificaciones/interna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenServicio()}` },
      body: JSON.stringify({ usuarioId, categoria, titulo, mensaje, entidadRelacionada, entidadId }),
      signal: AbortSignal.timeout(2000),
    })
    if (!respuesta.ok) {
      console.error(`[reservas-service] notificaciones-service respondio ${respuesta.status} al crear una notificacion`)
    }
  } catch (err) {
    console.error('[reservas-service] no se pudo crear la notificacion:', err.message)
  }
}
