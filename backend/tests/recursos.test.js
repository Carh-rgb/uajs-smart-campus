// Pruebas de API: recursos (matriz T01-T07 del PDF 9.3) e integridad con reservas.
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

  test('T02 crear recurso valido -> 201 y registro almacenado', async () => {
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
    const sinNombre = await crear({ nombre: '' })
    esperarError(sinNombre, 400, 'VALIDACION')
    assert.ok(sinNombre.data.detalles.some((d) => d.campo === 'nombre'))
    esperarError(await crear({ ubicacion: undefined }), 400, 'VALIDACION')
    esperarError(await crear({ tipo: 'Nave espacial' }), 400, 'VALIDACION')
    esperarError(await crear({ estado: 'Roto' }), 400, 'VALIDACION')
    esperarError(await crear({ codigo: 'XX-1' }), 400, 'VALIDACION')
    const despues = (await api('GET', '/recursos', { token: adm.token })).data.length
    assert.equal(despues, antes)
  })

  test('codigo repetido -> 409; un estudiante no puede crear -> 403', async () => {
    const a = await crear()
    esperarError(await crear({ codigo: a.data.codigo }), 409, 'CODIGO_DUPLICADO')
    esperarError(await api('POST', '/recursos', { token: est.token, body: nuevo() }), 403)
  })

  test('T04 consultar ID existente -> 200 con los datos correctos', async () => {
    const a = await crear()
    const r = await api('GET', `/recursos/${a.data.codigo}`, { token: est.token })
    assert.equal(r.status, 200)
    assert.equal(r.data.nombre, a.data.nombre)
    assert.equal(r.data.ubicacion, 'Bodega de pruebas')
  })

  test('T05 consultar ID inexistente -> 404 controlado', async () => {
    esperarError(await api('GET', '/recursos/REC-99999', { token: est.token }), 404, 'NO_ENCONTRADO')
  })

  test('T06 actualizar ubicacion y estado permitido -> 200 y cambio persistido', async () => {
    const a = await crear()
    const put = await api('PUT', `/recursos/${a.data.codigo}`, {
      token: adm.token,
      body: { nombre: a.data.nombre, tipo: 'Mobiliario', ubicacion: 'Sala S01', estado: 'En mantenimiento' },
    })
    assert.equal(put.status, 200)
    const leido = await api('GET', `/recursos/${a.data.codigo}`, { token: est.token })
    assert.equal(leido.data.ubicacion, 'Sala S01')
    assert.equal(leido.data.estado, 'En mantenimiento')

    const patch = await api('PATCH', `/recursos/${a.data.codigo}/estado`, { token: adm.token, body: { estado: 'Fuera de servicio' } })
    assert.equal(patch.data.estado, 'Fuera de servicio')
    esperarError(await api('PATCH', `/recursos/${a.data.codigo}/estado`, { token: adm.token, body: { estado: 'Explotado' } }), 400, 'VALIDACION')
    esperarError(await api('PUT', `/recursos/${a.data.codigo}`, { token: adm.token, body: { nombre: 'x' } }), 400, 'VALIDACION')

    const hist = await api('GET', `/recursos/${a.data.codigo}/historial`, { token: adm.token })
    assert.deepEqual(hist.data.map((h) => h.estado), ['Disponible', 'En mantenimiento', 'Fuera de servicio'])
  })

  test('T07 eliminar recurso sin conflicto -> 204 y luego 404', async () => {
    const a = await crear()
    assert.equal((await api('DELETE', `/recursos/${a.data.codigo}`, { token: adm.token })).status, 204)
    esperarError(await api('GET', `/recursos/${a.data.codigo}`, { token: adm.token }), 404)
    esperarError(await api('DELETE', `/recursos/${a.data.codigo}`, { token: adm.token }), 404)
  })

  test('integracion recursos <-> reservas: stock reservable y 409 al eliminar un equipo en uso', async () => {
    const nombre = `Proyector prueba ${sufijo()}`
    const r = await crear({ nombre, tipo: 'Audiovisual' })
    assert.equal(r.status, 201)

    // La sincronizacion hacia reservas-service es asincrona: se espera a que aparezca.
    const equipoEnCatalogo = async () =>
      (await api('GET', '/reservas/catalogo', { token: adm.token })).data.equipos.find((e) => e.nombre === nombre)
    let equipo
    for (let i = 0; i < 20 && !equipo; i++) {
      equipo = await equipoEnCatalogo()
      if (!equipo) await new Promise((ok) => setTimeout(ok, 150))
    }
    assert.ok(equipo, 'el equipo debe aparecer en el catalogo de reservas')
    assert.equal(equipo.stock, 1)

    const reserva = await api('POST', '/reservas', {
      token: est.token,
      body: { tipoEspacio: 'equipo', espacio: nombre, fecha: '2033-05-10', horaInicio: '08:00', horaFin: '09:00', motivo: 'Prueba de integridad' },
    })
    assert.equal(reserva.status, 201)

    const bloqueado = await api('DELETE', `/recursos/${r.data.codigo}`, { token: adm.token })
    esperarError(bloqueado, 409, 'RECURSO_EN_USO')

    await api('PATCH', `/reservas/${reserva.data.id}/cancelar`, { token: adm.token })
    assert.equal((await api('DELETE', `/recursos/${r.data.codigo}`, { token: adm.token })).status, 204)
    await api('DELETE', `/reservas/${reserva.data.id}`, { token: adm.token })
  })
})
