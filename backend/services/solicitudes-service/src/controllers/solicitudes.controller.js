import { Solicitud, SolicitudHistorial } from '../models/index.js'
import { indexarSolicitud, eliminarDelIndice } from '../utils/busquedaClient.js'

async function siguienteId() {
  // Basado en el maximo id existente (no en el conteo de filas): si alguna
  // vez se elimina una solicitud, contar filas puede volver a calcular un id
  // ya usado por el seed y chocar con la restriccion de llave primaria.
  const ultima = await Solicitud.findOne({ order: [['id', 'DESC']] })
  const ultimoNumero = ultima ? parseInt(ultima.id.split('-')[1], 10) : 300
  return `SOL-${String(ultimoNumero + 1).padStart(4, '0')}`
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
  indexarSolicitud(solicitud)

  res.status(201).json(solicitud)
}

export async function responder(req, res) {
  const solicitud = await Solicitud.findByPk(req.params.id)
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' })

  const { respuesta, adjunto, nuevoEstado } = req.body
  const fecha = hoy()
  const estadoAnterior = solicitud.estado

  solicitud.respuesta = respuesta
  solicitud.adjuntoRespuesta = adjunto || solicitud.adjuntoRespuesta
  solicitud.respondidoPor = req.user.nombre
  solicitud.fechaRespuesta = fecha
  if (nuevoEstado) solicitud.estado = nuevoEstado
  await solicitud.save()

  // Solo se registra en el historial cuando el estado realmente cambia,
  // para no acumular una fila cada vez que se edita la respuesta.
  if (solicitud.estado !== estadoAnterior) {
    await SolicitudHistorial.create({ solicitudId: solicitud.id, estado: solicitud.estado, fecha, por: req.user.nombre })
  }
  indexarSolicitud(solicitud)

  res.json(solicitud)
}

export async function eliminar(req, res) {
  const solicitud = await Solicitud.findByPk(req.params.id)
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' })

  const puedeGestionar = req.user.rol === 'Administrativo' || req.user.rol === 'Administrador del sistema'
  const esDuenio = solicitud.solicitanteId === req.user.id
  if (!puedeGestionar && !(esDuenio && solicitud.estado === 'Registrada')) {
    return res.status(403).json({
      error: 'Solo puedes eliminar tus propias solicitudes mientras esten en estado "Registrada".',
    })
  }

  await SolicitudHistorial.destroy({ where: { solicitudId: solicitud.id } })
  await solicitud.destroy()
  eliminarDelIndice('solicitud', solicitud.id)

  res.status(204).send()
}
