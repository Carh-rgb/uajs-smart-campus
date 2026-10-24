// Pruebas de API: solicitudes y PQRS (matriz T08, T09 y validaciones).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError } from './helpers.js'

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
    prioridad: 'Alta',
    descripcion: 'Solicitud creada por la suite de pruebas automaticas.',
    ...extra,
  })

  async function crearSolicitud() {
    const r = await api('POST', '/solicitudes', { token: est.token, body: nueva() })
    assert.equal(r.status, 201)
    creadas.push(r.data.id)
    return r.data
  }

  test('T08 crear solicitud valida -> 201 con estado inicial Registrada', async () => {
    const s = await crearSolicitud()
    assert.match(s.id, /^SOL-\d{4}$/)
    assert.equal(s.estado, 'Registrada')
    assert.equal(s.asignadoA, 'Sin asignar')
    const detalle = await api('GET', `/solicitudes/${s.id}`, { token: est.token })
    assert.equal(detalle.status, 200)
    assert.equal(detalle.data.historial.length, 1)
    assert.equal(detalle.data.historial[0].estado, 'Registrada')
  })

  test('crear solicitud incompleta o invalida -> 400 VALIDACION con detalles por campo', async () => {
    const sinDescripcion = await api('POST', '/solicitudes', { token: est.token, body: nueva({ descripcion: '' }) })
    esperarError(sinDescripcion, 400, 'VALIDACION')
    assert.ok(sinDescripcion.data.detalles.some((d) => d.campo === 'descripcion'))

    esperarError(await api('POST', '/solicitudes', { token: est.token, body: nueva({ descripcion: 'corta' }) }), 400, 'VALIDACION')
    esperarError(await api('POST', '/solicitudes', { token: est.token, body: nueva({ prioridad: 'Urgentisima' }) }), 400, 'VALIDACION')
    esperarError(await api('POST', '/solicitudes', { token: est.token, body: nueva({ tipo: undefined }) }), 400, 'VALIDACION')
  })

  test('JSON malformado -> 400 JSON_INVALIDO (el servicio no se cae)', async () => {
    esperarError(await api('POST', '/solicitudes', { token: est.token, raw: '{"tipo": ' }), 400, 'JSON_INVALIDO')
    const salud = await api('GET', '/solicitudes', { token: est.token })
    assert.equal(salud.status, 200)
  })

  test('consultar solicitud inexistente -> 404 controlado', async () => {
    esperarError(await api('GET', '/solicitudes/SOL-9999', { token: est.token }), 404, 'NO_ENCONTRADO')
  })

  test('sin token -> 401; otro usuario no ve la solicitud -> 403', async () => {
    const s = await crearSolicitud()
    esperarError(await api('GET', `/solicitudes/${s.id}`), 401)
    esperarError(await api('GET', `/solicitudes/${s.id}`, { token: doc.token }), 403, 'PROHIBIDO')
  })

  test('T09 transicion invalida Registrada -> Cerrada -> 409 y el estado no cambia', async () => {
    const s = await crearSolicitud()
    const r = await api('PATCH', `/solicitudes/${s.id}/estado`, { token: adm.token, body: { estado: 'Cerrada' } })
    esperarError(r, 409, 'TRANSICION_INVALIDA')
    assert.deepEqual(r.data.detalles[0].permitidas, ['En revisión'])
    const despues = await api('GET', `/solicitudes/${s.id}`, { token: adm.token })
    assert.equal(despues.data.estado, 'Registrada')
  })

  test('estado inexistente -> 400 VALIDACION', async () => {
    const s = await crearSolicitud()
    esperarError(await api('PATCH', `/solicitudes/${s.id}/estado`, { token: adm.token, body: { estado: 'Inventado' } }), 400, 'VALIDACION')
  })

  test('un estudiante no puede cambiar estados -> 403', async () => {
    const s = await crearSolicitud()
    esperarError(await api('PATCH', `/solicitudes/${s.id}/estado`, { token: est.token, body: { estado: 'En revisión' } }), 403)
  })

  test('ciclo completo valido, condiciones de cada paso e historial', async () => {
    const s = await crearSolicitud()
    const cambiar = (body) => api('PATCH', `/solicitudes/${s.id}/responder`, { token: adm.token, body })

    assert.equal((await cambiar({ nuevoEstado: 'En revisión' })).data.estado, 'En revisión')

    const asignada = await cambiar({ nuevoEstado: 'Asignada' })
    assert.equal(asignada.data.estado, 'Asignada')
    assert.notEqual(asignada.data.asignadoA, 'Sin asignar', 'al asignar debe quedar un responsable')

    assert.equal((await cambiar({ nuevoEstado: 'En proceso' })).data.estado, 'En proceso')

    // Resolver exige registrar una solucion.
    esperarError(await cambiar({ nuevoEstado: 'Resuelta' }), 400, 'VALIDACION')
    const resuelta = await cambiar({ nuevoEstado: 'Resuelta', respuesta: 'Se genero el certificado y se envio al correo.' })
    assert.equal(resuelta.data.estado, 'Resuelta')
    assert.equal(resuelta.data.respondidoPor, 'Andrés Gómez')

    assert.equal((await cambiar({ nuevoEstado: 'Cerrada' })).data.estado, 'Cerrada')

    // Cerrada es un estado final.
    esperarError(await cambiar({ nuevoEstado: 'En proceso' }), 409, 'TRANSICION_INVALIDA')

    const detalle = await api('GET', `/solicitudes/${s.id}`, { token: adm.token })
    assert.deepEqual(
      detalle.data.historial.map((h) => h.estado),
      ['Registrada', 'En revisión', 'Asignada', 'En proceso', 'Resuelta', 'Cerrada'],
    )
  })

  test('PUT: el dueño edita mientras esta Registrada; despues -> 403', async () => {
    const s = await crearSolicitud()
    const ok = await api('PUT', `/solicitudes/${s.id}`, {
      token: est.token,
      body: nueva({ prioridad: 'Baja', descripcion: 'Descripcion actualizada por PUT.' }),
    })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.prioridad, 'Baja')
    assert.equal(ok.data.estado, 'Registrada', 'PUT no puede cambiar el estado')

    esperarError(await api('PUT', `/solicitudes/${s.id}`, { token: est.token, body: { tipo: 'x' } }), 400, 'VALIDACION')

    await api('PATCH', `/solicitudes/${s.id}/estado`, { token: adm.token, body: { estado: 'En revisión' } })
    esperarError(await api('PUT', `/solicitudes/${s.id}`, { token: est.token, body: nueva() }), 403)
  })

  test('DELETE: el dueño borra la suya en Registrada (204) y luego da 404', async () => {
    const r = await api('POST', '/solicitudes', { token: est.token, body: nueva() })
    const res = await api('DELETE', `/solicitudes/${r.data.id}`, { token: est.token })
    assert.equal(res.status, 204)
    esperarError(await api('GET', `/solicitudes/${r.data.id}`, { token: est.token }), 404)
  })

  test('listar devuelve solo las propias para un estudiante y filtra por estado', async () => {
    const s = await crearSolicitud()
    const propias = await api('GET', '/solicitudes', { token: est.token })
    assert.equal(propias.status, 200)
    assert.ok(propias.data.every((x) => x.solicitanteNombre === 'Camilo Ramírez'))
    const filtradas = await api('GET', '/solicitudes?estado=Registrada', { token: est.token })
    assert.ok(filtradas.data.length > 0 && filtradas.data.every((x) => x.estado === 'Registrada'))
    assert.ok(filtradas.data.some((x) => x.id === s.id))
  })
})

