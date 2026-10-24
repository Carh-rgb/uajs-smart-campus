// Controlador de notificaciones: CRUD, y marcado de lectura.
import { Notificacion } from '../models/index.js'
import { verificarUsuarioActivo } from '../utils/usuariosClient.js'
import { noEncontrado, prohibido } from '../utils/errores.js'
import { validar, idEntero } from '../utils/validaciones.js'

const PUEDE_NOTIFICAR_A_OTROS = ['Administrativo', 'Docente', 'Administrador del sistema']
const hoy = () => new Date().toISOString().slice(0, 10)
const esAdmin = (user) => user.rol === 'Administrador del sistema'

// Una notificacion es del destinatario: solo el la ve (y el Administrador).
async function buscarNotificacion(idCrudo, user) {
  const id = idEntero(idCrudo, 'El id de la notificacion')
  const where = esAdmin(user) ? { id } : { id, usuarioId: user.id }
  const notificacion = await Notificacion.findOne({ where })
  if (!notificacion) throw noEncontrado('Notificacion')
  return notificacion
}

export async function listar(req, res) {
  const where = { usuarioId: req.user.id }
  // Filtros opcionales: ?leida=false&categoria=Reservas
  const { leida, categoria } = req.query
  if (leida === 'true' || leida === 'false') where.leida = leida === 'true'
  if (categoria && categoria !== 'Todas') where.categoria = String(categoria)

  const notificaciones = await Notificacion.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(notificaciones)
}

export async function obtener(req, res) {
  res.json(await buscarNotificacion(req.params.id, req.user))
}

export async function crear(req, res) {
  // Sin un broker de mensajes (RabbitMQ, listado como "profundizacion" en
  // el PDF) los demas microservicios no llaman a este endpoint entre si;
  // es el propio frontend quien lo invoca tras una accion exitosa. Por eso
  // se permite indicar un usuarioId destino distinto al autenticado, pero
  // solo para roles de personal (un estudiante no puede notificar a otros).
  const datos = validar(req.body, {
    categoria: { tipo: 'texto', requerido: true, max: 50, etiqueta: 'La categoria' },
    titulo: { tipo: 'texto', max: 120, etiqueta: 'El titulo' },
    mensaje: { tipo: 'texto', requerido: true, min: 3, max: 255, etiqueta: 'El mensaje' },
    usuarioId: { tipo: 'entero', min: 1, etiqueta: 'El destinatario' },
    entidad: { tipo: 'texto', max: 50, etiqueta: 'La entidad relacionada' },
    entidadId: { tipo: 'texto', max: 50, etiqueta: 'El id de la entidad relacionada' },
  })

  let destinatarioId = req.user.id
  if (datos.usuarioId && datos.usuarioId !== req.user.id) {
    if (!PUEDE_NOTIFICAR_A_OTROS.includes(req.user.rol)) {
      throw prohibido('No puedes crear notificaciones para otros usuarios.')
    }
    // El destinatario debe existir y estar activo (usuarios-service es el
    // dueño de esos datos; si no responde, no se crea la notificacion).
    await verificarUsuarioActivo(datos.usuarioId)
    destinatarioId = datos.usuarioId
  }

  const notificacion = await Notificacion.create({
    usuarioId: destinatarioId,
    categoria: datos.categoria,
    titulo: datos.titulo || datos.categoria,
    mensaje: datos.mensaje,
    entidad: datos.entidad || null,
    entidadId: datos.entidadId || null,
    fecha: hoy(),
    leida: false,
  })
  res.status(201).json(notificacion)
}

// PUT /notificaciones/:id — solo el Administrador corrige el contenido de
// una notificacion (categoria, titulo, mensaje, estado de lectura).
export async function actualizar(req, res) {
  const notificacion = await buscarNotificacion(req.params.id, req.user)
  const datos = validar(req.body, {
    categoria: { tipo: 'texto', requerido: true, max: 50, etiqueta: 'La categoria' },
    titulo: { tipo: 'texto', max: 120, etiqueta: 'El titulo' },
    mensaje: { tipo: 'texto', requerido: true, min: 3, max: 255, etiqueta: 'El mensaje' },
    leida: { tipo: 'booleano', etiqueta: 'El estado de lectura' },
  })
  notificacion.set({
    categoria: datos.categoria,
    titulo: datos.titulo || datos.categoria,
    mensaje: datos.mensaje,
    ...(datos.leida !== undefined && { leida: datos.leida }),
  })
  await notificacion.save()
  res.json(notificacion)
}

// PATCH /notificaciones/:id/leida — marca como leida (idempotente). Con
// cuerpo { "leida": false } la devuelve a no leida.
export async function marcarLeida(req, res) {
  const notificacion = await buscarNotificacion(req.params.id, req.user)
  const { leida } = validar(req.body, { leida: { tipo: 'booleano', etiqueta: 'El estado de lectura' } })
  notificacion.leida = leida !== false
  await notificacion.save()
  res.json(notificacion)
}

export async function marcarTodasLeidas(req, res) {
  const [actualizadas] = await Notificacion.update({ leida: true }, { where: { usuarioId: req.user.id, leida: false } })
  res.json({ ok: true, actualizadas })
}

export async function eliminar(req, res) {
  const notificacion = await buscarNotificacion(req.params.id, req.user)
  await notificacion.destroy()
  res.status(204).send()
}
