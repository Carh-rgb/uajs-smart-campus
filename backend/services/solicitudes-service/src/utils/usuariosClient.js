import jwt from 'jsonwebtoken'
import { HttpError } from '../middlewares/errores.js'

const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'
const TIMEOUT_MS = 3000

// Mismo patron que el resto de llamadas entre servicios: token de corta
// duracion firmado con el JWT_SECRET compartido, sin usuario real detras.
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'solicitudes-service', rol: 'Administrador del sistema', servicio: true },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// usuarios-service es el dueño de las cuentas: antes de asignar una PQRS se
// consulta su API (GET /usuarios/responsables, los Docentes y Administrativos
// activos) para comprobar que el responsable existe. No se toca su base.
//
// Si usuarios-service no responde se devuelve 503 y NO se asigna: es
// preferible rechazar a guardar una asignacion que no se pudo verificar
// (guia 8.5).
export async function validarResponsable(nombre) {
  let respuesta
  try {
    respuesta = await fetch(`${USUARIOS_SERVICE_URL}/usuarios/responsables`, {
      headers: { Authorization: `Bearer ${tokenServicio()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[solicitudes-service] usuarios-service no respondio:', err.message)
    throw new HttpError(
      503,
      'No se pudo verificar al responsable porque el servicio de usuarios no responde. La asignacion no fue guardada; intenta de nuevo en unos minutos.',
      'SERVICE_UNAVAILABLE',
    )
  }
  if (!respuesta.ok) {
    console.error(`[solicitudes-service] usuarios-service respondio ${respuesta.status}`)
    throw new HttpError(503, 'El servicio de usuarios no pudo verificar al responsable.', 'SERVICE_UNAVAILABLE')
  }
  const responsables = await respuesta.json()
  if (!responsables.some((r) => r.nombre === nombre)) {
    throw new HttpError(
      400,
      `"${nombre}" no es un responsable valido: debe ser un Docente o Administrativo activo.`,
      'ASSIGNEE_NOT_FOUND',
    )
  }
}