describe('PQRS', () => {
  let est, doc, adm
  const creadas = []

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
  })
  after(async () => {
    for (const id of creadas) await api('DELETE', `/pqrs/${id}`, { token: adm.token })
  })

  const nueva = (extra = {}) => ({
    tipo: 'Sugerencia',
    dirigidoA: 'Bienestar Universitario',
    asunto: 'Prueba automatica de PQRS',
    descripcion: 'Descripcion de la PQRS creada por la suite de pruebas.',
    ...extra,
  })

  async function crearPqrs() {
    const r = await api('POST', '/pqrs', { token: est.token, body: nueva() })
    assert.equal(r.status, 201)
    creadas.push(r.data.id)
    return r.data
  }

  test('crear PQRS valida -> 201 Registrada; tipo invalido o faltante -> 400', async () => {
    const p = await crearPqrs()
    assert.match(p.id, /^PQRS-\d{4}$/)
    assert.equal(p.estado, 'Registrada')
    esperarError(await api('POST', '/pqrs', { token: est.token, body: nueva({ tipo: 'Chisme' }) }), 400, 'VALIDACION')
    esperarError(await api('POST', '/pqrs', { token: est.token, body: nueva({ asunto: '' }) }), 400, 'VALIDACION')
  })

  test('asignar a un responsable inexistente -> 400; a uno real -> 200 y pasa a En gestión', async () => {
    const p = await crearPqrs()
    esperarError(await api('PATCH', `/pqrs/${p.id}/asignar`, { token: adm.token, body: { asignadoA: 'Persona Que No Existe' } }), 400, 'VALIDACION')
    const ok = await api('PATCH', `/pqrs/${p.id}/asignar`, { token: adm.token, body: { asignadoA: 'Laura Pérez' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.estado, 'En gestión')
    esperarError(await api('PATCH', `/pqrs/${p.id}/asignar`, { token: est.token, body: { asignadoA: 'Laura Pérez' } }), 403)
  })

  test('responder: exige respuesta; el docente asignado resuelve; Resuelta se puede reabrir', async () => {
    const p = await crearPqrs()
    await api('PATCH', `/pqrs/${p.id}/asignar`, { token: adm.token, body: { asignadoA: 'Laura Pérez' } })

    esperarError(await api('PATCH', `/pqrs/${p.id}/responder`, { token: doc.token, body: {} }), 400, 'VALIDACION')
    esperarError(await api('PATCH', `/pqrs/${p.id}/responder`, { token: est.token, body: { respuesta: 'x' } }), 403)

    const r = await api('PATCH', `/pqrs/${p.id}/responder`, { token: doc.token, body: { respuesta: 'Atendida por la suite de pruebas.' } })
    assert.equal(r.status, 200)
    assert.equal(r.data.estado, 'Resuelta')

    const reabierta = await api('PATCH', `/pqrs/${p.id}/responder`, {
      token: doc.token,
      body: { respuesta: 'Se reabre para ampliar.', estado: 'En gestión' },
    })
    assert.equal(reabierta.data.estado, 'En gestión')
    esperarError(await api('PATCH', `/pqrs/${p.id}/responder`, { token: doc.token, body: { respuesta: 'x', estado: 'Registrada' } }), 409, 'TRANSICION_INVALIDA')
  })

  test('consultar PQRS: detalle con historial, 404 inexistente, 403 ajena', async () => {
    const p = await crearPqrs()
    const d = await api('GET', `/pqrs/${p.id}`, { token: est.token })
    assert.equal(d.status, 200)
    assert.equal(d.data.historial[0].estado, 'Registrada')
    esperarError(await api('GET', '/pqrs/PQRS-0000', { token: est.token }), 404, 'NO_ENCONTRADO')
    esperarError(await api('GET', `/pqrs/${p.id}`, { token: doc.token }), 403)
  })

  test('PUT edita datos propios en Registrada; DELETE elimina (204) y luego 404', async () => {
    const p = await crearPqrs()
    const ok = await api('PUT', `/pqrs/${p.id}`, { token: est.token, body: nueva({ asunto: 'Asunto editado' }) })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.asunto, 'Asunto editado')
    assert.equal((await api('DELETE', `/pqrs/${p.id}`, { token: est.token })).status, 204)
    esperarError(await api('GET', `/pqrs/${p.id}`, { token: adm.token }), 404)
  })
})
