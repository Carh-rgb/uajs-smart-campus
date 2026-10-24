// Pruebas de API: notificaciones (crear, consultar, marcar como leidas).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError } from './helpers.js'

describe('Notificaciones', () => {
  let est, doc, adm, admin
  const creadas = []

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
    admin = await sesion('admin')
  })

  after(async () => {
    for (const { id, token } of creadas) await api('DELETE', `/notificaciones/${id}`, { token })
  })

  async function crear(body, quien = est) {
    const r = await api('POST', '/notificaciones', { token: quien.token, body })
    if (r.status === 201) creadas.push({ id: r.data.id, token: admin.token })
    return r
  }

  test('crear notificacion propia -> 201, no leida, titulo por defecto = categoria', async () => {
    const r = await crear({ categoria: 'Reservas', mensaje: 'Notificacion de la suite de pruebas.' })
    assert.equal(r.status, 201)
    assert.equal(r.data.leida, false)
    assert.equal(r.data.titulo, 'Reservas')
    assert.equal(r.data.usuarioId, est.usuario.id)
  })

  test('crear con entidad relacionada y titulo propio', async () => {
    const r = await crear({ categoria: 'Solicitudes', titulo: 'Cambio de estado', mensaje: 'Tu solicitud cambio.', entidad: 'solicitud', entidadId: 'SOL-0231' })
    assert.equal(r.status, 201)
    assert.equal(r.data.titulo, 'Cambio de estado')
    assert.equal(r.data.entidad, 'solicitud')
    assert.equal(r.data.entidadId, 'SOL-0231')
  })

  test('validaciones: mensaje y categoria obligatorios, longitud maxima, destinatario invalido', async () => {
    const sinMensaje = await crear({ categoria: 'Reservas' })
    esperarError(sinMensaje, 400, 'VALIDACION')
    assert.ok(sinMensaje.data.detalles.some((d) => d.campo === 'mensaje'))
    esperarError(await crear({ mensaje: 'sin categoria' }), 400, 'VALIDACION')
    esperarError(await crear({ categoria: 'Reservas', mensaje: 'x'.repeat(300) }), 400, 'VALIDACION')
    esperarError(await crear({ categoria: 'Reservas', mensaje: 'destino malo', usuarioId: 'abc' }), 400, 'VALIDACION')
  })

  test('un estudiante no notifica a otros (403); un docente si, pero el destinatario debe existir', async () => {
    esperarError(await crear({ categoria: 'Reservas', mensaje: 'colado', usuarioId: doc.usuario.id }, est), 403)
    esperarError(await crear({ categoria: 'Reservas', mensaje: 'a nadie', usuarioId: 999999 }, doc), 400, 'USUARIO_INEXISTENTE')

    const r = await crear({ categoria: 'Institucional', mensaje: 'Aviso del docente al estudiante.', usuarioId: est.usuario.id }, doc)
    assert.equal(r.status, 201)
    assert.equal(r.data.usuarioId, est.usuario.id)
    const mias = await api('GET', '/notificaciones', { token: est.token })
    assert.ok(mias.data.some((n) => n.id === r.data.id))
  })

  test('marcar como leida es persistente e idempotente; leida:false la revierte', async () => {
    const r = await crear({ categoria: 'Reservas', mensaje: 'Para marcar como leida.' })
    const url = `/notificaciones/${r.data.id}/leida`
    assert.equal((await api('PATCH', url, { token: est.token })).data.leida, true)
    assert.equal((await api('PATCH', url, { token: est.token })).data.leida, true, 'idempotente')
    assert.equal((await api('GET', `/notificaciones/${r.data.id}`, { token: est.token })).data.leida, true, 'persistido')
    assert.equal((await api('PATCH', url, { token: est.token, body: { leida: false } })).data.leida, false)
  })

  test('marcar todas como leidas y filtrar por leida=false', async () => {
    await crear({ categoria: 'Reservas', mensaje: 'Pendiente de leer 1.' })
    await crear({ categoria: 'Reservas', mensaje: 'Pendiente de leer 2.' })
    const r = await api('PATCH', '/notificaciones/marcar-todas', { token: est.token })
    assert.equal(r.status, 200)
    assert.ok(r.data.actualizadas >= 2)
    const noLeidas = await api('GET', '/notificaciones?leida=false', { token: est.token })
    assert.equal(noLeidas.data.length, 0)
  })

  test('consultar: 404 inexistente, 404 si es de otro usuario, 400 id invalido', async () => {
    const r = await crear({ categoria: 'Reservas', mensaje: 'Privada del estudiante.' })
    esperarError(await api('GET', '/notificaciones/999999', { token: est.token }), 404, 'NO_ENCONTRADO')
    esperarError(await api('GET', `/notificaciones/${r.data.id}`, { token: doc.token }), 404)
    esperarError(await api('GET', '/notificaciones/abc', { token: est.token }), 400, 'VALIDACION')
    esperarError(await api('PATCH', `/notificaciones/${r.data.id}/leida`, { token: doc.token }), 404)
  })

  test('PUT: solo el Administrador corrige el contenido', async () => {
    const r = await crear({ categoria: 'Reservas', mensaje: 'Texto original.' })
    const cuerpo = { categoria: 'Eventos', titulo: 'Corregida', mensaje: 'Texto corregido.' }
    esperarError(await api('PUT', `/notificaciones/${r.data.id}`, { token: est.token, body: cuerpo }), 403)
    esperarError(await api('PUT', `/notificaciones/${r.data.id}`, { token: adm.token, body: cuerpo }), 403)
    const ok = await api('PUT', `/notificaciones/${r.data.id}`, { token: admin.token, body: cuerpo })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.mensaje, 'Texto corregido.')
    esperarError(await api('PUT', `/notificaciones/${r.data.id}`, { token: admin.token, body: { categoria: 'x' } }), 400, 'VALIDACION')
  })

  test('eliminar la propia notificacion -> 204 y luego 404', async () => {
    const r = await api('POST', '/notificaciones', { token: est.token, body: { categoria: 'Reservas', mensaje: 'Se va a borrar.' } })
    assert.equal((await api('DELETE', `/notificaciones/${r.data.id}`, { token: est.token })).status, 204)
    esperarError(await api('GET', `/notificaciones/${r.data.id}`, { token: est.token }), 404)
  })
})
