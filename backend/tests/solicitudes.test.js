// Pruebas de API: solicitudes (T08 y T09) y PQRS.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo } from './helpers.js'

describe('Solicitudes', () => {
  let est, doc, adm
  const creadas = []

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
  })

  after(async () => {
    for (const id of creadas) await api('DELETE', `/solicitudes/${id}`, { token: adm.token })
  })

  const nueva = (extra = {}) => ({
    tipo: 'Certificado académico',
    dependencia: 'Registro Académico',
    descripcion: `Solicitud de la suite automatica ${sufijo()}`,
    ...extra,
  })

  async function crear(extra, token = est.token) {
    const r = await api('POST', '/solicitudes', { token, body: nueva(extra) })
    if (r.status === 201) creadas.push(r.data.id)
    return r
  }

  const cambiar = (id, body) => api('PATCH', `/solicitudes/${id}/responder`, { token: adm.token, body })

  test('T08 crear solicitud -> 201, estado Registrada, asignada a nadie y con historial', async () => {
    const r = await crear()
    assert.equal(r.status, 201)
    assert.match(r.data.id, /^SOL-\d{4,}$/)
    assert.equal(r.data.estado, 'Registrada')
    assert.equal(r.data.asignadoA, 'Sin asignar')
    const det = await api('GET', `/solicitudes/${r.data.id}`, { token: est.token })
    assert.equal(det.status, 200)
    assert.deepEqual(det.data.historial.map((h) => h.estado), ['Registrada'])
  })

  test('crear con datos invalidos -> 400 y el rol Administrativo no radica -> 403', async () => {
    esperarError(await crear({ tipo: 'Inventado' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ dependencia: 'Nadie' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ prioridad: 'Urgentisima' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ descripcion: '   ' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({}, adm.token), 403)
  })

  test('T09 transicion invalida Registrada -> Cerrada -> 409 y el estado no cambia', async () => {
    const s = await crear()
    esperarError(await cambiar(s.data.id, { nuevoEstado: 'Cerrada' }), 409, 'INVALID_TRANSITION')
    const det = await api('GET', `/solicitudes/${s.data.id}`, { token: est.token })
    assert.equal(det.data.estado, 'Registrada')
  })

  test('ciclo completo lineal con historial y retroceso rechazado', async () => {
    const s = await crear()
    assert.equal((await cambiar(s.data.id, { nuevoEstado: 'En revisión' })).status, 200)
    esperarError(await cambiar(s.data.id, { nuevoEstado: 'Asignada' }), 400, 'VALIDATION_ERROR') // falta el responsable
    const asignada = await cambiar(s.data.id, { nuevoEstado: 'Asignada', asignadoA: 'Laura Pérez' })
    assert.equal(asignada.status, 200)
    assert.equal(asignada.data.asignadoA, 'Laura Pérez')
    esperarError(await cambiar(s.data.id, { nuevoEstado: 'Registrada' }), 409, 'INVALID_TRANSITION')
    for (const e of ['En proceso', 'Resuelta', 'Cerrada']) assert.equal((await cambiar(s.data.id, { nuevoEstado: e })).status, 200)
    esperarError(await cambiar(s.data.id, { nuevoEstado: 'En proceso' }), 409, 'INVALID_TRANSITION')
    const det = await api('GET', `/solicitudes/${s.data.id}`, { token: est.token })
    assert.deepEqual(det.data.historial.map((h) => h.estado), ['Registrada', 'En revisión', 'Asignada', 'En proceso', 'Resuelta', 'Cerrada'])
  })

  test('estado inexistente -> 400; solo el personal cambia el estado -> 403', async () => {
    const s = await crear()
    esperarError(await cambiar(s.data.id, { nuevoEstado: 'Volando' }), 400, 'VALIDATION_ERROR')
    esperarError(await api('PATCH', `/solicitudes/${s.data.id}/responder`, { token: est.token, body: { nuevoEstado: 'En revisión' } }), 403)
  })

  test('cada usuario solo ve sus solicitudes: otro usuario -> 403; el personal ve todas; inexistente -> 404', async () => {
    const s = await crear()
    esperarError(await api('GET', `/solicitudes/${s.data.id}`, { token: doc.token }), 403)
    assert.equal((await api('GET', `/solicitudes/${s.data.id}`, { token: adm.token })).status, 200)
    const propias = await api('GET', '/solicitudes', { token: est.token })
    assert.ok(propias.data.every((x) => x.solicitanteId === est.usuario.id))
    esperarError(await api('GET', '/solicitudes/SOL-9999', { token: est.token }), 404, 'REQUEST_NOT_FOUND')
  })

  test('eliminar: el dueño solo en estado Registrada; luego 404', async () => {
    const s = await crear()
    assert.equal((await api('DELETE', `/solicitudes/${s.data.id}`, { token: est.token })).status, 204)
    esperarError(await api('GET', `/solicitudes/${s.data.id}`, { token: est.token }), 404)
    const otra = await crear()
    await cambiar(otra.data.id, { nuevoEstado: 'En revisión' })
    esperarError(await api('DELETE', `/solicitudes/${otra.data.id}`, { token: est.token }), 403)
  })
})

