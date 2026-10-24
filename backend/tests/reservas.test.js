// Pruebas de API: reservas (matriz T10, T11 y reglas de PDF 7.5).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError } from './helpers.js'

// Cada ejecucion usa un dia lejano distinto para no chocar con reservas
// de otras corridas ni con los datos de demostracion.
const dia = String(1 + (Math.floor(Date.now() / 1000) % 28)).padStart(2, '0')
const mes = String(1 + (Math.floor(Date.now() / 86400000) % 12)).padStart(2, '0')
const FECHA = `2031-${mes}-${dia}`
const FECHA_2 = `2032-${mes}-${dia}`

describe('Reservas', () => {
  let est, doc, adm
  const creadas = []

  before(async () => {
    est = await sesion('estudiante')
    doc = await sesion('docente')
    adm = await sesion('administrativo')
  })

  after(async () => {
    for (const id of creadas) await api('DELETE', `/reservas/${id}`, { token: adm.token })
  })

  const cuerpo = (extra = {}) => ({
    tipoEspacio: 'espacio',
    espacio: 'Sala S03',
    fecha: FECHA,
    horaInicio: '08:00',
    horaFin: '10:00',
    motivo: 'Reserva creada por la suite de pruebas',
    ...extra,
  })

  async function crear(extra, quien = est) {
    const r = await api('POST', '/reservas', { token: quien.token, body: cuerpo(extra) })
    if (r.status === 201) creadas.push(r.data.id)
    return r
  }

  test('T10 crear reserva valida -> 201, estado Pendiente, con historial', async () => {
    const r = await crear()
    assert.equal(r.status, 201)
    assert.match(r.data.id, /^RES-\d{4}$/)
    assert.equal(r.data.estado, 'Pendiente')
    assert.equal(r.data.solicitanteNombre, 'Camilo Ramírez')
    const detalle = await api('GET', `/reservas/${r.data.id}`, { token: est.token })
    assert.equal(detalle.status, 200)
    assert.deepEqual(detalle.data.historial.map((h) => h.estado), ['Pendiente'])
  })

  test('T11 reserva solapada del mismo espacio -> 409 y no se crea duplicado', async () => {
    const espacio = 'Sala S04'
    const primera = await crear({ espacio, horaInicio: '14:00', horaFin: '16:00' })
    assert.equal(primera.status, 201)

    const antes = (await api('GET', `/reservas?espacio=${encodeURIComponent(espacio)}&fecha=${FECHA}`, { token: adm.token })).data.length
    const choque = await crear({ espacio, horaInicio: '15:00', horaFin: '17:00' }, doc)
    esperarError(choque, 409, 'RESERVA_SOLAPADA')
    assert.equal(choque.data.detalles[0].reserva, primera.data.id)
    const despues = (await api('GET', `/reservas?espacio=${encodeURIComponent(espacio)}&fecha=${FECHA}`, { token: adm.token })).data.length
    assert.equal(despues, antes, 'no debe crearse ninguna reserva nueva')

    // Cualquier forma de cruce se rechaza: contenida, que envuelve, mismo rango.
    esperarError(await crear({ espacio, horaInicio: '14:30', horaFin: '15:00' }, doc), 409, 'RESERVA_SOLAPADA')
    esperarError(await crear({ espacio, horaInicio: '13:00', horaFin: '18:00' }, doc), 409, 'RESERVA_SOLAPADA')
    esperarError(await crear({ espacio, horaInicio: '14:00', horaFin: '16:00' }, doc), 409, 'RESERVA_SOLAPADA')
  })

  test('franjas contiguas, otro espacio u otro dia NO son solapamiento', async () => {
    const espacio = 'Sala S02'
    assert.equal((await crear({ espacio, horaInicio: '08:00', horaFin: '10:00' })).status, 201)
    assert.equal((await crear({ espacio, horaInicio: '10:00', horaFin: '12:00' })).status, 201, 'termina 10:00, empieza 10:00')
    assert.equal((await crear({ espacio, horaInicio: '07:00', horaFin: '08:00' })).status, 201)
    assert.equal((await crear({ espacio: 'Sala S01', horaInicio: '08:00', horaFin: '10:00' })).status, 201, 'otro espacio')
    assert.equal((await crear({ espacio, fecha: FECHA_2 })).status, 201, 'otro dia')
  })

  test('una reserva cancelada libera el horario', async () => {
    const espacio = 'Salón A05'
    const a = await crear({ espacio })
    assert.equal(a.status, 201)
    esperarError(await crear({ espacio }, doc), 409, 'RESERVA_SOLAPADA')
    const cancelada = await api('PATCH', `/reservas/${a.data.id}/cancelar`, { token: est.token })
    assert.equal(cancelada.status, 200)
    assert.equal(cancelada.data.estado, 'Cancelada')
    assert.equal((await crear({ espacio }, doc)).status, 201)
  })

  test('5 peticiones simultaneas al mismo horario: solo una se crea', async () => {
    const espacio = 'Salón B07'
    const resultados = await Promise.all(
      Array.from({ length: 5 }, (_, i) => crear({ espacio, horaInicio: '09:00', horaFin: '11:00', motivo: `Carrera ${i}` })),
    )
    const estados = resultados.map((r) => r.status).sort()
    assert.deepEqual(estados, [201, 409, 409, 409, 409])
  })

  test('validaciones: fecha pasada, rango horario, formato de hora, espacio inexistente, campos faltantes', async () => {
    esperarError(await crear({ fecha: '2020-01-01' }), 400, 'FECHA_INVALIDA')
    esperarError(await crear({ horaInicio: '10:00', horaFin: '09:00' }), 400, 'RANGO_HORARIO_INVALIDO')
    esperarError(await crear({ horaInicio: '10:00', horaFin: '10:00' }), 400, 'RANGO_HORARIO_INVALIDO')
    esperarError(await crear({ horaInicio: '25:00' }), 400, 'VALIDACION')
    esperarError(await crear({ fecha: '2031-02-31' }), 400, 'VALIDACION')
    esperarError(await crear({ fecha: 'manana' }), 400, 'VALIDACION')
    esperarError(await crear({ espacio: 'Salón Inexistente 99' }), 400, 'RECURSO_INEXISTENTE')
    esperarError(await crear({ tipoEspacio: 'nave' }), 400, 'VALIDACION')
    const sinMotivo = await crear({ motivo: '' })
    esperarError(sinMotivo, 400, 'VALIDACION')
    assert.ok(sinMotivo.data.detalles.some((d) => d.campo === 'motivo'))
  })

  test('PUT modifica horario y motivo; se revalida el solapamiento sin chocar consigo misma', async () => {
    const espacio = 'Salón C09'
    const a = await crear({ espacio, horaInicio: '08:00', horaFin: '09:00' })
    const b = await crear({ espacio, horaInicio: '12:00', horaFin: '13:00' })

    const mismoRango = await api('PUT', `/reservas/${a.data.id}`, {
      token: est.token,
      body: cuerpo({ espacio, horaInicio: '08:00', horaFin: '09:30', motivo: 'Motivo modificado' }),
    })
    assert.equal(mismoRango.status, 200)
    assert.equal(mismoRango.data.horaFin, '09:30')
    assert.equal(mismoRango.data.motivo, 'Motivo modificado')

    esperarError(
      await api('PUT', `/reservas/${a.data.id}`, { token: est.token, body: cuerpo({ espacio, horaInicio: '12:30', horaFin: '14:00' }) }),
      409,
      'RESERVA_SOLAPADA',
    )
    esperarError(await api('PUT', `/reservas/${b.data.id}`, { token: doc.token, body: cuerpo({ espacio }) }), 403)
  })

  test('ciclo de estados: Pendiente -> Confirmada -> Cancelada; los finales no cambian', async () => {
    const r = await crear({ espacio: 'Salón D11' })
    const estado = (e, token = adm.token) => api('PATCH', `/reservas/${r.data.id}/estado`, { token, body: { estado: e } })

    esperarError(await estado('Confirmada', est.token), 403)
    esperarError(await estado('Inventado'), 400, 'VALIDACION')
    assert.equal((await estado('Confirmada')).data.estado, 'Confirmada')
    esperarError(await estado('Pendiente'), 409, 'TRANSICION_INVALIDA')
    esperarError(await estado('Denegada'), 409, 'TRANSICION_INVALIDA')
    assert.equal((await estado('Cancelada')).data.estado, 'Cancelada')
    esperarError(await estado('Confirmada'), 409, 'TRANSICION_INVALIDA')
    esperarError(await api('PUT', `/reservas/${r.data.id}`, { token: adm.token, body: cuerpo({ espacio: 'Salón D11' }) }), 409, 'RESERVA_FINALIZADA')

    const detalle = await api('GET', `/reservas/${r.data.id}`, { token: adm.token })
    assert.deepEqual(detalle.data.historial.map((h) => h.estado), ['Pendiente', 'Confirmada', 'Cancelada'])
  })

  test('equipos: confirmar descuenta stock, cancelar lo repone y sin stock no se reserva', async () => {
    const catalogo = await api('GET', '/reservas/catalogo', { token: est.token })
    const equipo = catalogo.data.equipos.find((e) => e.stock > 0)
    if (!equipo) return // sin equipos con stock en este entorno
    const stockDe = async () =>
      (await api('GET', '/reservas/catalogo', { token: est.token })).data.equipos.find((e) => e.nombre === equipo.nombre).stock

    const r = await crear({ tipoEspacio: 'equipo', espacio: equipo.nombre, horaInicio: '15:00', horaFin: '16:00' })
    assert.equal(r.status, 201)
    const inicial = await stockDe()
    assert.equal((await api('PATCH', `/reservas/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Confirmada' } })).status, 200)
    assert.equal(await stockDe(), inicial - 1)
    assert.equal((await api('PATCH', `/reservas/${r.data.id}/cancelar`, { token: adm.token })).status, 200)
    assert.equal(await stockDe(), inicial)

    esperarError(await crear({ tipoEspacio: 'equipo', espacio: 'Equipo que no existe' }), 400, 'RECURSO_INEXISTENTE')
  })

  test('disponibilidad: lista las franjas ocupadas de un espacio y exige parametros', async () => {
    const espacio = 'Salón A12'
    await crear({ espacio, horaInicio: '16:00', horaFin: '18:00' })
    const d = await api('GET', `/reservas/disponibilidad?espacio=${encodeURIComponent(espacio)}&fecha=${FECHA}`, { token: est.token })
    assert.equal(d.status, 200)
    assert.deepEqual(d.data.ocupadas.map((o) => `${o.horaInicio}-${o.horaFin}`), ['16:00-18:00'])
    esperarError(await api('GET', '/reservas/disponibilidad', { token: est.token }), 400, 'VALIDACION')
  })

  test('consultar: 404 inexistente y 403 ajena; el dueño elimina su Pendiente (204)', async () => {
    esperarError(await api('GET', '/reservas/RES-9999', { token: est.token }), 404, 'NO_ENCONTRADO')
    const r = await crear({ espacio: 'Salón B14' })
    esperarError(await api('GET', `/reservas/${r.data.id}`, { token: doc.token }), 403)
    assert.equal((await api('DELETE', `/reservas/${r.data.id}`, { token: est.token })).status, 204)
    esperarError(await api('GET', `/reservas/${r.data.id}`, { token: est.token }), 404)
  })
})
