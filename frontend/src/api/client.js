const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'uajs_smart_campus_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// Codigos con los que el backend avisa que la sesion ya no es valida
// (Entregable 3): otra persona/dispositivo inicio sesion con la cuenta, o
// pasaron mas de 30 minutos sin actividad.
export const CODIGOS_SESION_CERRADA = ['SESSION_REPLACED', 'SESSION_EXPIRED']

// AuthContext registra aqui que hacer cuando la sesion se cierra desde el
// servidor (cerrar sesion local y llevar al login con el motivo).
let alCerrarseLaSesion = null
export function onSesionCerrada(handler) {
  alCerrarseLaSesion = handler
}

async function request(method, path, body, extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null

  if (!res.ok) {
    // Formato de error del backend: { success: false, error: { code, message } }.
    // Se acepta tambien el formato viejo { error: 'texto' } por compatibilidad.
    const mensaje =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `Error ${res.status} al comunicarse con el servidor.`
    const error = new Error(mensaje)
    error.status = res.status
    error.code = data?.error?.code || null
    if (res.status === 401 && token && CODIGOS_SESION_CERRADA.includes(error.code) && alCerrarseLaSesion) {
      alCerrarseLaSesion(error.code, mensaje)
    }
    throw error
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  // Consulta el estado de la sesion. Con huboActividad=false no cuenta como
  // actividad del usuario (solo revisa si sigue abierta).
  sesion: (huboActividad) => request('GET', '/auth/sesion', undefined, huboActividad ? {} : { 'X-Sesion-Pasiva': '1' }),
}

// Ping simple al Gateway (fuera de /api) para saber si el backend esta
// arriba. Se usa solo para mostrar un aviso claro en vez de listas vacias
// sin explicacion cuando el backend no esta corriendo.
export async function backendDisponible() {
  try {
    const res = await fetch(`${API_URL.replace(/\/api\/?$/, '')}/health`)
    return res.ok
  } catch {
    return false
  }
}
