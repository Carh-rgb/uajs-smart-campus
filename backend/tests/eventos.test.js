// Pruebas de API: eventos e inscripciones.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo } from './helpers.js'

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
    fecha: '2031-06-15',
    hora: '09:00',
    horaFin: '11:00',
    lugar: 'Sala S01',
    ponente: 'Equipo de pruebas',
    descripcion: 'Evento creado por la suite automatica',
    facultad: 'General / Bienestar Universitario',
    ...extra,
  })

  async function crear(extra) {
    const r = await api('POST', '/eventos', { token: adm.token, body: nuevo(extra) })
    if (r.status === 201) creados.push(r.data.id)
    return r
  }

  test('crear evento valido -> 201; aparece en el listado con inscritosCount', async () => {
    const r = await crear()
    assert.equal(r.status, 201)
    assert.equal(r.data.estado, 'Activo')
    assert.equal(r.data.inscritosCount, 0)
    const lista = await api('GET', '/eventos', { token: est.token })
    assert.equal(lista.status, 200)
    assert.ok(lista.data.some((e) => e.id === r.data.id))
  })

  test('validaciones: campos obligatorios, fecha/hora validas, rango horario, cupo', async () => {
    const sinTitulo = await crear({ titulo: '' })
    esperarError(sinTitulo, 400, 'VALIDACION')
    assert.ok(sinTitulo.data.detalles.some((d) => d.campo === 'titulo'))
    esperarError(await crear({ lugar: undefined }), 400, 'VALIDACION')
    esperarError(await crear({ fecha: '2031-13-45' }), 400, 'VALIDACION')
    esperarError(await crear({ hora: '9am' }), 400, 'VALIDACION')
    esperarError(await crear({ hora: '10:00', horaFin: '09:00' }), 400, 'RANGO_HORARIO_INVALIDO')
    esperarError(await crear({ cupoMaximo: 0 }), 400, 'VALIDACION')
    esperarError(await crear({ estado: 'Fantasma' }), 400, 'VALIDACION')
    esperarError(await api('POST', '/eventos', { token: est.token, body: nuevo() }), 403)
  })

  test('consultar por id: 200, 404 inexistente, 400 id no numerico', async () => {
    const r = await crear()
    const ok = await api('GET', `/eventos/${r.data.id}`, { token: est.token })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.titulo, r.data.titulo)
    esperarError(await api('GET', '/eventos/999999', { token: est.token }), 404, 'NO_ENCONTRADO')
    esperarError(await api('GET', '/eventos/abc', { token: est.token }), 400, 'VALIDACION')
  })

  test('PUT actualiza y persiste; PATCH /:id/estado valida el estado', async () => {
    const r = await crear()
    const put = await api('PUT', `/eventos/${r.data.id}`, { token: adm.token, body: nuevo({ titulo: 'Titulo actualizado', lugar: 'Sala S02' }) })
    assert.equal(put.status, 200)
    const leido = await api('GET', `/eventos/${r.data.id}`, { token: est.token })
    assert.equal(leido.data.titulo, 'Titulo actualizado')
    assert.equal(leido.data.lugar, 'Sala S02')

    assert.equal((await api('PATCH', `/eventos/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Cancelado' } })).data.estado, 'Cancelado')
    esperarError(await api('PATCH', `/eventos/${r.data.id}/estado`, { token: adm.token, body: { estado: 'Otro' } }), 400, 'VALIDACION')
  })

  test('los eventos Inactivos (borradores) no los ve un estudiante', async () => {
    const r = await crear({ estado: 'Inactivo' })
    esperarError(await api('GET', `/eventos/${r.data.id}`, { token: est.token }), 404)
    const lista = await api('GET', '/eventos', { token: est.token })
    assert.ok(!lista.data.some((e) => e.id === r.data.id))
    assert.equal((await api('GET', `/eventos/${r.data.id}`, { token: adm.token })).status, 200)
  })

  test('inscripcion: 201, doble inscripcion 409, cancelar 204, el personal no se inscribe 403', async () => {
    const r = await crear()
    const url = `/eventos/${r.data.id}/inscribir`
    assert.equal((await api('POST', url, { token: est.token })).status, 201)
    esperarError(await api('POST', url, { token: est.token }), 409, 'YA_INSCRITO')
    esperarError(await api('POST', url, { token: adm.token }), 403)

    const lista = await api('GET', '/eventos', { token: est.token })
    const e = lista.data.find((x) => x.id === r.data.id)
    assert.equal(e.inscrito, true)
    assert.equal(e.inscritosCount, 1)

    assert.equal((await api('DELETE', `/eventos/${r.data.id}/inscripcion`, { token: est.token })).status, 204)
    esperarError(await api('DELETE', `/eventos/${r.data.id}/inscripcion`, { token: est.token }), 404)
  })

  test('cupo lleno -> 409 CUPO_AGOTADO', async () => {
    const r = await crear({ cupoMaximo: 1 })
    assert.equal((await api('POST', `/eventos/${r.data.id}/inscribir`, { token: est.token })).status, 201)
    esperarError(await api('POST', `/eventos/${r.data.id}/inscribir`, { token: doc.token }), 409, 'CUPO_AGOTADO')
  })

  test('el cupo no se puede bajar por debajo de los inscritos -> 409', async () => {
    const r = await crear({ cupoMaximo: 2 })
    await api('POST', `/eventos/${r.data.id}/inscribir`, { token: est.token })
    await api('POST', `/eventos/${r.data.id}/inscribir`, { token: doc.token })
    const reducir = await api('PUT', `/eventos/${r.data.id}`, { token: adm.token, body: nuevo({ titulo: r.data.titulo, cupoMaximo: 1 }) })
    esperarError(reducir, 409, 'CUPO_INFERIOR_A_INSCRITOS')
  })

  test('un evento cancelado no admite inscripciones -> 409', async () => {
    const r = await crear({ estado: 'Cancelado' })
    esperarError(await api('POST', `/eventos/${r.data.id}/inscribir`, { token: est.token }), 409, 'EVENTO_NO_DISPONIBLE')
  })

  test('4 inscripciones simultaneas a un evento con cupo 1: solo entra una', async () => {
    const r = await crear({ cupoMaximo: 1 })
    // Un estudiante y un docente compiten (cada uno dos veces) por un unico lugar.
    const resultados = await Promise.all([
      api('POST', `/eventos/${r.data.id}/inscribir`, { token: est.token }),
      api('POST', `/eventos/${r.data.id}/inscribir`, { token: doc.token }),
      api('POST', `/eventos/${r.data.id}/inscribir`, { token: est.token }),
      api('POST', `/eventos/${r.data.id}/inscribir`, { token: doc.token }),
    ])
    assert.equal(resultados.filter((x) => x.status === 201).length, 1, 'el cupo de 1 solo admite una inscripcion')
    const inscritos = await api('GET', `/eventos/${r.data.id}/inscritos`, { token: adm.token })
    assert.equal(inscritos.data.length, 1)
  })

  test('eliminar evento -> 204 y desaparece junto con sus inscripciones', async () => {
    const r = await api('POST', '/eventos', { token: adm.token, body: nuevo() })
    await api('POST', `/eventos/${r.data.id}/inscribir`, { token: est.token })
    assert.equal((await api('DELETE', `/eventos/${r.data.id}`, { token: adm.token })).status, 204)
    esperarError(await api('GET', `/eventos/${r.data.id}`, { token: adm.token }), 404)
  })
})
