import { Solicitud, SolicitudHistorial } from '../models/index.js'
import { indexarSolicitud, eliminarDelIndice } from '../utils/busquedaClient.js'
import { HttpError } from '../middlewares/errores.js'
import { notificar } from '../utils/notificacionesClient.js'
import {
  TIPOS_SOLICITUD,
  DEPENDENCIAS,
  PRIORIDADES,
  TRANSICIONES_SOLICITUD,
  ESTADOS_SOLICITUD,
  esPersonal,
} from '../utils/catalogos.js'

async function buscarOFallar(id) {
  const solicitud = await Solicitud.findByPk(id)
  if (!solicitud) throw new HttpError(404, 'Solicitud no encontrada.', 'REQUEST_NOT_FOUND')
  return solicitud
}

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
  const solicitud = await buscarOFallar(req.params.id)
  // E2-13: solo el solicitante o el personal pueden ver el detalle.
  if (!esPersonal(req.user) && solicitud.solicitanteId !== req.user.id) {
    throw new HttpError(403, 'No tienes permiso para ver esta solicitud.')
  }

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
  if (!tipo || !dependencia || !String(descripcion || '').trim()) {
    return res.status(400).json({ error: 'tipo, dependencia y descripcion son obligatorios.' })
  }
  if (!TIPOS_SOLICITUD.includes(tipo)) {
    throw new HttpError(400, `Tipo de solicitud invalido. Valores permitidos: ${TIPOS_SOLICITUD.join(', ')}.`)
  }
  if (!DEPENDENCIAS.includes(dependencia)) {
    throw new HttpError(400, `Dependencia invalida. Valores permitidos: ${DEPENDENCIAS.join(', ')}.`)
  }
  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    throw new HttpError(400, `Prioridad invalida. Valores permitidos: ${PRIORIDADES.join(', ')}.`)
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
    descripcion: descripcion.trim(),
    asignadoA: 'Sin asignar',
    solicitanteId: req.user.id,
    solicitanteNombre: req.user.nombre,
    rolSolicitante: req.user.rol,
  })
  await SolicitudHistorial.create({ solicitudId: id, estado: 'Registrada', fecha, por: req.user.nombre })
  indexarSolicitud(solicitud)
  notificar({
    usuarioId: solicitud.solicitanteId,
    categoria: 'Solicitudes',
    titulo: 'Solicitud registrada',
    mensaje: `Se registró la solicitud ${id} (${tipo}). Te avisaremos cada vez que cambie de estado.`,
    entidadRelacionada: 'solicitud',
    entidadId: id,
  })

  res.status(201).json(solicitud)
}

// E2-12: el estado solo avanza segun TRANSICIONES_SOLICITUD. Si llega un
// salto o un retroceso se responde 409 INVALID_TRANSITION y no se guarda
// nada. Mandar el mismo estado actual solo actualiza la respuesta.
export async function responder(req, res) {
  const solicitud = await buscarOFallar(req.params.id)

  const { respuesta, adjunto, nuevoEstado, asignadoA } = req.body
  const fecha = hoy()
  const estadoAnterior = solicitud.estado

  if (nuevoEstado && nuevoEstado !== estadoAnterior) {
    if (!ESTADOS_SOLICITUD.includes(nuevoEstado)) {
      throw new HttpError(400, `Estado invalido. Valores permitidos: ${ESTADOS_SOLICITUD.join(', ')}.`)
    }
    const permitidos = TRANSICIONES_SOLICITUD[estadoAnterior] || []
    if (!permitidos.includes(nuevoEstado)) {
      throw new HttpError(
        409,
        `No se puede pasar de "${estadoAnterior}" a "${nuevoEstado}". ` +
          (permitidos.length ? `Desde "${estadoAnterior}" solo se permite: ${permitidos.join(', ')}.` : 'La solicitud ya esta cerrada.'),
        'INVALID_TRANSITION',
      )
    }
    if (nuevoEstado === 'Asignada') {
      const responsable = String(asignadoA || '').trim()
      if (!responsable || responsable === 'Sin asignar') {
        throw new HttpError(400, 'Para pasar a "Asignada" hay que indicar el responsable (asignadoA).')
      }
      solicitud.asignadoA = responsable
    }
    solicitud.estado = nuevoEstado
  } else if (asignadoA && String(asignadoA).trim()) {
    solicitud.asignadoA = String(asignadoA).trim()
  }

  if (respuesta !== undefined) solicitud.respuesta = respuesta
  solicitud.adjuntoRespuesta = adjunto || solicitud.adjuntoRespuesta
  solicitud.respondidoPor = req.user.nombre
  solicitud.fechaRespuesta = fecha
  await solicitud.save()

  // Solo se registra en el historial cuando el estado realmente cambia,
  // para no acumular una fila cada vez que se edita la respuesta.
  if (solicitud.estado !== estadoAnterior) {
    await SolicitudHistorial.create({ solicitudId: solicitud.id, estado: solicitud.estado, fecha, por: req.user.nombre })
  }
  indexarSolicitud(solicitud)
  // E2-32: la notificacion al solicitante la genera el servicio.
  notificar({
    usuarioId: solicitud.solicitanteId,
    categoria: 'Solicitudes',
    titulo: solicitud.estado !== estadoAnterior ? `Solicitud ${solicitud.id}: ${solicitud.estado}` : `Solicitud ${solicitud.id} respondida`,
    mensaje:
      solicitud.estado !== estadoAnterior
        ? `Tu solicitud ${solicitud.id} pasó de "${estadoAnterior}" a "${solicitud.estado}".`
        : `Tu solicitud ${solicitud.id} recibió una respuesta.`,
    entidadRelacionada: 'solicitud',
    entidadId: solicitud.id,
  })

  res.json(solicitud)
}

export async function eliminar(req, res) {
  const solicitud = await buscarOFallar(req.params.id)

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
