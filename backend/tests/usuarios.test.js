// Pruebas de API: usuarios y registro publico.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo, PASSWORD } from './helpers.js'

describe('Usuarios', () => {
  let est, admin
  const creados = []

  before(async () => {
    est = await sesion('estudiante')
    admin = await sesion('admin')
  })

  after(async () => {
    for (const id of creados) await api('DELETE', `/usuarios/${id}`, { token: admin.token })
  })

  const nuevo = (extra = {}) => ({
    nombre: `Usuario de prueba ${sufijo()}`,
    correo: `prueba.${sufijo().toLowerCase()}@uajs.edu.co`,
    password: PASSWORD,
    rol: 'Docente',
    ...extra,
  })

  async function crear(extra) {
    const r = await api('POST', '/usuarios', { token: admin.token, body: nuevo(extra) })
    if (r.status === 201) creados.push(r.data.id)
    return r
  }

  test('el registro publico siempre crea un Estudiante, aunque se pida el rol Administrador', async () => {
    const body = nuevo({ rol: 'Administrador del sistema' })
    const r = await api('POST', '/auth/register', { body })
    assert.equal(r.status, 201)
    creados.push(r.data.usuario.id)
    assert.equal(r.data.usuario.rol, 'Estudiante')
    assert.equal(r.data.usuario.passwordHash, undefined)
  })

  test('el Administrador crea un usuario con el rol indicado y nunca se devuelve el hash', async () => {
    const r = await crear({ rol: 'Administrativo' })
    assert.equal(r.status, 201)
    assert.equal(r.data.rol, 'Administrativo')
    assert.equal(r.data.passwordHash, undefined)
    const login = await api('POST', '/auth/login', { body: { correo: r.data.correo, password: PASSWORD } })
    assert.equal(login.status, 200)
  })

  test('validaciones: rol invalido, dominio ajeno, contrasena corta y correo duplicado', async () => {
    esperarError(await crear({ rol: 'Rey' }), 400, 'INVALID_ROLE')
    esperarError(await crear({ correo: 'alguien@gmail.com' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ password: '123' }), 400, 'VALIDATION_ERROR')
    esperarError(await crear({ nombre: '' }), 400, 'VALIDATION_ERROR')
    const a = await crear()
    esperarError(await crear({ correo: a.data.correo }), 409, 'DUPLICATE')
  })

  test('permisos: un estudiante no lista, crea ni elimina usuarios y solo consulta el suyo', async () => {
    esperarError(await api('GET', '/usuarios', { token: est.token }), 403)
    esperarError(await api('POST', '/usuarios', { token: est.token, body: nuevo() }), 403)
    const a = await crear()
    esperarError(await api('GET', `/usuarios/${a.data.id}`, { token: est.token }), 403)
    esperarError(await api('DELETE', `/usuarios/${a.data.id}`, { token: est.token }), 403)
    assert.equal((await api('GET', `/usuarios/${est.usuario.id}`, { token: est.token })).status, 200)
  })

  test('consultar por ID, editar con PATCH, cambiar estado y rol, y eliminar', async () => {
    const a = await crear()
    const det = await api('GET', `/usuarios/${a.data.id}`, { token: admin.token })
    assert.equal(det.data.correo, a.data.correo)
    const edit = await api('PATCH', `/usuarios/${a.data.id}`, { token: admin.token, body: { nombre: 'Nombre editado', programa: 'Ingeniería' } })
    assert.equal(edit.status, 200)
    assert.equal(edit.data.nombre, 'Nombre editado')
    const estado = await api('PATCH', `/usuarios/${a.data.id}/estado`, { token: admin.token })
    assert.equal(estado.data.activo, false)
    const rol = await api('PATCH', `/usuarios/${a.data.id}/rol`, { token: admin.token, body: { rol: 'Estudiante' } })
    assert.equal(rol.data.rol, 'Estudiante')
    esperarError(await api('PATCH', `/usuarios/${a.data.id}/rol`, { token: admin.token, body: { rol: 'Rey' } }), 400, 'INVALID_ROLE')
    assert.equal((await api('DELETE', `/usuarios/${a.data.id}`, { token: admin.token })).status, 204)
    esperarError(await api('GET', `/usuarios/${a.data.id}`, { token: admin.token }), 404, 'USER_NOT_FOUND')
  })

  test('un administrador no puede eliminar su propia cuenta -> 400', async () => {
    esperarError(await api('DELETE', `/usuarios/${admin.usuario.id}`, { token: admin.token }), 400)
  })

  // Reglas incorporadas por el PR #19
  test('GET /usuarios/abc -> 400', async () => {
    esperarError(await api('GET', '/usuarios/abc', { token: admin.token }), 400, 'VALIDATION_ERROR')
  })

  test('login con tipos de dato incorrectos -> 400', async () => {
    esperarError(await api('POST', '/auth/login', { body: { correo: 123, password: { a: 1 } } }), 400, 'VALIDATION_ERROR')
  })
})
