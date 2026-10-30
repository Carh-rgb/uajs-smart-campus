   // Controlador encargado de gestionar la logica de eventos: creacion, listado y consulta
import { Evento, Inscripcion } from '../models/index.js'
import { indexarEvento, eliminarEventoDelIndice } from '../utils/busquedaClient.js'
import { notificar } from '../utils/notificacionesClient.js'
import { HttpError } from '../middlewares/errores.js'
import { sequelize } from '../config/database.js'

const ESTADOS = ['Activo', 'Inactivo', 'Cancelado']
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const FECHA = /^\d{4}-\d{2}-\d{2}$/

async function buscarOFallar(id) {
  const evento = await Evento.findByPk(id)
  if (!evento) throw new HttpError(404, 'Evento no encontrado.', 'EVENT_NOT_FOUND')
  return evento
}

// E2-30: campos obligatorios, fecha real, horas HH:MM, fin posterior al
// inicio y cupo entero positivo. Devuelve los datos listos para guardar.
function validarEvento(body) {
  const { titulo, fecha, hora, horaFin, lugar, ponente, descripcion, facultad, cupoMaximo } = body
  const obligatorios = { titulo, fecha, hora, horaFin, lugar, ponente, facultad }
  const faltantes = Object.entries(obligatorios).filter(([, v]) => !String(v ?? '').trim()).map(([k]) => k)
  if (faltantes.length) {
    throw new HttpError(400, `Campos obligatorios faltantes: ${faltantes.join(', ')}.`)
  }
  if (!FECHA.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`))) {
    throw new HttpError(400, 'La fecha debe tener el formato AAAA-MM-DD y ser una fecha real.')
  }
  if (!HORA.test(hora) || !HORA.test(horaFin)) {
    throw new HttpError(400, 'Las horas deben tener el formato HH:MM (24 horas).')
  }
  if (horaFin <= hora) {
    throw new HttpError(400, 'La hora de fin debe ser posterior a la hora de inicio.')
  }
  let cupo = null
  if (cupoMaximo !== undefined && cupoMaximo !== null && cupoMaximo !== '') {
    cupo = Number(cupoMaximo)
    if (!Number.isInteger(cupo) || cupo < 1) {
      throw new HttpError(400, 'El cupo maximo debe ser un numero entero mayor que cero.')
    }
  }
  return {
    titulo: titulo.trim(),
    fecha,
    hora,
    horaFin,
    lugar: lugar.trim(),
    ponente: ponente.trim(),
    descripcion: descripcion || null,
    facultad,
    cupoMaximo: cupo,
  }
}
  // Verifica si el usuario tiene permisos administrativos para ver el catalogo completo
function puedeAdministrar(user) {
  return user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'
}
  // Cuenta cuantas inscripciones tiene cada evento
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
  const evento = await Evento.create(validarEvento(req.body))
  indexarEvento(evento)
  res.status(201).json({ ...evento.toJSON(), inscrito: false, inscritosCount: 0 })
}

// GET /eventos/:id (E2-30). Estudiantes y docentes no ven borradores (Inactivo).
export async function obtener(req, res) {
  const evento = await buscarOFallar(req.params.id)
  if (!puedeAdministrar(req.user) && evento.estado === 'Inactivo') {
    throw new HttpError(404, 'Evento no encontrado.', 'EVENT_NOT_FOUND')
  }
  const [inscritosCount, inscripcion] = await Promise.all([
    Inscripcion.count({ where: { eventoId: evento.id } }),
    Inscripcion.findOne({ where: { eventoId: evento.id, usuarioId: req.user.id } }),
  ])
  res.json({ ...evento.toJSON(), inscrito: Boolean(inscripcion), inscritosCount })
}

// Edita los datos del evento (todo menos el estado, que tiene su propio
// endpoint) — mismo patron usado en recursos.controller.js.
export async function actualizar(req, res) {
  await buscarOFallar(req.params.id)
  const datos = validarEvento(req.body)

  // El cupo no puede quedar por debajo de los inscritos actuales. Se bloquea
  // la fila del evento para que una inscripcion simultanea no se cuele entre
  // el conteo y el guardado.
  const evento = await sequelize.transaction(async (transaction) => {
    const actual = await Evento.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!actual) throw new HttpError(404, 'Evento no encontrado.', 'EVENT_NOT_FOUND')
    if (datos.cupoMaximo != null) {
      const inscritosActuales = await Inscripcion.count({ where: { eventoId: actual.id }, transaction })
      if (datos.cupoMaximo < inscritosActuales) {
        throw new HttpError(
          409,
          `El cupo máximo no puede ser menor que los ${inscritosActuales} inscritos actuales.`,
          'CAPACITY_BELOW_ENROLLED',
        )
      }
    }
    Object.assign(actual, datos)
    await actual.save({ transaction })
    return actual
  })
  indexarEvento(evento)

  res.json(evento)
}

export async function actualizarEstado(req, res) {
  const evento = await buscarOFallar(req.params.id)
  if (!ESTADOS.includes(req.body.estado)) {
    throw new HttpError(400, `Estado invalido. Valores permitidos: ${ESTADOS.join(', ')}.`)
  }
  evento.estado = req.body.estado
  await evento.save()
  indexarEvento(evento)

  res.json(evento)
}

export async function inscritos(req, res) {
  await buscarOFallar(req.params.id)
  const items = await Inscripcion.findAll({ where: { eventoId: req.params.id }, order: [['createdAt', 'ASC']] })
  res.json(items)
}

export async function inscribir(req, res) {
  await buscarOFallar(req.params.id)

  // El conteo de inscritos y la insercion deben ser atomicos: si dos
  // peticiones simultaneas leen el mismo conteo antes de que cualquiera
  // inserte, se supera el cupo. Se bloquea la fila del evento (SELECT ... FOR
  // UPDATE) durante la transaccion para serializar las inscripciones.
  const { evento, inscripcion } = await sequelize.transaction(async (transaction) => {
    const actual = await Evento.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!actual) throw new HttpError(404, 'Evento no encontrado.', 'EVENT_NOT_FOUND')

    if (actual.estado !== 'Activo') {
      throw new HttpError(400, 'Este evento no está disponible para inscripciones.')
    }

    const existente = await Inscripcion.findOne({ where: { eventoId: actual.id, usuarioId: req.user.id }, transaction })
    if (existente) {
      throw new HttpError(409, 'Ya estas inscrito en este evento.')
    }

    if (actual.cupoMaximo != null) {
      const totalInscritos = await Inscripcion.count({ where: { eventoId: actual.id }, transaction })
      if (totalInscritos >= actual.cupoMaximo) {
        throw new HttpError(400, 'Este evento ya alcanzó su cupo máximo de inscritos.')
      }
    }

    const nueva = await Inscripcion.create(
      { eventoId: actual.id, usuarioId: req.user.id, nombre: req.user.nombre, rol: req.user.rol },
      { transaction },
    )
    return { evento: actual, inscripcion: nueva }
  })
  // E2-32: la notificacion la genera el servicio, no el frontend.
  notificar({
    usuarioId: req.user.id,
    categoria: 'Eventos',
    titulo: 'Inscripción confirmada',
    mensaje: `Quedaste inscrito en "${evento.titulo}" el ${evento.fecha} a las ${evento.hora}.`,
    entidadRelacionada: 'evento',
    entidadId: String(evento.id),
  })
  res.status(201).json(inscripcion)
}

export async function eliminar(req, res) {
  const evento = await buscarOFallar(req.params.id)

  await Inscripcion.destroy({ where: { eventoId: evento.id } })
  await evento.destroy()
  eliminarEventoDelIndice(evento.id)

  res.status(204).send()
}
