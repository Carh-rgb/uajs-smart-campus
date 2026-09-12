import { Evento, Inscripcion } from '../models/index.js'
import { indexarEvento, eliminarEventoDelIndice } from '../utils/busquedaClient.js'

function puedeAdministrar(user) {
  return user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'
}

async function conteoInscritos(eventoIds) {
  const inscripciones = await Inscripcion.findAll({ where: { eventoId: eventoIds } })
  const mapa = new Map()
  for (const i of inscripciones) {
    mapa.set(i.eventoId, (mapa.get(i.eventoId) || 0) + 1)
  }
  return mapa
}

export async function listar(req, res) {
  // El personal administra el catalogo completo (incluye eventos
  // Inactivos, que son borradores aun no publicados). Estudiantes y
  // docentes solo ven lo publicado: Activo o Cancelado (para que sepan
  // que un evento al que ya estaban inscritos se cancelo).
  const where = puedeAdministrar(req.user) ? {} : { estado: ['Activo', 'Cancelado'] }
  const eventos = await Evento.findAll({ where, order: [['fecha', 'ASC']] })

  const inscripciones = await Inscripcion.findAll({ where: { usuarioId: req.user.id } })
  const inscritoEn = new Set(inscripciones.map((i) => i.eventoId))
  const conteos = await conteoInscritos(eventos.map((e) => e.id))

  res.json(
    eventos.map((e) => ({
      ...e.toJSON(),
      inscrito: inscritoEn.has(e.id),
      inscritosCount: conteos.get(e.id) || 0,
    })),
  )
}

export async function crear(req, res) {
  const { titulo, fecha, hora, lugar, ponente, descripcion, facultad, cupoMaximo } = req.body
  if (!titulo || !fecha || !hora || !lugar || !ponente || !facultad) {
    return res.status(400).json({ error: 'titulo, fecha, hora, lugar, ponente y facultad son obligatorios.' })
  }
  const evento = await Evento.create({
    titulo,
    fecha,
    hora,
    lugar,
    ponente,
    descripcion,
    facultad,
    cupoMaximo: cupoMaximo || null,
  })
  indexarEvento(evento)
  res.status(201).json({ ...evento.toJSON(), inscrito: false, inscritosCount: 0 })
}

// Edita los datos del evento (todo menos el estado, que tiene su propio
// endpoint) — mismo patron usado en recursos.controller.js.
export async function actualizar(req, res) {
  const evento = await Evento.findByPk(req.params.id)
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' })

  const { titulo, fecha, hora, lugar, ponente, descripcion, facultad, cupoMaximo } = req.body
  if (!titulo || !fecha || !hora || !lugar || !ponente || !facultad) {
    return res.status(400).json({ error: 'titulo, fecha, hora, lugar, ponente y facultad son obligatorios.' })
  }

  evento.titulo = titulo
  evento.fecha = fecha
  evento.hora = hora
  evento.lugar = lugar
  evento.ponente = ponente
  evento.descripcion = descripcion
  evento.facultad = facultad
  evento.cupoMaximo = cupoMaximo || null
  await evento.save()
  indexarEvento(evento)

  res.json(evento)
}

export async function actualizarEstado(req, res) {
  const evento = await Evento.findByPk(req.params.id)
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' })

  evento.estado = req.body.estado
  await evento.save()
  indexarEvento(evento)

  res.json(evento)
}

export async function inscritos(req, res) {
  const items = await Inscripcion.findAll({ where: { eventoId: req.params.id }, order: [['createdAt', 'ASC']] })
  res.json(items)
}

export async function inscribir(req, res) {
  const evento = await Evento.findByPk(req.params.id)
  if (!evento) return res.status(404).json({ error: 'Evento no encontrado.' })

  if (evento.estado !== 'Activo') {
    return res.status(400).json({ error: 'Este evento no está disponible para inscripciones.' })
  }

  const existente = await Inscripcion.findOne({ where: { eventoId: evento.id, usuarioId: req.user.id } })
  if (existente) {
    return res.status(409).json({ error: 'Ya estas inscrito en este evento.' })
  }

  if (evento.cupoMaximo != null) {
    const totalInscritos = await Inscripcion.count({ where: { eventoId: evento.id } })
    if (totalInscritos >= evento.cupoMaximo) {
      return res.status(400).json({ error: 'Este evento ya alcanzó su cupo máximo de inscritos.' })
    }
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
  eliminarEventoDelIndice(evento.id)

  res.status(204).send()
}
