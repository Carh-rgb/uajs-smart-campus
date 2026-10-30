// Pruebas de API: API Gateway, autenticacion, formato de error y health (T15).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, BASE, PASSWORD, USUARIOS } from './helpers.js'

describe('API Gateway y autenticacion', () => {
  test('T15 health agregado del Gateway -> 200 con el estado de los 7 microservicios', async () => {
    const res = await fetch(`${BASE.replace(/\/api\/?$/, '')}/health`)
    const data = await res.json()
    assert.equal(res.status, 200, `servicios caidos: ${JSON.stringify(data.microservicios?.filter((m) => !m.ok))}`)
    assert.equal(data.status, 'ok')
    assert.equal(data.microservicios.length, 7)
    assert.ok(data.microservicios.every((m) => m.ok))
  })

  test('login valido -> 200 con token y usuario sin hash de contrasena', async () => {
    const r = await api('POST', '/auth/login', { body: { correo: USUARIOS.estudiante, password: PASSWORD } })
    assert.equal(r.status, 200)
    assert.ok(r.data.token)
    assert.equal(r.data.usuario.rol, 'Estudiante')
    assert.equal(r.data.usuario.passwordHash, undefined)
  })

  test('login con credenciales invalidas -> 401', async () => {
    esperarError(await api('POST', '/auth/login', { body: { correo: USUARIOS.estudiante, password: 'incorrecta' } }), 401)
    esperarError(await api('POST', '/auth/login', { body: { correo: 'nadie@uajs.edu.co', password: 'x' } }), 401)
  })

  test('login sin datos -> 400', async () => {
    esperarError(await api('POST', '/auth/login', { body: {} }), 400, 'VALIDATION_ERROR')
  })

  test('sin token -> 401 y token invalido -> 401', async () => {
    esperarError(await api('GET', '/recursos'), 401, 'UNAUTHORIZED')
    esperarError(await api('GET', '/recursos', { token: 'no.es.un.token' }), 401, 'UNAUTHORIZED')
  })

  test('JSON mal formado -> 400 INVALID_JSON y el servicio sigue vivo', async () => {
    const est = await sesion('estudiante')
    esperarError(await api('POST', '/solicitudes', { token: est.token, raw: '{"tipo": ' }), 400, 'INVALID_JSON')
    assert.equal((await api('GET', '/solicitudes', { token: est.token })).status, 200)
  })

  test('ruta inexistente -> 404 ROUTE_NOT_FOUND con el formato unico', async () => {
    const est = await sesion('estudiante')
    esperarError(await api('GET', '/recursos/REC-001/xyz', { token: est.token }), 404, 'ROUTE_NOT_FOUND')
    esperarError(await api('GET', '/no-existe', { token: est.token }), 404)
  })

  test('un usuario normal no puede indexar en el buscador -> 403 SERVICE_ONLY', async () => {
    const est = await sesion('estudiante')
    esperarError(
      await api('PUT', '/buscar/documento', { token: est.token, body: { tipo: 'recurso', entidadId: 'X', titulo: 'x' } }),
      403,
      'SERVICE_ONLY',
    )
  })
})
