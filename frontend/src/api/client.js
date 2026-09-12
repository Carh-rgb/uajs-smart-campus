const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'uajs_smart_campus_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
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
    throw new Error(data?.error || `Error ${res.status} al comunicarse con el servidor.`)
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
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
