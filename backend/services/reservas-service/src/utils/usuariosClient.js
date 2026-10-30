import jwt from 'jsonwebtoken'
import { HttpError } from '../middlewares/errores.js'

const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'
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

// usuarios-service es el dueño de las cuentas: antes de crear una reserva se
// consulta su API (GET /usuarios/:id) para comprobar que el solicitante sigue
// existiendo y activo (un token emitido antes de desactivar la cuenta sigue
// siendo valido hasta que vence). No se toca su base de datos.
//
// Si usuarios-service no responde se devuelve 503 y NO se crea la reserva:
// es preferible rechazar a guardar algo que no se pudo verificar (guia 8.5).
export async function verificarUsuarioActivo(usuarioId) {
  let respuesta
  try {
    respuesta = await fetch(`${USUARIOS_SERVICE_URL}/usuarios/${encodeURIComponent(usuarioId)}`, {
      headers: { Authorization: `Bearer ${tokenServicio()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[reservas-service] usuarios-service no respondio:', err.message)
    throw new HttpError(
      503,
      'No se pudo verificar tu cuenta porque el servicio de usuarios no responde. La reserva no fue creada; intenta de nuevo en unos minutos.',
      'SERVICE_UNAVAILABLE',
    )
  }
  if (respuesta.status === 404) {
    throw new HttpError(400, 'El usuario que solicita la reserva ya no existe.', 'USER_NOT_FOUND')
  }
  if (!respuesta.ok) {
    console.error(`[reservas-service] usuarios-service respondio ${respuesta.status}`)
    throw new HttpError(503, 'El servicio de usuarios no pudo verificar tu cuenta.', 'SERVICE_UNAVAILABLE')
  }
  const usuario = await respuesta.json()
  if (usuario.activo === false) {
    throw new HttpError(403, 'Tu cuenta esta desactivada y no puede crear reservas.', 'USER_INACTIVE')
  }
}
