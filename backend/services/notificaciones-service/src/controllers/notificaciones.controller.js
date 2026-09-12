import { Notificacion } from '../models/index.js'

export async function listar(req, res) {
  const notificaciones = await Notificacion.findAll({
    where: { usuarioId: req.user.id },
    order: [['createdAt', 'DESC']],
  })
  res.json(notificaciones)
}

const PUEDE_NOTIFICAR_A_OTROS = ['Administrativo', 'Docente', 'Administrador del sistema']

export async function crear(req, res) {
  // Sin un broker de mensajes (RabbitMQ, listado como "profundizacion" en
  // el PDF) los demas microservicios no llaman a este endpoint entre si;
  // es el propio frontend quien lo invoca tras una accion exitosa. Por eso
  // se permite indicar un usuarioId destino distinto al autenticado, pero
  // solo para roles de personal (un estudiante no puede notificar a otros).
  const { categoria, mensaje, usuarioId } = req.body
  if (!categoria || !mensaje) {
    return res.status(400).json({ error: 'categoria y mensaje son obligatorios.' })
  }

  let destinatarioId = req.user.id
  if (usuarioId && usuarioId !== req.user.id) {
    if (!PUEDE_NOTIFICAR_A_OTROS.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No puedes crear notificaciones para otros usuarios.' })
    }
    destinatarioId = usuarioId
  }

  const notificacion = await Notificacion.create({
    usuarioId: destinatarioId,
    categoria,
    mensaje,
    fecha: new Date().toISOString().slice(0, 10),
    leida: false,
  })
  res.status(201).json(notificacion)
}

export async function marcarLeida(req, res) {
  const notificacion = await Notificacion.findOne({ where: { id: req.params.id, usuarioId: req.user.id } })
  if (!notificacion) return res.status(404).json({ error: 'Notificacion no encontrada.' })

  notificacion.leida = true
  await notificacion.save()
  res.json(notificacion)
}

export async function marcarTodasLeidas(req, res) {
  await Notificacion.update({ leida: true }, { where: { usuarioId: req.user.id, leida: false } })
  res.json({ ok: true })
}

export async function eliminar(req, res) {
  const notificacion = await Notificacion.findOne({ where: { id: req.params.id, usuarioId: req.user.id } })
  if (!notificacion) return res.status(404).json({ error: 'Notificacion no encontrada.' })

  await notificacion.destroy()
  res.status(204).send()
}
