import { Evento, Inscripcion } from '../models/index.js'

export async function listar(req, res) {
  const eventos = await Evento.findAll({ order: [['fecha', 'ASC']] })
  const inscripciones = await Inscripcion.findAll({ where: { usuarioId: req.user.id } })
  const inscritoEn = new Set(inscripciones.map((i) => i.eventoId))

  res.json(eventos.map((e) => ({ ...e.toJSON(), inscrito: inscritoEn.has(e.id) })))
}

export async function crear(req, res) {
  const { titulo, fecha, hora, lugar, ponente, descripcion } = req.body
  if (!titulo || !fecha || !hora || !lugar || !ponente) {
    return res.status(400).json({ error: 'titulo, fecha, hora, lugar y ponente son obligatorios.' })
  }
  const evento = await Evento.create({ titulo, fecha, hora, lugar, ponente, descripcion })
  res.status(201).json(evento)
}

export async function inscritos(req, res) {
  const items = await Inscripcion.findAll({ where: { eventoId: req.params.id }, order: [['createdAt', 'ASC']] })
  res.json(items)
}

export async function inscribir(req, res) {
  const evento = await Evento.findByPk(req.params.id)
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' })

  const existente = await Inscripcion.findOne({ where: { eventoId: evento.id, usuarioId: req.user.id } })
  if (existente) {
    return res.status(409).json({ error: 'Ya estas inscrito en este evento.' })
  }

  const inscripcion = await Inscripcion.create({
    eventoId: evento.id,
    usuarioId: req.user.id,
    nombre: req.user.nombre,
    rol: req.user.rol,
  })
  res.status(201).json(inscripcion)
}

export async function eliminar(req, res) {
  const evento = await Evento.findByPk(req.params.id)
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' })

  await Inscripcion.destroy({ where: { eventoId: evento.id } })
  await evento.destroy()

  res.status(204).send()
}
