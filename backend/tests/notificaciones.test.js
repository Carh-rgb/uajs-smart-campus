// Pruebas de API: notificaciones.
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo } from './helpers.js'

describe('Notificaciones', () => {
  let est, doc, adm

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
  })

  const nueva = (extra = {}) => ({ categoria: 'Institucional', titulo: `Aviso ${sufijo()}`, mensaje: 'Mensaje de la suite automatica', ...extra })

  test('crear una notificacion propia -> 201, leida=false; aparece en mi listado con titulo', async () => {
    const r = await api('POST', '/notificaciones', { token: est.token, body: nueva() })
    assert.equal(r.status, 201)
    assert.equal(r.data.leida, false)
    assert.equal(r.data.usuarioId, est.usuario.id)
    const lista = await api('GET', '/notificaciones', { token: est.token })
    assert.ok(lista.data.some((n) => n.id === r.data.id && n.titulo === r.data.titulo))
    await api('DELETE', `/notificaciones/${r.data.id}`, { token: est.token })
  })

  test('validaciones: sin titulo, categoria invalida o sin mensaje -> 400', async () => {
    esperarError(await api('POST', '/notificaciones', { token: est.token, body: nueva({ titulo: '' }) }), 400, 'VALIDATION_ERROR')
    esperarError(await api('POST', '/notificaciones', { token: est.token, body: nueva({ categoria: 'Chisme' }) }), 400, 'VALIDATION_ERROR')
    esperarError(await api('POST', '/notificaciones', { token: est.token, body: nueva({ mensaje: '' }) }), 400, 'VALIDATION_ERROR')
  })

  test('consultar por ID: la propia -> 200; la de otro usuario -> 404; marcar como leida persiste', async () => {
    const r = await api('POST', '/notificaciones', { token: est.token, body: nueva() })
    assert.equal((await api('GET', `/notificaciones/${r.data.id}`, { token: est.token })).status, 200)
    esperarError(await api('GET', `/notificaciones/${r.data.id}`, { token: doc.token }), 404, 'NOTIFICATION_NOT_FOUND')
    const leida = await api('PATCH', `/notificaciones/${r.data.id}/leida`, { token: est.token })
    assert.equal(leida.data.leida, true)
    assert.equal((await api('GET', `/notificaciones/${r.data.id}`, { token: est.token })).data.leida, true)
    assert.equal((await api('DELETE', `/notificaciones/${r.data.id}`, { token: est.token })).status, 204)
  })

  test('un estudiante no puede notificar a otro usuario -> 403; el personal si', async () => {
    esperarError(await api('POST', '/notificaciones', { token: est.token, body: nueva({ usuarioId: doc.usuario.id }) }), 403)
    const r = await api('POST', '/notificaciones', { token: adm.token, body: nueva({ usuarioId: est.usuario.id }) })
    assert.equal(r.status, 201)
    assert.equal(r.data.usuarioId, est.usuario.id)
    await api('DELETE', `/notificaciones/${r.data.id}`, { token: est.token })
  })

  test('el endpoint interno rechaza el token de un usuario -> 403 SERVICE_ONLY', async () => {
    esperarError(await api('POST', '/notificaciones/interna', { token: est.token, body: { usuarioId: est.usuario.id, ...nueva() } }), 403, 'SERVICE_ONLY')
  })

  test('las acciones del flujo generan notificaciones sin intervencion del frontend (solicitud radicada)', async () => {
    const antes = (await api('GET', '/notificaciones', { token: est.token })).data.length
    const s = await api('POST', '/solicitudes', {
      token: est.token,
      body: { tipo: 'Otro', dependencia: 'Registro Académico', descripcion: `Genera notificacion ${sufijo()}` },
    })
    assert.equal(s.status, 201)
    // la notificacion se crea sin bloquear la respuesta: se espera un instante
    let despues = antes
    for (let i = 0; i < 10 && despues === antes; i++) {
      await new Promise((r) => setTimeout(r, 200))
      despues = (await api('GET', '/notificaciones', { token: est.token })).data.length
    }
    assert.ok(despues > antes, 'debe existir una notificacion nueva')
    await api('DELETE', `/solicitudes/${s.data.id}`, { token: adm.token })
  })

  // Regla pendiente de mezclarse: https://github.com/Carh-rgb/uajs-smart-campus/pull/15
  test('crear una notificacion para un destinatario inexistente -> 400', { todo: 'Pendiente del PR #15' }, async () => {
    esperarError(await api('POST', '/notificaciones', { token: adm.token, body: nueva({ usuarioId: 999999 }) }), 400, 'RECIPIENT_NOT_FOUND')
  })
})
