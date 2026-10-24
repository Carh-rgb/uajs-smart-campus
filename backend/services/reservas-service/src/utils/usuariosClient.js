import jwt from 'jsonwebtoken'
import { ErrorApi } from './errores.js'

const URL_USUARIOS = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'
const TIMEOUT_MS = 3000

// Token de servicio de corta duracion (mismo patron que busquedaClient.js).
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'reservas-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// usuarios-service es el dueño de los datos de usuarios. Antes de crear una
// reserva se consulta su API publica (GET /usuarios/:id) para comprobar que
// el usuario existe y sigue activo; no se toca su base de datos.
//
// Si usuarios-service no responde se devuelve 503 y NO se crea la reserva:
// preferimos rechazar a guardar una reserva que no pudimos verificar (PDF 8.5).
export async function verificarUsuarioActivo(usuarioId) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const respuesta = await fetch(`${URL_USUARIOS}/usuarios/${usuarioId}`, {
      headers: { Authorization: `Bearer ${tokenServicio()}` },
      signal: controller.signal,
    })
    if (respuesta.status === 404) {
      throw new ErrorApi(400, 'El usuario que solicita la reserva no existe.', 'USUARIO_INEXISTENTE')
    }
    if (!respuesta.ok) throw new Error(`usuarios-service respondio ${respuesta.status}`)
    const usuario = await respuesta.json()
    if (!usuario.activo) {
      throw new ErrorApi(403, 'El usuario esta desactivado y no puede crear reservas.', 'USUARIO_INACTIVO')
    }
  } catch (err) {
    if (err instanceof ErrorApi) throw err
    console.error('[reservas-service] no se pudo consultar usuarios-service:', err.message)
    throw new ErrorApi(
      503,
      'No se pudo verificar al usuario porque usuarios-service no esta disponible. La reserva no fue creada; intenta de nuevo en unos segundos.',
      'SERVICIO_NO_DISPONIBLE',
    )
  } finally {
    clearTimeout(timeout)
  }
}
