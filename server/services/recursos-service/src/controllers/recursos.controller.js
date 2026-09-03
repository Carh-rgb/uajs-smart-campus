import { Recurso } from '../models/index.js'

async function siguienteCodigo() {
  const total = await Recurso.count()
  return `REC-${String(100 + total + 1).padStart(3, '0')}`
}

export async function listar(req, res) {
  const { tipo } = req.query
  const where = tipo && tipo !== 'Todos' ? { tipo } : {}
  const recursos = await Recurso.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(recursos)
}

export async function crear(req, res) {
  const { nombre, tipo, ubicacion } = req.body
  if (!nombre || !tipo || !ubicacion) {
    return res.status(400).json({ error: 'nombre, tipo y ubicacion son obligatorios.' })
  }

  const codigo = await siguienteCodigo()
  const recurso = await Recurso.create({ codigo, nombre, tipo, ubicacion, estado: 'Disponible' })
  res.status(201).json(recurso)
}

export async function actualizarEstado(req, res) {
  const recurso = await Recurso.findByPk(req.params.codigo)
  if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado.' })

  recurso.estado = req.body.estado
  await recurso.save()
  res.json(recurso)
}
