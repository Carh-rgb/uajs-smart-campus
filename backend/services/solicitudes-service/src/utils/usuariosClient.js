import jwt from 'jsonwebtoken'
import { ErrorApi } from './errores.js'

const URL_USUARIOS = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'
const TIMEOUT_MS = 3000

// Token de servicio de corta duracion (mismo patron que busquedaClient.js):
// firmado con el JWT_SECRET compartido, no representa a ningun usuario real.
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'solicitudes-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// usuarios-service es el dueño de los datos de usuarios: aqui NO se lee su
// base de datos, se consulta su API publica (GET /usuarios/responsables).
// Si no responde, la operacion falla con 503 controlado en vez de guardar
// un responsable sin verificar.
async function obtenerResponsables() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const respuesta = await fetch(`${URL_USUARIOS}/usuarios/responsables`, {
      headers: { Authorization: `Bearer ${tokenServicio()}` },
      signal: controller.signal,
    })
    if (!respuesta.ok) throw new Error(`usuarios-service respondio ${respuesta.status}`)
    return await respuesta.json()
  } catch (err) {
    console.error('[solicitudes-service] no se pudo consultar usuarios-service:', err.message)
    throw new ErrorApi(
      503,
      'No se pudo verificar al responsable porque usuarios-service no esta disponible. Intenta de nuevo en unos segundos.',
      'SERVICIO_NO_DISPONIBLE',
    )
  } finally {
    clearTimeout(timeout)
  }
}

// Verifica que `nombre` sea un Docente o Administrativo activo.
export async function validarResponsable(nombre) {
  const responsables = await obtenerResponsables()
  const existe = responsables.some((u) => u.nombre === nombre)
  if (!existe) {
    throw new ErrorApi(400, `"${nombre}" no es un responsable valido (debe ser un Docente o Administrativo activo).`, 'VALIDACION', [
      { campo: 'asignadoA', mensaje: 'Responsable inexistente o inactivo.' },
    ])
  }
}
