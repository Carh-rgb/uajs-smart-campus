import { Usuario } from '../models/index.js'

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
  res.json(serializar(usuario))
}

export async function actualizarRol(req, res) {
  const { rol } = req.body
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })
  usuario.rol = rol
  await usuario.save()
  res.json(serializar(usuario))
}

export async function eliminar(req, res) {
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })

  if (usuario.id === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' })
  }

  await usuario.destroy()
  res.status(204).send()
}