describe('PQRS', () => {
  let est, adm
  before(async () => {
    est = await sesion('estudiante')
    adm = await sesion('administrativo')
  })

  const nueva = () => ({ tipo: 'Queja', dirigidoA: 'Registro Académico', asunto: `Prueba ${sufijo()}`, descripcion: 'PQRS de la suite automatica' })

  test('radicar una PQRS -> 201 Registrada; tipo invalido -> 400', async () => {
    const r = await api('POST', '/pqrs', { token: est.token, body: nueva() })
    assert.equal(r.status, 201)
    assert.equal(r.data.estado, 'Registrada')
    esperarError(await api('POST', '/pqrs', { token: est.token, body: { ...nueva(), tipo: 'Chisme' } }), 400, 'VALIDATION_ERROR')
  })

  test('asignar un responsable real pasa la PQRS a En gestion y responder la resuelve', async () => {
    const p = await api('POST', '/pqrs', { token: est.token, body: nueva() })
    const asignada = await api('PATCH', `/pqrs/${p.data.id}/asignar`, { token: adm.token, body: { asignadoA: 'Laura Pérez' } })
    assert.equal(asignada.status, 200)
    assert.equal(asignada.data.estado, 'En gestión')
    const respondida = await api('PATCH', `/pqrs/${p.data.id}/responder`, { token: adm.token, body: { respuesta: 'Atendida.' } })
    assert.equal(respondida.status, 200)
    assert.equal(respondida.data.estado, 'Resuelta')
    const hist = await api('GET', `/pqrs/${p.data.id}/historial`, { token: est.token })
    assert.deepEqual(hist.data.map((h) => h.estado), ['Registrada', 'En gestión', 'Resuelta'])
  })

  test('un estudiante no puede asignar ni responder PQRS -> 403', async () => {
    const p = await api('POST', '/pqrs', { token: est.token, body: nueva() })
    esperarError(await api('PATCH', `/pqrs/${p.data.id}/asignar`, { token: est.token, body: { asignadoA: 'Laura Pérez' } }), 403)
    esperarError(await api('PATCH', `/pqrs/${p.data.id}/responder`, { token: est.token, body: { respuesta: 'x' } }), 403)
  })

  // Reglas pendientes de mezclarse: https://github.com/Carh-rgb/uajs-smart-campus/pull/20
  test('asignar a un responsable inexistente -> 400', { todo: 'Pendiente del PR #20' }, async () => {
    const p = await api('POST', '/pqrs', { token: est.token, body: nueva() })
    esperarError(await api('PATCH', `/pqrs/${p.data.id}/asignar`, { token: adm.token, body: { asignadoA: 'Persona Inventada' } }), 400, 'ASSIGNEE_NOT_FOUND')
  })

  test('responder sin texto de respuesta -> 400', { todo: 'Pendiente del PR #20' }, async () => {
    const p = await api('POST', '/pqrs', { token: est.token, body: nueva() })
    esperarError(await api('PATCH', `/pqrs/${p.data.id}/responder`, { token: adm.token, body: {} }), 400, 'VALIDATION_ERROR')
  })
})
