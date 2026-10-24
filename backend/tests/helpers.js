// Utilidades compartidas por las pruebas de API (node --test, sin dependencias).
// Las pruebas golpean el API Gateway real (por defecto http://localhost:4000/api),
// asi que antes hay que levantar la base de datos y los servicios:
//   npm run db:up && npm run dev        (en backend/)
//   npm test                            (en backend/)
import assert from 'node:assert/strict'

export const BASE = process.env.API_URL || 'http://localhost:4000/api'
export const PASSWORD = process.env.SEED_PASSWORD || 'uajs2026'

export const USUARIOS = {
  estudiante: 'camilo.ramirez@uajs.edu.co',
  docente: 'laura.perez@uajs.edu.co',
  administrativo: 'andres.gomez@uajs.edu.co',
  admin: 'admin@uajs.edu.co',
}

// Llama al Gateway. Devuelve { status, data } sin lanzar por codigos 4xx/5xx
// para poder afirmar sobre los errores esperados.
export async function api(method, ruta, { token, body, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${ruta}`, {
    method,
    headers,
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  })
  const texto = await res.text()
  let data = null
  try {
    data = texto ? JSON.parse(texto) : null
  } catch {
    data = texto
  }
  return { status: res.status, data }
}

// Inicia sesion con uno de los usuarios de prueba y devuelve { token, usuario }.
export async function sesion(rol) {
  const { status, data } = await api('POST', '/auth/login', { body: { correo: USUARIOS[rol], password: PASSWORD } })
  assert.equal(status, 200, `login de ${rol} fallo (${status}). ¿Estan corriendo la BD y los servicios?`)
  return { token: data.token, usuario: data.usuario || data.user }
}

// Afirma la forma estandar de error: { error, codigo, detalles? }.
export function esperarError(resp, status, codigo) {
  assert.equal(resp.status, status, `esperaba ${status}, llego ${resp.status}: ${JSON.stringify(resp.data)}`)
  assert.equal(typeof resp.data.error, 'string')
  if (codigo) assert.equal(resp.data.codigo, codigo)
}

export const sufijo = () => Date.now().toString(36).toUpperCase()
