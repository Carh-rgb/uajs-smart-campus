// Controlador encargado de gestionar la logica de notificaciones: creación, listado y envío
import { Notificacion } from '../models/index.js'
import { HttpError } from '../middlewares/errores.js'
import { verificarDestinatario } from '../utils/usuariosClient.js'

export const CATEGORIAS = ['Solicitudes', 'PQRS', 'Reservas', 'Eventos', 'Institucional']

function hoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

// E2-31: titulo, mensaje y categoria obligatorios y categoria valida.
function validarContenido({ categoria, titulo, mensaje }) {
  if (!String(titulo || '').trim() || !String(mensaje || '').trim() || !categoria) {
    throw new HttpError(400, 'categoria, titulo y mensaje son obligatorios.')
  }
  if (!CATEGORIAS.includes(categoria)) {
    throw new HttpError(400, `Categoria invalida. Valores permitidos: ${CATEGORIAS.join(', ')}.`)
  }
}

async function buscarPropiaOFallar(id, usuarioId) {
  const notificacion = await Notificacion.findOne({ where: { id, usuarioId } })
  if (!notificacion) throw new HttpError(404, 'Notificacion no encontrada.', 'NOTIFICATION_NOT_FOUND')
  return notificacion
}

// GET /notificaciones/:id (E2-31): solo el destinatario.
export async function obtener(req, res) {
  res.json(await buscarPropiaOFallar(req.params.id, req.user.id))
}

// POST /notificaciones/interna (E2-31/E2-32): la usan solicitudes, reservas
// y eventos para avisarle a un usuario. Solo con token de servicio.
export async function crearInterna(req, res) {
  const { usuarioId, categoria, titulo, mensaje, entidadRelacionada, entidadId } = req.body
  validarContenido({ categoria, titulo, mensaje })
  if (!Number.isInteger(Number(usuarioId)) || Number(usuarioId) < 1) {
    throw new HttpError(400, 'usuarioId debe ser el id de un usuario.')
  }
  const notificacion = await Notificacion.create({
    usuarioId: Number(usuarioId),
    categoria,
    titulo: titulo.trim(),
    mensaje: mensaje.trim(),
    entidadRelacionada: entidadRelacionada || null,
    entidadId: entidadId ? String(entidadId) : null,
    fecha: hoy(),
    leida: false,
  })
  res.status(201).json(notificacion)
}

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
  const { categoria, titulo, mensaje, usuarioId, entidadRelacionada, entidadId } = req.body
  validarContenido({ categoria, titulo, mensaje })

  let destinatarioId = req.user.id
  if (usuarioId && usuarioId !== req.user.id) {
    if (!PUEDE_NOTIFICAR_A_OTROS.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No puedes crear notificaciones para otros usuarios.' })
    }
    // Guia 7.3: el destinatario debe existir y estar activo (se consulta a
    // usuarios-service; si no responde, 503 y no se crea la notificacion).
    if (!Number.isInteger(Number(usuarioId)) || Number(usuarioId) < 1) {
      throw new HttpError(400, 'usuarioId debe ser el id de un usuario.')
    }
    await verificarDestinatario(Number(usuarioId))
    destinatarioId = Number(usuarioId)
  }

  const notificacion = await Notificacion.create({
    usuarioId: destinatarioId,
    categoria,
    titulo: titulo.trim(),
    mensaje: mensaje.trim(),
    entidadRelacionada: entidadRelacionada || null,
    entidadId: entidadId ? String(entidadId) : null,
    fecha: hoy(),
    leida: false,
  })
  res.status(201).json(notificacion)
}

export async function marcarLeida(req, res) {
  const notificacion = await buscarPropiaOFallar(req.params.id, req.user.id)

  notificacion.leida = true
  await notificacion.save()
  res.json(notificacion)
}

export async function marcarTodasLeidas(req, res) {
  await Notificacion.update({ leida: true }, { where: { usuarioId: req.user.id, leida: false } })
  res.json({ ok: true })
}

export async function eliminar(req, res) {
  const notificacion = await buscarPropiaOFallar(req.params.id, req.user.id)

  await notificacion.destroy()
  res.status(204).send()
}
