// Pruebas de API: recursos (matriz T01-T07 de la guia 9.3).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo } from './helpers.js'

describe('Recursos', () => {
  let est, adm
  const creados = []

  before(async () => {
    est = await sesion('estudiante')
    adm = await sesion('administrativo')
  })

  after(async () => {
    for (const codigo of creados) await api('DELETE', `/recursos/${codigo}`, { token: adm.token })
  })

  const nuevo = (extra = {}) => ({
    nombre: `Mesa de prueba ${sufijo()}`,
    tipo: 'Mobiliario',
    ubicacion: 'Bodega de pruebas',
    descripcion: 'Recurso creado por la suite automatica',
    ...extra,
  })

  async function crear(extra) {
    const r = await api('POST', '/recursos', { token: adm.token, body: nuevo(extra) })
    if (r.status === 201) creados.push(r.data.codigo)
    return r
  }

  test('T01 listar recursos -> 200 y coleccion JSON', async () => {
    const r = await api('GET', '/recursos', { token: est.token })
    assert.equal(r.status, 200)
    assert.ok(Array.isArray(r.data))
    assert.ok(r.data.length > 0)
    assert.ok(['codigo', 'nombre', 'tipo', 'ubicacion', 'estado'].every((k) => k in r.data[0]))
  })

  test('T02 crear recurso valido -> 201, estado Disponible y registro almacenado', async () => {
    const r = await crear()
    assert.equal(r.status, 201)
    assert.match(r.data.codigo, /^REC-\d{3,5}$/)
    assert.equal(r.data.estado, 'Disponible')
    const lista = await api('GET', '/recursos', { token: est.token })
    assert.ok(lista.data.some((x) => x.codigo === r.data.codigo), 'debe aparecer en el listado')
    const hist = await api('GET', `/recursos/${r.data.codigo}/historial`, { token: adm.token })
    assert.equal(hist.data[0].estado, 'Disponible')
  })

  test('T03 crear recurso incompleto o invalido -> 400 y no se almacena', async () => {
    const antes = (await api('GET', '/recursos', { token: adm.token })).data.length
    esperarError(await crear({ nombre: '' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ ubicacion: undefined }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ tipo: 'Nave espacial' }), 400, 'VALIDATION_ERROR')
    const despues = (await api('GET', '/recursos', { token: adm.token })).data.length
    assert.equal(despues, antes)
  })

  test('un estudiante no puede crear, editar ni eliminar recursos -> 403', async () => {
    esperarError(await api('POST', '/recursos', { token: est.token, body: nuevo() }), 403, 'FORBIDDEN')
    const a = await crear()
    esperarError(await api('PATCH', `/recursos/${a.data.codigo}`, { token: est.token, body: nuevo() }), 403)
    esperarError(await api('DELETE', `/recursos/${a.data.codigo}`, { token: est.token }), 403)
  })

  test('T04 consultar ID existente -> 200 con los datos correctos', async () => {
    const a = await crear()
    const r = await api('GET', `/recursos/${a.data.codigo}`, { token: est.token })
    assert.equal(r.status, 200)
    assert.equal(r.data.nombre, a.data.nombre)
    assert.equal(r.data.ubicacion, 'Bodega de pruebas')
  })

  test('T05 consultar ID inexistente -> 404 controlado', async () => {
    esperarError(await api('GET', '/recursos/REC-99999', { token: est.token }), 404, 'RESOURCE_NOT_FOUND')
  })

  test('T06 actualizar ubicacion -> 200 y cambio persistido', async () => {
    const a = await crear()
    const patch = await api('PATCH', `/recursos/${a.data.codigo}`, {
      token: adm.token,
      body: { nombre: a.data.nombre, tipo: 'Mobiliario', ubicacion: 'Sala S01' },
    })
    assert.equal(patch.status, 200)
    const leido = await api('GET', `/recursos/${a.data.codigo}`, { token: est.token })
    assert.equal(leido.data.ubicacion, 'Sala S01')
  })

  test('cambiar el estado: valido -> 200 con historial; invalido -> 400 y el servicio sigue vivo', async () => {
    const a = await crear()
    const ok = await api('PATCH', `/recursos/${a.data.codigo}/estado`, { token: adm.token, body: { estado: 'En mantenimiento' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.estado, 'En mantenimiento')
    esperarError(await api('PATCH', `/recursos/${a.data.codigo}/estado`, { token: adm.token, body: { estado: 'Roto' } }), 400, 'VALIDATION_ERROR')
    const hist = await api('GET', `/recursos/${a.data.codigo}/historial`, { token: adm.token })
    assert.deepEqual(hist.data.map((h) => h.estado), ['Disponible', 'En mantenimiento'])
    assert.equal((await api('GET', '/recursos', { token: est.token })).status, 200)
  })

  test('T07 eliminar recurso -> 204 y luego 404', async () => {
    const a = await crear()
    const del = await api('DELETE', `/recursos/${a.data.codigo}`, { token: adm.token })
    assert.equal(del.status, 204)
    esperarError(await api('GET', `/recursos/${a.data.codigo}`, { token: adm.token }), 404, 'RESOURCE_NOT_FOUND')
  })
})
