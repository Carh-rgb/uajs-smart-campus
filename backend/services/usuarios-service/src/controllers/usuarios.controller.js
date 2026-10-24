import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { Usuario } from '../models/index.js'
import { indexarUsuario, eliminarUsuarioDelIndice } from '../utils/busquedaClient.js'
import { ErrorApi, noEncontrado, prohibido, conflicto } from '../utils/errores.js'
import { validar, idEntero } from '../utils/validaciones.js'

export const ROLES = ['Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema']
const DOMINIO = /@uajs\.edu\.co$/i

// Nunca se devuelve passwordHash, resetToken ni otros secretos (PDF 9.2).
function serializar(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    programa: usuario.programa,
    activo: usuario.activo,
  }
}

async function buscarUsuario(idCrudo) {
  const id = idEntero(idCrudo, 'El id de usuario')
  const usuario = await Usuario.findByPk(id)
  if (!usuario) throw noEncontrado('Usuario')
  return usuario
}

// Evita dejar el sistema sin ningun Administrador activo.
async function asegurarOtroAdministrador(usuario) {
  if (usuario.rol !== 'Administrador del sistema' || !usuario.activo) return
  const otros = await Usuario.count({
    where: { rol: 'Administrador del sistema', activo: true, id: { [Op.ne]: usuario.id } },
  })
  if (otros === 0) {
    throw conflicto('No se puede dejar el sistema sin un Administrador activo.', 'ULTIMO_ADMINISTRADOR')
  }
}

function validarCorreoInstitucional(correo) {
  if (!DOMINIO.test(correo)) {
    throw new ErrorApi(400, 'El correo debe pertenecer al dominio @uajs.edu.co.', 'VALIDACION', [
      { campo: 'correo', mensaje: 'Debe terminar en @uajs.edu.co.' },
    ])
  }
}

async function asegurarCorreoLibre(correo, excluirId) {
  const existente = await Usuario.findOne({ where: { correo } })
  if (existente && existente.id !== excluirId) {
    throw conflicto('Ya existe un usuario con ese correo.', 'CORREO_DUPLICADO', [{ campo: 'correo', mensaje: 'Correo ya registrado.' }])
  }
}

export async function listar(req, res) {
  const { rol, q, activo } = req.query
  const where = {}
  if (rol && rol !== 'Todos') where.rol = String(rol)
  if (activo === 'true' || activo === 'false') where.activo = activo === 'true'
  if (q) {
    const patron = `%${String(q).slice(0, 100)}%`
    where[Op.or] = [{ nombre: { [Op.iLike]: patron } }, { correo: { [Op.iLike]: patron } }]
  }

  const usuarios = await Usuario.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(usuarios.map(serializar))
}

export async function listarResponsables(req, res) {
  // Usado por solicitudes-service (via el frontend) para poblar el
  // selector de "Asignado a" con Docentes y Administrativos activos.
  const usuarios = await Usuario.findAll({
    where: { activo: true, rol: { [Op.in]: ['Docente', 'Administrativo'] } },
    order: [['nombre', 'ASC']],
  })
  res.json(usuarios.map(serializar))
}

// GET /usuarios/:id — lo puede consultar el Administrador del sistema o el
// propio usuario. Tambien lo usan otros microservicios (reservas) con un
// token de servicio para comprobar que el usuario existe y esta activo.
export async function obtener(req, res) {
  const id = idEntero(req.params.id, 'El id de usuario')
  if (req.user.rol !== 'Administrador del sistema' && req.user.id !== id) {
    throw prohibido('No tienes permisos para ver este usuario.')
  }
  const usuario = await Usuario.findByPk(id)
  if (!usuario) throw noEncontrado('Usuario')
  res.json(serializar(usuario))
}

// POST /usuarios — el Administrador crea una cuenta (con contraseña inicial).
export async function crear(req, res) {
  const datos = validar(req.body, {
    nombre: { tipo: 'texto', requerido: true, min: 3, max: 120, etiqueta: 'El nombre' },
    correo: { tipo: 'correo', requerido: true, etiqueta: 'El correo' },
    password: { tipo: 'texto', requerido: true, min: 6, max: 72, etiqueta: 'La contraseña' },
    rol: { tipo: 'texto', requerido: true, valores: ROLES, etiqueta: 'El rol' },
    programa: { tipo: 'texto', max: 120, etiqueta: 'El programa' },
  })
  validarCorreoInstitucional(datos.correo)
  await asegurarCorreoLibre(datos.correo)

  const usuario = await Usuario.create({
    nombre: datos.nombre,
    correo: datos.correo,
    passwordHash: await bcrypt.hash(datos.password, 10),
    rol: datos.rol,
    programa: datos.programa || null,
  })
  indexarUsuario(usuario)
  res.status(201).json(serializar(usuario))
}

// PUT /usuarios/:id — reemplaza los datos administrables de la cuenta
// (nombre, correo, rol, programa, activo). La contraseña NO se toca aqui.
export async function actualizar(req, res) {
  const usuario = await buscarUsuario(req.params.id)

  const datos = validar(req.body, {
    nombre: { tipo: 'texto', requerido: true, min: 3, max: 120, etiqueta: 'El nombre' },
    correo: { tipo: 'correo', requerido: true, etiqueta: 'El correo' },
    rol: { tipo: 'texto', requerido: true, valores: ROLES, etiqueta: 'El rol' },
    programa: { tipo: 'texto', max: 120, etiqueta: 'El programa' },
    activo: { tipo: 'booleano', etiqueta: 'El estado activo' },
  })
  validarCorreoInstitucional(datos.correo)
  await asegurarCorreoLibre(datos.correo, usuario.id)

  const pierdeAdmin = usuario.rol === 'Administrador del sistema' && (datos.rol !== usuario.rol || datos.activo === false)
  if (pierdeAdmin) await asegurarOtroAdministrador(usuario)

  usuario.set({
    nombre: datos.nombre,
    correo: datos.correo,
    rol: datos.rol,
    programa: datos.programa || null,
    ...(datos.activo !== undefined && { activo: datos.activo }),
  })
  await usuario.save()
  indexarUsuario(usuario)
  res.json(serializar(usuario))
}

export async function actualizarEstado(req, res) {
  const usuario = await buscarUsuario(req.params.id)
  if (usuario.activo) await asegurarOtroAdministrador(usuario)
  usuario.activo = !usuario.activo
  await usuario.save()
  indexarUsuario(usuario)
  res.json(serializar(usuario))
}

export async function actualizarRol(req, res) {
  const { rol } = validar(req.body, { rol: { tipo: 'texto', requerido: true, valores: ROLES, etiqueta: 'El rol' } })
  const usuario = await buscarUsuario(req.params.id)
  if (rol !== usuario.rol) await asegurarOtroAdministrador(usuario)
  usuario.rol = rol
  await usuario.save()
  indexarUsuario(usuario)
  res.json(serializar(usuario))
}

export async function eliminar(req, res) {
  const usuario = await buscarUsuario(req.params.id)

  if (usuario.id === req.user.id) {
    throw conflicto('No puedes eliminar tu propio usuario.', 'AUTOELIMINACION')
  }
  await asegurarOtroAdministrador(usuario)

  await usuario.destroy()
  eliminarUsuarioDelIndice(usuario.id)
  res.status(204).send()
}
