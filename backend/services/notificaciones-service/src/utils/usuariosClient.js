import jwt from 'jsonwebtoken'
import { HttpError } from '../middlewares/errores.js'

const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'
const TIMEOUT_MS = 3000

// Token de corta duracion para la llamada de servicio a servicio, firmado
// con el mismo JWT_SECRET que comparten todos los microservicios. No
// representa a ningun usuario real.
function firmarTokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'notificaciones-service', rol: 'Administrador del sistema', servicio: true },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// usuarios-service es el dueño de los datos de usuarios: antes de crear una
// notificacion para otra persona se consulta su API (GET /usuarios/:id) para
// comprobar que el destinatario existe y esta activo; no se toca su base.
//
// Si usuarios-service no responde se devuelve 503 y NO se crea la
// notificacion: es preferible rechazar a guardar algo que no se pudo
// verificar (guia 7.3 y 8.5).
export async function verificarDestinatario(usuarioId) {
  let respuesta
  try {
    respuesta = await fetch(`${USUARIOS_SERVICE_URL}/usuarios/${encodeURIComponent(usuarioId)}`, {
      headers: { Authorization: `Bearer ${firmarTokenServicio()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[notificaciones-service] usuarios-service no respondio:', err.message)
    throw new HttpError(
      503,
      'No se pudo verificar al destinatario porque el servicio de usuarios no responde. La notificacion no fue creada; intenta de nuevo en unos minutos.',
      'SERVICE_UNAVAILABLE',
    )
  }
  if (respuesta.status === 404) {
    throw new HttpError(400, 'El destinatario de la notificacion no existe.', 'RECIPIENT_NOT_FOUND')
  }
  if (!respuesta.ok) {
    console.error(`[notificaciones-service] usuarios-service respondio ${respuesta.status}`)
    throw new HttpError(503, 'El servicio de usuarios no pudo verificar al destinatario.', 'SERVICE_UNAVAILABLE')
  }
  const usuario = await respuesta.json()
  if (usuario.activo === false) {
    throw new HttpError(400, 'El destinatario esta desactivado y no puede recibir notificaciones.', 'RECIPIENT_INACTIVE')
  }
}
