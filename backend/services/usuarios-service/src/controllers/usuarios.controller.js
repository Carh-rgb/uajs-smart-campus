import { Usuario } from '../models/index.js'
import { indexarUsuario, eliminarUsuarioDelIndice } from '../utils/busquedaClient.js'
import {
  crearCuenta,
  ROLES,
  CAMPOS_REGISTRO_INSTITUCIONAL,
  serializar as serializarDetalle,
} from './auth.controller.js'
import { HttpError } from '../middlewares/errores.js'

const ADMIN = 'Administrador del sistema'

async function buscarOFallar(id) {
  const usuario = await Usuario.findByPk(id)
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado.', 'USER_NOT_FOUND')
  return usuario
}

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

export async function listar(req, res) {
  const { rol, q } = req.query
  const where = {}
  if (rol && rol !== 'Todos') where.rol = rol

  let usuarios = await Usuario.findAll({ where, order: [['createdAt', 'DESC']] })

  if (q) {
    const texto = q.toLowerCase()
    usuarios = usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto),
    )
  }

  res.json(usuarios.map(serializar))
}

export async function listarResponsables(req, res) {
  // Usado por solicitudes-service (via el frontend) para poblar el
  // selector de "Asignado a" con Docentes y Administrativos activos.
  const usuarios = await Usuario.findAll({
    where: { activo: true },
    order: [['nombre', 'ASC']],
  })
  const responsables = usuarios
    .filter((u) => u.rol === 'Docente' || u.rol === 'Administrativo')
    .map(serializar)
  res.json(responsables)
}

export async function actualizarEstado(req, res) {
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })
  usuario.activo = !usuario.activo
  await usuario.save()
  indexarUsuario(usuario)
  res.json(serializar(usuario))
}

export async function actualizarRol(req, res) {
  const { rol } = req.body
  if (!ROLES.includes(rol)) {
    throw new HttpError(400, `Rol invalido. Valores permitidos: ${ROLES.join(', ')}.`, 'INVALID_ROLE')
  }
  const usuario = await buscarOFallar(req.params.id)
  usuario.rol = rol
  await usuario.save()
  indexarUsuario(usuario)
  res.json(serializar(usuario))
}

export async function eliminar(req, res) {
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })

  if (usuario.id === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' })
  }

  await usuario.destroy()
  eliminarUsuarioDelIndice(usuario.id)
  res.status(204).send()
}

// GET /usuarios/:id (E2-11): el Administrador ve cualquier usuario; los
// demas solo pueden consultarse a si mismos.
export async function obtener(req, res) {
  const id = Number(req.params.id)
  if (req.user.rol !== ADMIN && req.user.id !== id) {
    throw new HttpError(403, 'Solo puedes consultar tu propio usuario.')
  }
  const usuario = await buscarOFallar(id)
  res.json(serializarDetalle(usuario))
}

// POST /usuarios (E2-11): el Administrador crea cuentas de cualquier rol.
export async function crear(req, res) {
  const usuario = await crearCuenta(req.body)
  res.status(201).json(serializarDetalle(usuario))
}

// Campos que el Administrador puede editar desde Usuarios. El rol y el
// estado tienen sus propios endpoints (PATCH /:id/rol y /:id/estado).
const CAMPOS_EDITABLES_ADMIN = ['nombre', 'programa', ...CAMPOS_REGISTRO_INSTITUCIONAL]

// PATCH /usuarios/:id (E2-11): actualiza datos del usuario.
export async function actualizar(req, res) {
  const usuario = await buscarOFallar(req.params.id)

  if ('nombre' in req.body && !String(req.body.nombre || '').trim()) {
    throw new HttpError(400, 'El nombre no puede quedar vacio.')
  }
  if ('correo' in req.body) {
    const correo = String(req.body.correo || '').toLowerCase()
    if (!/^[^\s@]+@uajs\.edu\.co$/i.test(correo)) {
      throw new HttpError(400, 'El correo debe pertenecer al dominio @uajs.edu.co')
    }
    const otro = await Usuario.findOne({ where: { correo } })
    if (otro && otro.id !== usuario.id) {
      throw new HttpError(409, 'Ya existe un usuario con ese correo.', 'DUPLICATE')
    }
    usuario.correo = correo
  }
  for (const campo of CAMPOS_EDITABLES_ADMIN) {
    if (campo in req.body) usuario[campo] = campo === 'nombre' ? req.body.nombre.trim() : req.body[campo] || null
  }
  await usuario.save()
  indexarUsuario(usuario)
  res.json(serializarDetalle(usuario))
}
