// Pruebas de API: sesion unica por cuenta y cierre de sesion (Entregable 3).
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo, PASSWORD } from './helpers.js'

describe('Sesion unica e inactividad', () => {
  let admin
  const creados = []

  before(async () => {
    admin = await sesion('admin')
  })

  after(async () => {
    for (const id of creados) await api('DELETE', `/usuarios/${id}`, { token: admin.token })
  })

  // Cada prueba usa una cuenta propia para no cerrar las sesiones de otras.
  async function cuentaNueva() {
    const correo = `sesion.${sufijo().toLowerCase()}@uajs.edu.co`
    const r = await api('POST', '/usuarios', {
      token: admin.token,
      body: { nombre: `Prueba sesion ${sufijo()}`, correo, password: PASSWORD, rol: 'Docente' },
    })
    assert.equal(r.status, 201)
    creados.push(r.data.id)
    return { correo, id: r.data.id }
  }
  const entrar = async (correo) => (await api('POST', '/auth/login', { body: { correo, password: PASSWORD } })).data

  test('E3-16 iniciar sesion en otro dispositivo cierra la sesion anterior -> 401 SESSION_REPLACED', async () => {
    const { correo } = await cuentaNueva()
    const pc = await entrar(correo)
    assert.equal(pc.inactividadMinutos, 30)
    assert.equal((await api('GET', '/auth/me', { token: pc.token })).status, 200)

    const celular = await entrar(correo)
    // el token viejo ya no sirve en ningun microservicio, el nuevo si
    esperarError(await api('GET', '/recursos', { token: pc.token }), 401, 'SESSION_REPLACED')
    esperarError(await api('GET', '/auth/sesion', { token: pc.token }), 401, 'SESSION_REPLACED')
    assert.equal((await api('GET', '/recursos', { token: celular.token })).status, 200)
    assert.equal((await api('GET', '/auth/sesion', { token: celular.token })).data.activa, true)
  })

  test('E3-17 cerrar sesion invalida el token en el servidor -> 401 SESSION_EXPIRED', async () => {
    const { correo } = await cuentaNueva()
    const s = await entrar(correo)
    assert.equal((await api('POST', '/auth/logout', { token: s.token })).status, 204)
    esperarError(await api('GET', '/eventos', { token: s.token }), 401, 'SESSION_EXPIRED')
  })

  test('E3-18 desactivar una cuenta cierra su sesion abierta', async () => {
    const { correo, id } = await cuentaNueva()
    const s = await entrar(correo)
    assert.equal((await api('GET', '/solicitudes', { token: s.token })).status, 200)
    assert.equal((await api('PATCH', `/usuarios/${id}/estado`, { token: admin.token })).data.activo, false)
    esperarError(await api('GET', '/auth/sesion', { token: s.token }), 401, 'SESSION_EXPIRED')
  })
})
