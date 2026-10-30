// Pruebas de API: reservas (T10 y T11) y reglas de negocio.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, fechaFutura } from './helpers.js'

describe('Reservas', () => {
  let est, doc, adm, espacio, equipo
  const creadas = []

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
    const cat = (await api('GET', '/reservas/catalogo', { token: est.token })).data
    espacio = cat.pabellones[0].salones[0].nombre
    equipo = cat.equipos[0]?.nombre
  })

  after(async () => {
    for (const id of creadas) await api('DELETE', `/reservas/${id}`, { token: adm.token })
  })

  const cuerpo = (extra = {}) => ({
    tipoEspacio: 'espacio',
    espacio,
    fecha: fechaFutura(),
    horaInicio: '10:00',
    horaFin: '11:00',
    motivo: 'Reserva de la suite automatica',
    ...extra,
  })

  async function reservar(extra, token = est.token) {
    const r = await api('POST', '/reservas', { token, body: cuerpo(extra) })
    if (r.status === 201) creadas.push(r.data.id)
    return r
  }

  test('T10 crear reserva valida -> 201, estado Pendiente y con historial', async () => {
    const r = await reservar()
    assert.equal(r.status, 201)
    assert.match(r.data.id, /^RES-\d{4,}$/)
    assert.equal(r.data.estado, 'Pendiente')
    const hist = await api('GET', `/reservas/${r.data.id}/historial`, { token: est.token })
    assert.deepEqual(hist.data.map((h) => h.estado), ['Pendiente'])
  })

  test('T11 reserva solapada -> 409 y no se crea la reserva duplicada', async () => {
    const fecha = fechaFutura()
    const a = await reservar({ fecha })
    assert.equal(a.status, 201)
    const antes = (await api('GET', '/reservas', { token: adm.token })).data.length
    for (const [i, f] of [['10:30', '11:30'], ['09:00', '10:30'], ['10:15', '10:45'], ['09:00', '12:00']]) {
      esperarError(await reservar({ fecha, horaInicio: i, horaFin: f }, doc.token), 409, 'RESERVATION_CONFLICT')
    }
    const despues = (await api('GET', '/reservas', { token: adm.token })).data.length
    assert.equal(despues, antes)
  })

  test('franjas contiguas y otro espacio en el mismo horario si se permiten', async () => {
    const fecha = fechaFutura()
    assert.equal((await reservar({ fecha })).status, 201)
    assert.equal((await reservar({ fecha, horaInicio: '11:00', horaFin: '12:00' })).status, 201)
    assert.equal((await reservar({ fecha, horaInicio: '09:00', horaFin: '10:00' })).status, 201)
    const otro = (await api('GET', '/reservas/catalogo', { token: est.token })).data.pabellones[0].salones[1].nombre
    assert.equal((await reservar({ fecha, espacio: otro })).status, 201)
  })

  test('datos invalidos -> 400: fin antes del inicio, fecha pasada, formato y espacio inexistente', async () => {
    esperarError(await reservar({ horaInicio: '11:00', horaFin: '10:00' }), 400, 'VALIDATION_ERROR')
    esperarError(await reservar({ fecha: '2020-01-01' }), 400, 'VALIDATION_ERROR')
    esperarError(await reservar({ fecha: '2031-02-31x' }), 400, 'VALIDATION_ERROR')
    esperarError(await reservar({ horaInicio: '25:00' }), 400, 'VALIDATION_ERROR')
    esperarError(await reservar({ motivo: '' }), 400, 'VALIDATION_ERROR')
    esperarError(await reservar({ espacio: 'Salon que no existe' }), 400, 'SPACE_NOT_FOUND')
  })

  test('reservar un equipo consulta a recursos-service y se crea Pendiente', { skip: !process.env.CON_EQUIPOS && 'Requiere recursos-service con equipos disponibles (CON_EQUIPOS=1)' }, async () => {
    const r = await reservar({ tipoEspacio: 'equipo', espacio: equipo })
    assert.equal(r.status, 201)
    assert.equal(r.data.tipoEspacio, 'equipo')
  })

  test('modificar una reserva Pendiente: franja libre -> 200; franja ocupada -> 409', async () => {
    const fecha = fechaFutura()
    const a = await reservar({ fecha })
    const b = await reservar({ fecha, horaInicio: '14:00', horaFin: '15:00' })
    esperarError(await api('PATCH', `/reservas/${b.data.id}`, { token: est.token, body: { horaInicio: '10:30', horaFin: '11:30' } }), 409, 'RESERVATION_CONFLICT')
    const ok = await api('PATCH', `/reservas/${b.data.id}`, { token: est.token, body: { horaInicio: '16:00', horaFin: '17:00' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.horaInicio, '16:00')
    assert.ok(a.data.id)
  })

  test('transiciones de estado: solo el personal; Confirmada no vuelve a Pendiente; Cancelada es final', async () => {
    const r = await reservar()
    esperarError(await api('PATCH', `/reservas/${r.data.id}/estado`, { token: est.token, body: { estado: 'Confirmada' } }), 403)
    esperarError(await api('PATCH', `/reservas/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Inventado' } }), 400, 'VALIDATION_ERROR')
    assert.equal((await api('PATCH', `/reservas/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Confirmada' } })).status, 200)
    esperarError(await api('PATCH', `/reservas/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Pendiente' } }), 409, 'INVALID_TRANSITION')
    assert.equal((await api('PATCH', `/reservas/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Cancelada' } })).status, 200)
    esperarError(await api('PATCH', `/reservas/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Confirmada' } }), 409, 'INVALID_TRANSITION')
    esperarError(await api('PATCH', `/reservas/${r.data.id}`, { token: est.token, body: { motivo: 'x' } }), 409, 'INVALID_STATE')
  })

  test('cada usuario solo ve sus reservas: otro usuario -> 403; inexistente -> 404; eliminar la propia Pendiente -> 204', async () => {
    const r = await reservar()
    esperarError(await api('GET', `/reservas/${r.data.id}`, { token: doc.token }), 403)
    assert.equal((await api('GET', `/reservas/${r.data.id}`, { token: adm.token })).status, 200)
    esperarError(await api('GET', '/reservas/RES-9999', { token: est.token }), 404, 'RESERVATION_NOT_FOUND')
    assert.equal((await api('DELETE', `/reservas/${r.data.id}`, { token: est.token })).status, 204)
  })

  // Reglas incorporadas por el PR #16
  test('5 peticiones simultaneas al mismo horario crean una sola reserva', async () => {
    const fecha = fechaFutura()
    const rs = await Promise.all(Array.from({ length: 5 }, () => reservar({ fecha })))
    assert.equal(rs.filter((x) => x.status === 201).length, 1)
  })
})
