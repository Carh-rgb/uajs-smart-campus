import { Solicitud, SolicitudHistorial } from '../models/index.js'

async function siguienteId() {
  const total = await Solicitud.count()
  return `SOL-${String(300 + total + 1).padStart(4, '0')}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export async function listar(req, res) {
  const puedeGestionarTodas = req.user.rol === 'Administrativo' || req.user.rol === 'Administrador del sistema'
  const where = puedeGestionarTodas ? {} : { solicitanteId: req.user.id }
  const solicitudes = await Solicitud.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(solicitudes)
}

export async function obtener(req, res) {
  const solicitud = await Solicitud.findByPk(req.params.id)
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' })

  const historial = await SolicitudHistorial.findAll({
    where: { solicitudId: solicitud.id },
    order: [['fecha', 'ASC']],
  })
  res.json({ ...solicitud.toJSON(), historial })
}

export async function crear(req, res) {
  if (req.user.rol === 'Administrativo') {
    return res.status(403).json({ error: 'El rol Administrativo gestiona solicitudes, no las registra.' })
  }

  const { tipo, dependencia, prioridad, descripcion } = req.body
  if (!tipo || !dependencia || !descripcion) {
    return res.status(400).json({ error: 'tipo, dependencia y descripcion son obligatorios.' })
  }

  const id = await siguienteId()
  const fecha = hoy()
  const solicitud = await Solicitud.create({
    id,
    tipo,
    dependencia,
    fecha,
    prioridad: prioridad || 'Media',
    estado: 'Registrada',
    descripcion,
    asignadoA: 'Sin asignar',
    solicitanteId: req.user.id,
    solicitanteNombre: req.user.nombre,
    rolSolicitante: req.user.rol,
  })
  await SolicitudHistorial.create({ solicitudId: id, estado: 'Registrada', fecha, por: req.user.nombre })

  res.status(201).json(solicitud)
}

export async function responder(req, res) {
  const solicitud = await Solicitud.findByPk(req.params.id)
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' })

  const { respuesta, adjunto, nuevoEstado } = req.body
  const fecha = hoy()

  solicitud.respuesta = respuesta
  solicitud.adjuntoRespuesta = adjunto || solicitud.adjuntoRespuesta
  solicitud.respondidoPor = req.user.nombre
  solicitud.fechaRespuesta = fecha
  if (nuevoEstado) solicitud.estado = nuevoEstado
  await solicitud.save()

  await SolicitudHistorial.create({ solicitudId: solicitud.id, estado: solicitud.estado, fecha, por: req.user.nombre })

  res.json(solicitud)
}
