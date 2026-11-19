/**
 * Control de sesion en el API Gateway (Entregable 3)
 * ==================================================
 * Antes de reenviar una peticion autenticada (con "Authorization: Bearer")
 * el Gateway le pregunta a usuarios-service si ese token sigue siendo el de
 * la sesion vigente del usuario (GET /auth/sesion). Asi se aplican dos
 * reglas en un solo lugar, para los 7 microservicios:
 *
 *  - Sesion unica: si la cuenta inicio sesion en otro dispositivo, el token
 *    viejo recibe 401 SESSION_REPLACED.
 *  - Inactividad: si pasaron mas de 30 minutos sin peticiones, el token
 *    recibe 401 SESSION_EXPIRED y hay que volver a iniciar sesion.
 *
 * La firma del JWT la sigue validando cada microservicio por su cuenta; aqui
 * solo se mira la sesion. Si la respuesta de usuarios-service es cualquier
 * otra cosa (token mal formado, servicio caido...), la peticion sigue su
 * curso normal: el microservicio de destino decide, y una caida de
 * usuarios-service no tumba al resto del sistema (prueba de resiliencia T12).
 */

const USUARIOS_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'

// Rutas que no requieren sesion (o que usuarios-service ya revisa solo).
const RUTAS_LIBRES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/sesion',
  '/api/auth/logout',
]

// Se consulta en cada peticion (sin cache) para que el cierre sea inmediato:
// es una consulta interna por clave primaria y tarda pocos milisegundos.
const TIMEOUT_MS = 2000

const CODIGOS_DE_SESION = new Set(['SESSION_REPLACED', 'SESSION_EXPIRED'])

async function consultarSesion(authorization) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const respuesta = await fetch(`${USUARIOS_URL}/auth/sesion`, {
      headers: { Authorization: authorization },
      signal: controller.signal,
    })
    if (respuesta.ok) return { ok: true }
    const cuerpo = await respuesta.json().catch(() => null)
    const error = cuerpo?.error
    if (respuesta.status === 401 && CODIGOS_DE_SESION.has(error?.code)) {
      return { ok: false, status: 401, code: error.code, message: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.warn('[gateway] no se pudo verificar la sesion (se deja pasar):', err.message)
    return { ok: true }
  } finally {
    clearTimeout(timeout)
  }
}

export function verificarSesion() {
  return async (req, res, next) => {
    const authorization = req.headers.authorization || ''
    if (
      req.method === 'OPTIONS' ||
      !req.path.startsWith('/api/') ||
      !authorization.startsWith('Bearer ') ||
      RUTAS_LIBRES.some((ruta) => req.path === ruta || req.path.startsWith(`${ruta}/`))
    ) {
      return next()
    }

    const resultado = await consultarSesion(authorization)
    if (!resultado.ok) {
      return res.status(resultado.status).json({
        success: false,
        error: { code: resultado.code, message: resultado.message },
      })
    }
    next()
  }
}
