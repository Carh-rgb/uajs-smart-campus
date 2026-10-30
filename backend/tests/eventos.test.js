// Pruebas de API: eventos e inscripciones.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo, fechaFutura } from './helpers.js'

describe('Eventos', () => {
  let est, doc, adm
  const creados = []

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
  })

  after(async () => {
    for (const id of creados) await api('DELETE', `/eventos/${id}`, { token: adm.token })
  })

  const nuevo = (extra = {}) => ({
    titulo: `Evento de prueba ${sufijo()}`,
    fecha: fechaFutura(),
    hora: '09:00',
    horaFin: '11:00',
    lugar: 'Auditorio',
    ponente: 'Ponente de prueba',
    facultad: 'Ingeniería',
    descripcion: 'Evento creado por la suite automatica',
    ...extra,
  })

  async function crear(extra) {
    const r = await api('POST', '/eventos', { token: adm.token, body: nuevo(extra) })
    if (r.status === 201) creados.push(r.data.id)
    return r
  }

  test('crear un evento valido -> 201 con hora de fin; aparece en el listado', async () => {
    const r = await crear({ cupoMaximo: 5 })
    assert.equal(r.status, 201)
    assert.equal(r.data.horaFin, '11:00')
    assert.equal(r.data.estado, 'Activo')
    const lista = await api('GET', '/eventos', { token: est.token })
    assert.ok(lista.data.some((e) => e.id === r.data.id))
  })

  test('validaciones: hora de fin invalida, anterior al inicio, campos faltantes y cupo invalido -> 400', async () => {
    esperarError(await crear({ horaFin: '25:00' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ horaFin: '08:00' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ titulo: '' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ fecha: 'manana' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ cupoMaximo: 0 }), 400, 'VALIDATION_ERROR')
  })

  test('un estudiante no puede crear, editar ni eliminar eventos -> 403', async () => {
    esperarError(await api('POST', '/eventos', { token: est.token, body: nuevo() }), 403)
    const e = await crear()
    esperarError(await api('PATCH', `/eventos/${e.data.id}`, { token: est.token, body: nuevo() }), 403)
    esperarError(await api('DELETE', `/eventos/${e.data.id}`, { token: est.token }), 403)
  })

  test('consultar por ID -> 200; inexistente -> 404', async () => {
    const e = await crear()
    const r = await api('GET', `/eventos/${e.data.id}`, { token: est.token })
    assert.equal(r.status, 200)
    assert.equal(r.data.titulo, e.data.titulo)
    esperarError(await api('GET', '/eventos/99999', { token: est.token }), 404, 'EVENT_NOT_FOUND')
  })

  test('editar con PATCH -> 200 y cambio persistido', async () => {
    const e = await crear()
    const r = await api('PATCH', `/eventos/${e.data.id}`, { token: adm.token, body: nuevo({ titulo: 'Titulo editado', horaFin: '12:00' }) })
    assert.equal(r.status, 200)
    const leido = await api('GET', `/eventos/${e.data.id}`, { token: est.token })
    assert.equal(leido.data.titulo, 'Titulo editado')
    assert.equal(leido.data.horaFin, '12:00')
  })

  test('inscripcion: 201, duplicada 409, cupo lleno 400 y evento no activo 400', async () => {
    const e = await crear({ cupoMaximo: 1 })
    const a = await api('POST', `/eventos/${e.data.id}/inscribir`, { token: est.token })
    assert.equal(a.status, 201)
    esperarError(await api('POST', `/eventos/${e.data.id}/inscribir`, { token: est.token }), 409)
    esperarError(await api('POST', `/eventos/${e.data.id}/inscribir`, { token: doc.token }), 400)
    const inscritos = await api('GET', `/eventos/${e.data.id}/inscritos`, { token: adm.token })
    assert.equal(inscritos.data.length, 1)
    const cancelado = await crear()
    await api('PATCH', `/eventos/${cancelado.data.id}/estado`, { token: adm.token, body: { estado: 'Cancelado' } })
    esperarError(await api('POST', `/eventos/${cancelado.data.id}/inscribir`, { token: est.token }), 400)
    esperarError(await api('POST', '/eventos/99999/inscribir', { token: est.token }), 404, 'EVENT_NOT_FOUND')
  })

  test('cambiar el estado: valido -> 200; invalido -> 400; eliminar -> 204 y luego 404', async () => {
    const e = await crear()
    assert.equal((await api('PATCH', `/eventos/${e.data.id}/estado`, { token: adm.token, body: { estado: 'Inactivo' } })).data.estado, 'Inactivo')
    esperarError(await api('PATCH', `/eventos/${e.data.id}/estado`, { token: adm.token, body: { estado: 'Raro' } }), 400, 'VALIDATION_ERROR')
    // un evento Inactivo no es visible para un estudiante
    esperarError(await api('GET', `/eventos/${e.data.id}`, { token: est.token }), 404, 'EVENT_NOT_FOUND')
    assert.equal((await api('DELETE', `/eventos/${e.data.id}`, { token: adm.token })).status, 204)
    esperarError(await api('GET', `/eventos/${e.data.id}`, { token: adm.token }), 404)
  })

  // Reglas pendientes de mezclarse: https://github.com/Carh-rgb/uajs-smart-campus/pull/17
  test('5 inscripciones simultaneas con cupo 1 dejan un solo inscrito', { todo: 'Pendiente del PR #17' }, async () => {
    const e = await crear({ cupoMaximo: 1 })
    const usuarios = await Promise.all(['estudiante', 'docente'].map((r) => sesion(r)))
    await Promise.all(Array.from({ length: 5 }, (_, i) => api('POST', `/eventos/${e.data.id}/inscribir`, { token: usuarios[i % 2].token })))
    const inscritos = await api('GET', `/eventos/${e.data.id}/inscritos`, { token: adm.token })
    assert.equal(inscritos.data.length, 1)
  })

  test('el cupo no puede bajar por debajo de los inscritos -> 409', { todo: 'Pendiente del PR #17' }, async () => {
    const e = await crear({ cupoMaximo: 5 })
    await api('POST', `/eventos/${e.data.id}/inscribir`, { token: est.token })
    await api('POST', `/eventos/${e.data.id}/inscribir`, { token: doc.token })
    esperarError(await api('PATCH', `/eventos/${e.data.id}`, { token: adm.token, body: nuevo({ cupoMaximo: 1 }) }), 409, 'CAPACITY_BELOW_ENROLLED')
  })
})
