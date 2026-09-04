import { Pqrs, PqrsHistorial } from '../models/index.js'

async function siguienteId() {
  const total = await Pqrs.count()
  return `PQRS-${String(1100 + total + 1).padStart(4, '0')}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function puedeGestionar(user) {
  return user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'
}

export async function listar(req, res) {
  let where = {}
  if (req.user.rol === 'Estudiante') where = { solicitanteId: req.user.id }
  else if (req.user.rol === 'Docente') where = { asignadoA: req.user.nombre }
  // Administrativo / Administrador del sistema ven todas.

  const pqrs = await Pqrs.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(pqrs)
}

export async function crear(req, res) {
  const { tipo, dirigidoA, asunto, descripcion, adjunto } = req.body
  if (!tipo || !dirigidoA || !asunto || !descripcion) {
    return res.status(400).json({ error: 'tipo, dirigidoA, asunto y descripcion son obligatorios.' })
  }

  const id = await siguienteId()
  const fecha = hoy()
  const nueva = await Pqrs.create({
    id,
    tipo,
    dirigidoA,
    asunto,
    descripcion,
    adjunto: adjunto || null,
    estado: 'Registrada',
    solicitanteId: req.user.id,
    solicitante: req.user.nombre,
    rolSolicitante: req.user.rol,
    asignadoA: 'Sin asignar',
    fecha,
  })
  await PqrsHistorial.create({ pqrsId: id, estado: 'Registrada', fecha, por: req.user.nombre })

  res.status(201).json(nueva)
}

export async function responder(req, res) {
  const pqrs = await Pqrs.findByPk(req.params.id)
  if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada.' })

  const esResponsableAsignado = req.user.rol === 'Docente' && pqrs.asignadoA === req.user.nombre
  if (!puedeGestionar(req.user) && !esResponsableAsignado) {
    return res.status(403).json({ error: 'No tienes permisos para responder esta PQRS.' })
  }

  const { respuesta, adjunto, estado } = req.body
  const fecha = hoy()
  const estadoAnterior = pqrs.estado

  pqrs.respuesta = respuesta
  pqrs.adjuntoRespuesta = adjunto || pqrs.adjuntoRespuesta
  pqrs.respondidoPor = req.user.nombre
  pqrs.estado = estado || 'Resuelta'
  await pqrs.save()

  // Solo se registra en el historial cuando el estado realmente cambia,
  // para no acumular una fila cada vez que se edita la respuesta.
  if (pqrs.estado !== estadoAnterior) {
    await PqrsHistorial.create({ pqrsId: pqrs.id, estado: pqrs.estado, fecha, por: req.user.nombre })
  }

  res.json(pqrs)
}

export async function asignar(req, res) {
  if (!puedeGestionar(req.user)) {
    return res.status(403).json({ error: 'No tienes permisos para asignar PQRS.' })
  }

  const pqrs = await Pqrs.findByPk(req.params.id)
  if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada.' })

  const { asignadoA } = req.body
  const fecha = hoy()
  const estadoAnterior = pqrs.estado
  pqrs.asignadoA = asignadoA
  pqrs.estado = asignadoA === 'Sin asignar' ? pqrs.estado : 'En gestión'
  await pqrs.save()

  if (pqrs.estado !== estadoAnterior) {
    await PqrsHistorial.create({ pqrsId: pqrs.id, estado: pqrs.estado, fecha, por: req.user.nombre })
  }

  res.json(pqrs)
}

export async function historial(req, res) {
  const items = await PqrsHistorial.findAll({ where: { pqrsId: req.params.id }, order: [['fecha', 'ASC']] })
  res.json(items)
}

export async function eliminar(req, res) {
  const pqrs = await Pqrs.findByPk(req.params.id)
  if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada.' })

  const esDuenio = pqrs.solicitanteId === req.user.id
  if (!puedeGestionar(req.user) && !(esDuenio && pqrs.estado === 'Registrada')) {
    return res.status(403).json({
      error: 'Solo puedes eliminar tus propias PQRS mientras esten en estado "Registrada".',
    })
  }

  await PqrsHistorial.destroy({ where: { pqrsId: pqrs.id } })
  await pqrs.destroy()

  res.status(204).send()
}
