// Pruebas del API Gateway y de los health checks (matriz T15).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { api, esperarError } from './helpers.js'

const RAIZ = (process.env.API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '')

const SERVICIOS = [
  ['usuarios-service', 4001],
  ['solicitudes-service', 4002],
  ['reservas-service', 4003],
  ['recursos-service', 4004],
  ['eventos-service', 4005],
  ['notificaciones-service', 4006],
  ['busqueda-service', 4007],
]

describe('Health checks (T15)', () => {
  for (const [nombre, puerto] of SERVICIOS) {
    test(`${nombre} :${puerto} /health responde ok`, async () => {
      const r = await fetch(`http://localhost:${puerto}/health`)
      assert.equal(r.status, 200)
      assert.deepEqual(await r.json(), { status: 'ok', service: nombre })
    })
  }

  test('gateway /health agrega el estado de los 7 microservicios', async () => {
    const r = await fetch(`${RAIZ}/health`)
    assert.equal(r.status, 200)
    const cuerpo = await r.json()
    assert.equal(cuerpo.status, 'ok')
    assert.equal(cuerpo.microservicios.length, 7)
    assert.ok(cuerpo.microservicios.every((m) => m.ok))
  })
})

describe('API Gateway', () => {
  test('enruta cada prefijo publico al servicio dueño (sin token responde 401 del propio servicio)', async () => {
    for (const ruta of ['/usuarios', '/solicitudes', '/pqrs', '/reservas', '/recursos', '/eventos', '/notificaciones']) {
      esperarError(await api('GET', ruta), 401, 'NO_AUTENTICADO')
    }
  })

  test('ruta /api/* desconocida -> 404 JSON controlado, no HTML', async () => {
    const r = await api('GET', '/no-existe')
    esperarError(r, 404)
  })

  test('ruta inexistente dentro de un servicio -> 404 JSON con codigo RUTA_NO_ENCONTRADA', async () => {
    esperarError(await api('GET', '/recursos/uno/dos/tres'), 404, 'RUTA_NO_ENCONTRADA')
  })

  test('CORS: solo se permite el origen del frontend', async () => {
    const permitido = await fetch(`${RAIZ}/health`, { headers: { Origin: 'http://localhost:5183' } })
    assert.equal(permitido.headers.get('access-control-allow-origin'), 'http://localhost:5183')
    const ajeno = await fetch(`${RAIZ}/health`, { headers: { Origin: 'http://sitio-malicioso.example' } })
    assert.notEqual(ajeno.headers.get('access-control-allow-origin'), 'http://sitio-malicioso.example')
  })
})
