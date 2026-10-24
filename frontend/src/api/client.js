const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'uajs_smart_campus_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Error de la API con la forma que devuelven los microservicios:
//   { error: 'mensaje', codigo: 'CODIGO', detalles: [{ campo, mensaje }] }
// `status` es 0 cuando ni siquiera hubo respuesta (servidor caido, sin red).
export class ApiError extends Error {
  constructor(message, { status = 0, codigo = 'ERROR', detalles } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
    this.detalles = detalles
  }

  get sinConexion() {
    return this.status === 0
  }

  get noEncontrado() {
    return this.status === 404
  }

  get sesionInvalida() {
    return this.status === 401
  }

  // Mensaje de un campo concreto (errores de validacion), para mostrarlo
  // junto al input correspondiente.
  mensajeDeCampo(campo) {
    return this.detalles?.find?.((d) => d.campo === campo)?.mensaje
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', {
      status: 0,
      codigo: 'SIN_CONEXION',
    })
  }

  const contentType = res.headers.get('content-type') || ''
  let data = null
  if (contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Error ${res.status} al comunicarse con el servidor.`, {
      status: res.status,
      codigo: data?.codigo,
      detalles: data?.detalles,
    })
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
}

// Consulta el /health agregado del Gateway (fuera de /api) para mostrar un
// aviso claro en vez de listas vacias sin explicacion:
//   { estado: 'ok' }                               todo responde
//   { estado: 'degradado', caidos: ['reservas'] }  el Gateway esta arriba pero
//                                                  algun microservicio no responde
//   { estado: 'caido' }                            ni el Gateway responde
export async function estadoBackend() {
  try {
    const res = await fetch(`${API_URL.replace(/\/api\/?$/, '')}/health`)
    if (res.ok) return { estado: 'ok', caidos: [] }
    const cuerpo = await res.json().catch(() => null)
    const caidos = (cuerpo?.microservicios || []).filter((m) => !m.ok).map((m) => m.servicio)
    return { estado: 'degradado', caidos }
  } catch {
    return { estado: 'caido', caidos: [] }
  }
}

export async function backendDisponible() {
  return (await estadoBackend()).estado === 'ok'
}
