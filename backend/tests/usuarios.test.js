// Pruebas de API: usuarios y autenticacion.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { api, sesion, esperarError, sufijo, USUARIOS, PASSWORD } from './helpers.js'

describe('Autenticacion', () => {
  test('login valido -> 200 con token y sin datos secretos', async () => {
    const r = await api('POST', '/auth/login', { body: { correo: USUARIOS.estudiante, password: PASSWORD } })
    assert.equal(r.status, 200)
    assert.equal(typeof r.data.token, 'string')
    assert.equal(r.data.usuario.correo, USUARIOS.estudiante)
    const texto = JSON.stringify(r.data)
    assert.ok(!/passwordHash|resetToken|\$2[aby]\$/.test(texto), 'no debe filtrar hashes ni tokens de reset')
  })

  test('login invalido -> 401; datos faltantes o de tipo incorrecto -> 400 (sin tumbar el servicio)', async () => {
    esperarError(await api('POST', '/auth/login', { body: { correo: USUARIOS.estudiante, password: 'incorrecta' } }), 401, 'CREDENCIALES_INVALIDAS')
    esperarError(await api('POST', '/auth/login', { body: { correo: 'nadie@uajs.edu.co', password: 'x' } }), 401)
    esperarError(await api('POST', '/auth/login', { body: { correo: USUARIOS.estudiante } }), 400, 'VALIDACION')
    esperarError(await api('POST', '/auth/login', { body: { correo: 12345, password: 'x' } }), 400, 'VALIDACION')
    esperarError(await api('POST', '/auth/login', { raw: '{malformado' }), 400, 'JSON_INVALIDO')
    assert.equal((await api('POST', '/auth/login', { body: { correo: USUARIOS.estudiante, password: PASSWORD } })).status, 200)
  })

  test('inyeccion SQL en el login no autentica (consultas parametrizadas)', async () => {
    const r = await api('POST', '/auth/login', { body: { correo: "admin@uajs.edu.co' OR '1'='1", password: "' OR '1'='1" } })
    assert.ok([400, 401].includes(r.status))
    assert.equal(r.data.token, undefined)
  })

  test('token invalido o ausente -> 401; /auth/me devuelve el perfil propio', async () => {
    esperarError(await api('GET', '/auth/me'), 401, 'NO_AUTENTICADO')
    esperarError(await api('GET', '/auth/me', { token: 'abc.def.ghi' }), 401, 'TOKEN_INVALIDO')
    const est = await sesion('estudiante')
    const me = await api('GET', '/auth/me', { token: est.token })
    assert.equal(me.status, 200)
    assert.equal(me.data.correo, USUARIOS.estudiante)
  })

  test('el registro de cuentas no es publico: sin token -> 401, estudiante -> 403', async () => {
    const cuerpo = { nombre: 'Intruso Prueba', correo: `intruso.${sufijo()}@uajs.edu.co`, password: 'clave123', rol: 'Administrador del sistema' }
    esperarError(await api('POST', '/auth/register', { body: cuerpo }), 401)
    const est = await sesion('estudiante')
    esperarError(await api('POST', '/auth/register', { token: est.token, body: cuerpo }), 403)
  })
})

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
    nombre: 'Usuario De Prueba',
    correo: `prueba.${sufijo()}@uajs.edu.co`,
    password: 'clave123',
    rol: 'Estudiante',
    programa: 'Ingeniería de Sistemas',
    ...extra,
  })

  async function crear(extra) {
    const r = await api('POST', '/usuarios', { token: admin.token, body: nuevo(extra) })
    if (r.status === 201) creados.push(r.data.id)
    return r
  }

  test('listar: solo el Administrador; sin campos secretos', async () => {
    esperarError(await api('GET', '/usuarios', { token: est.token }), 403)
    const r = await api('GET', '/usuarios', { token: admin.token })
    assert.equal(r.status, 200)
    assert.ok(r.data.length >= 4)
    assert.ok(r.data.every((u) => !('passwordHash' in u) && !('resetToken' in u)))
  })

  test('crear usuario valido -> 201; puede iniciar sesion con su contrasena', async () => {
    const datos = nuevo()
    const r = await api('POST', '/usuarios', { token: admin.token, body: datos })
    assert.equal(r.status, 201)
    creados.push(r.data.id)
    assert.equal(r.data.activo, true)
    assert.ok(!('passwordHash' in r.data))
    const login = await api('POST', '/auth/login', { body: { correo: datos.correo, password: datos.password } })
    assert.equal(login.status, 200)
  })

  test('validaciones: correo, dominio, contrasena corta, rol, nombre; duplicado -> 409', async () => {
    const a = await crear()
    esperarError(await crear({ correo: a.data.correo }), 409, 'CORREO_DUPLICADO')
    esperarError(await crear({ correo: 'sin-arroba' }), 400, 'VALIDACION')
    esperarError(await crear({ correo: `alguien.${sufijo()}@gmail.com` }), 400, 'VALIDACION')
    esperarError(await crear({ password: '123' }), 400, 'VALIDACION')
    esperarError(await crear({ rol: 'Superheroe' }), 400, 'VALIDACION')
    const sinNombre = await crear({ nombre: '' })
    esperarError(sinNombre, 400, 'VALIDACION')
    assert.ok(sinNombre.data.detalles.some((d) => d.campo === 'nombre'))
  })

  test('consultar por id: 200 (admin y el propio usuario), 403 ajeno, 404, 400', async () => {
    const a = await crear()
    assert.equal((await api('GET', `/usuarios/${a.data.id}`, { token: admin.token })).status, 200)
    esperarError(await api('GET', `/usuarios/${a.data.id}`, { token: est.token }), 403)
    assert.equal((await api('GET', `/usuarios/${est.usuario.id}`, { token: est.token })).status, 200)
    esperarError(await api('GET', '/usuarios/999999', { token: admin.token }), 404, 'NO_ENCONTRADO')
    esperarError(await api('GET', '/usuarios/abc', { token: admin.token }), 400, 'VALIDACION')
  })

  test('PUT actualiza datos; correo repetido -> 409; no permite dejar al sistema sin administrador', async () => {
    const a = await crear()
    const b = await crear()
    const ok = await api('PUT', `/usuarios/${a.data.id}`, {
      token: admin.token,
      body: { nombre: 'Nombre Actualizado', correo: a.data.correo, rol: 'Docente', programa: 'Facultad de Ingeniería', activo: true },
    })
    assert.equal(ok.status, 200)
    assert.equal(ok.data.rol, 'Docente')
    assert.equal((await api('GET', `/usuarios/${a.data.id}`, { token: admin.token })).data.nombre, 'Nombre Actualizado')

    esperarError(
      await api('PUT', `/usuarios/${a.data.id}`, { token: admin.token, body: { nombre: 'Nombre Actualizado', correo: b.data.correo, rol: 'Docente' } }),
      409,
      'CORREO_DUPLICADO',
    )
    esperarError(await api('PUT', `/usuarios/${a.data.id}`, { token: est.token, body: {} }), 403)

    // El unico Administrador activo no puede degradarse, desactivarse ni eliminarse.
    const yo = admin.usuario.id
    esperarError(await api('PATCH', `/usuarios/${yo}/rol`, { token: admin.token, body: { rol: 'Estudiante' } }), 409, 'ULTIMO_ADMINISTRADOR')
    esperarError(await api('PATCH', `/usuarios/${yo}/estado`, { token: admin.token }), 409, 'ULTIMO_ADMINISTRADOR')
    esperarError(await api('DELETE', `/usuarios/${yo}`, { token: admin.token }), 409)
  })

  test('PATCH rol/estado: valida el rol y desactiva/reactiva (un desactivado no inicia sesion)', async () => {
    const datos = nuevo()
    const a = await api('POST', '/usuarios', { token: admin.token, body: datos })
    creados.push(a.data.id)
    esperarError(await api('PATCH', `/usuarios/${a.data.id}/rol`, { token: admin.token, body: { rol: 'Rey' } }), 400, 'VALIDACION')
    assert.equal((await api('PATCH', `/usuarios/${a.data.id}/rol`, { token: admin.token, body: { rol: 'Administrativo' } })).data.rol, 'Administrativo')

    assert.equal((await api('PATCH', `/usuarios/${a.data.id}/estado`, { token: admin.token })).data.activo, false)
    esperarError(await api('POST', '/auth/login', { body: { correo: datos.correo, password: datos.password } }), 401)
    assert.equal((await api('PATCH', `/usuarios/${a.data.id}/estado`, { token: admin.token })).data.activo, true)
    assert.equal((await api('POST', '/auth/login', { body: { correo: datos.correo, password: datos.password } })).status, 200)
  })

  test('eliminar usuario -> 204 y luego 404; solo el Administrador', async () => {
    const a = await crear()
    esperarError(await api('DELETE', `/usuarios/${a.data.id}`, { token: est.token }), 403)
    assert.equal((await api('DELETE', `/usuarios/${a.data.id}`, { token: admin.token })).status, 204)
    esperarError(await api('GET', `/usuarios/${a.data.id}`, { token: admin.token }), 404)
  })

  test('reservas: un usuario desactivado no puede crear reservas (integracion con usuarios-service)', async () => {
    const datos = nuevo()
    const a = await api('POST', '/usuarios', { token: admin.token, body: datos })
    creados.push(a.data.id)
    const { token } = await (async () => {
      const l = await api('POST', '/auth/login', { body: { correo: datos.correo, password: datos.password } })
      return { token: l.data.token }
    })()
    await api('PATCH', `/usuarios/${a.data.id}/estado`, { token: admin.token }) // lo desactiva con el token aun vigente

    const r = await api('POST', '/reservas', {
      token,
      body: { tipoEspacio: 'espacio', espacio: 'Sala S01', fecha: '2034-01-10', horaInicio: '08:00', horaFin: '09:00', motivo: 'Usuario inactivo' },
    })
    esperarError(r, 403, 'USUARIO_INACTIVO')
  })
})
