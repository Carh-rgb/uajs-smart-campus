import { Op } from 'sequelize'
import { Reserva, ReservaHistorial, Equipo, Salon, SalaEspecial, SalaBiblioteca } from '../models/index.js'
import { indexarReserva, eliminarReservaDelIndice } from '../utils/busquedaClient.js'
import { unidadesDisponibles } from '../utils/recursosClient.js'
import { HttpError } from '../middlewares/errores.js'
import { sequelize } from '../config/database.js'
import { verificarUsuarioActivo } from '../utils/usuariosClient.js'
import { notificar } from '../utils/notificacionesClient.js'

// Estados de una reserva y a cuales puede pasar cada uno (E2-20/E2-22).
// Denegada y Cancelada son finales: una reserva cancelada no se reactiva,
// se crea una nueva.
const TRANSICIONES = {
  Pendiente: ['Confirmada', 'Denegada', 'Cancelada'],
  Confirmada: ['Cancelada'],
  Denegada: [],
  Cancelada: [],
}
const ESTADOS = Object.keys(TRANSICIONES)
// Estados que ocupan el espacio en su franja horaria.
const ESTADOS_ACTIVOS = ['Pendiente', 'Confirmada']
const TIPOS_ESPACIO = ['espacio', 'equipo']

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const FECHA = /^\d{4}-\d{2}-\d{2}$/

async function siguienteId(transaction) {
  // Basado en el maximo id existente, no en el conteo de filas (ver la
  // misma nota en solicitudes.controller.js).
  const ultima = await Reserva.findOne({ order: [['id', 'DESC']], transaction })
  const ultimoNumero = ultima ? parseInt(ultima.id.split('-')[1], 10) : 150
  return `RES-${String(ultimoNumero + 1).padStart(4, '0')}`
}

// Fecha de hoy en Colombia (el servidor puede estar en UTC: despues de las
// 7 p.m. de Bogota, la fecha UTC ya es la del dia siguiente).
function hoy() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

function esPersonal(user) {
  return user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'
}

async function buscarOFallar(id) {
  const reserva = await Reserva.findByPk(id)
  if (!reserva) throw new HttpError(404, 'Reserva no encontrada.', 'RESERVATION_NOT_FOUND')
  return reserva
}

// E2-20: formato y coherencia de fecha y horas. Lanza 400 si algo falla.
function validarFranja({ fecha, horaInicio, horaFin }) {
  if (!FECHA.test(fecha || '') || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`))) {
    throw new HttpError(400, 'La fecha debe tener el formato AAAA-MM-DD y ser una fecha real.')
  }
  if (!HORA.test(horaInicio || '') || !HORA.test(horaFin || '')) {
    throw new HttpError(400, 'Las horas deben tener el formato HH:MM (24 horas).')
  }
  if (fecha < hoy()) {
    throw new HttpError(400, 'No se pueden hacer reservas en fechas pasadas.')
  }
  if (horaFin <= horaInicio) {
    throw new HttpError(400, 'La hora de fin debe ser posterior a la hora de inicio.')
  }
}

// E2-21: el espacio o equipo debe existir. Para equipos ademas se consulta a
// recursos-service cuantas unidades estan Disponibles (bloqueante: 503 si no
// responde).
async function validarEspacio(tipoEspacio, espacio) {
  if (!TIPOS_ESPACIO.includes(tipoEspacio)) {
    throw new HttpError(400, `tipoEspacio invalido. Valores permitidos: ${TIPOS_ESPACIO.join(', ')}.`)
  }
  if (tipoEspacio === 'espacio') {
    const [salon, sala, biblioteca] = await Promise.all([
      Salon.findOne({ where: { nombre: espacio } }),
      SalaEspecial.findOne({ where: { nombre: espacio } }),
      SalaBiblioteca.findOne({ where: { nombre: espacio } }),
    ])
    if (!salon && !sala && !biblioteca) {
      throw new HttpError(400, `El espacio "${espacio}" no existe en el catalogo de reservas.`, 'SPACE_NOT_FOUND')
    }
    return
  }
  const equipo = await Equipo.findOne({ where: { nombre: espacio } })
  if (!equipo) {
    throw new HttpError(400, `El equipo "${espacio}" no existe en el catalogo de reservas.`, 'SPACE_NOT_FOUND')
  }
  const disponibles = await unidadesDisponibles(espacio)
  if (disponibles === 0) {
    throw new HttpError(409, `No hay unidades disponibles de "${espacio}" en este momento.`, 'NO_UNITS_AVAILABLE')
  }
}

// E2-20: un espacio no puede tener dos reservas activas (Pendiente o
// Confirmada) que se crucen en la misma fecha. Los equipos no usan esta
// regla porque tienen varias unidades: los controla el stock.
// La verificacion de solapamiento y la escritura deben ser atomicas: si dos
// peticiones simultaneas pasan la verificacion antes de que cualquiera
// inserte, se crearian dos reservas cruzadas. Un advisory lock de PostgreSQL
// (se libera solo al terminar la transaccion) las serializa.
function conBloqueoDeReservas(trabajo) {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('reservas-service:escritura'))", { transaction })
    return trabajo(transaction)
  })
}

async function validarSolapamiento({ tipoEspacio, espacio, fecha, horaInicio, horaFin, excluirId, transaction }) {
  if (tipoEspacio !== 'espacio') return
  const where = {
    espacio,
    fecha,
    estado: ESTADOS_ACTIVOS,
    horaInicio: { [Op.lt]: horaFin },
    horaFin: { [Op.gt]: horaInicio },
  }
  if (excluirId) where.id = { [Op.ne]: excluirId }
  const choque = await Reserva.findOne({ where, transaction })
  if (choque) {
    throw new HttpError(
      409,
      `${espacio} ya está reservado el ${fecha} de ${choque.horaInicio} a ${choque.horaFin} (reserva ${choque.id}). Elige otra franja u otro espacio.`,
      'RESERVATION_CONFLICT',
    )
  }
}

// Descuenta (delta -1) o repone (delta +1) una unidad del stock del
// equipo cuando una reserva de tipo "equipo" entra o sale del estado
// Confirmada. Las reservas de espacios (salones, salas) no tienen stock.
async function ajustarStockEquipo(nombreEquipo, delta) {
  const equipo = await Equipo.findOne({ where: { nombre: nombreEquipo } })
  if (!equipo) return
  equipo.stock = Math.max(0, equipo.stock + delta)
  await equipo.save()
}

export async function listar(req, res) {
  // Los roles administrativos ven todas las reservas; los demas, las suyas.
  const where = esPersonal(req.user) ? {} : { solicitanteId: req.user.id }
  const reservas = await Reserva.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(reservas)
}

// GET /reservas/:id (E2-22): el solicitante o el personal.
export async function obtener(req, res) {
  const reserva = await buscarOFallar(req.params.id)
  if (!esPersonal(req.user) && reserva.solicitanteId !== req.user.id) {
    throw new HttpError(403, 'No tienes permiso para ver esta reserva.')
  }
  res.json(reserva)
}

export async function crear(req, res) {
  const { tipoEspacio, espacio, fecha, horaInicio, horaFin, motivo } = req.body
  if (!tipoEspacio || !espacio || !fecha || !horaInicio || !horaFin || !String(motivo || '').trim()) {
    return res.status(400).json({ error: 'Todos los campos de la reserva son obligatorios.' })
  }
  validarFranja({ fecha, horaInicio, horaFin })
  await verificarUsuarioActivo(req.user.id)
  await validarEspacio(tipoEspacio, espacio)

  const reserva = await conBloqueoDeReservas(async (transaction) => {
    await validarSolapamiento({ tipoEspacio, espacio, fecha, horaInicio, horaFin, transaction })
    const id = await siguienteId(transaction)
    const nueva = await Reserva.create(
      {
        id,
        tipoEspacio,
        espacio,
        fecha,
        horaInicio,
        horaFin,
        motivo: motivo.trim(),
        estado: 'Pendiente',
        solicitanteId: req.user.id,
        solicitanteNombre: req.user.nombre,
        rolSolicitante: req.user.rol,
      },
      { transaction },
    )
    await ReservaHistorial.create(
      { reservaId: id, estado: 'Pendiente', fecha: hoy(), por: req.user.nombre },
      { transaction },
    )
    return nueva
  })
  const id = reserva.id
  indexarReserva(reserva)
  notificar({
    usuarioId: reserva.solicitanteId,
    categoria: 'Reservas',
    titulo: 'Reserva registrada',
    mensaje: `Se registró la reserva ${id} para ${espacio} el ${fecha} de ${horaInicio} a ${horaFin}. Queda pendiente de confirmación.`,
    entidadRelacionada: 'reserva',
    entidadId: id,
  })

  res.status(201).json(reserva)
}

// PATCH /reservas/:id (E2-22): cambiar fecha, horas o motivo mientras la
// reserva siga Pendiente, revalidando la franja y el solapamiento.
export async function actualizar(req, res) {
  const reserva = await buscarOFallar(req.params.id)
  if (!esPersonal(req.user) && reserva.solicitanteId !== req.user.id) {
    throw new HttpError(403, 'Solo puedes modificar tus propias reservas.')
  }
  if (reserva.estado !== 'Pendiente') {
    throw new HttpError(409, `Solo se pueden modificar reservas Pendientes (esta está ${reserva.estado}).`, 'INVALID_STATE')
  }

  const fecha = req.body.fecha ?? reserva.fecha
  const horaInicio = req.body.horaInicio ?? reserva.horaInicio
  const horaFin = req.body.horaFin ?? reserva.horaFin
  const motivo = req.body.motivo ?? reserva.motivo
  if (!String(motivo || '').trim()) {
    throw new HttpError(400, 'El motivo no puede quedar vacío.')
  }
  validarFranja({ fecha, horaInicio, horaFin })
  await conBloqueoDeReservas(async (transaction) => {
    await validarSolapamiento({
      tipoEspacio: reserva.tipoEspacio,
      espacio: reserva.espacio,
      fecha,
      horaInicio,
      horaFin,
      excluirId: reserva.id,
      transaction,
    })
    Object.assign(reserva, { fecha, horaInicio, horaFin, motivo: motivo.trim() })
    await reserva.save({ transaction })
  })
  indexarReserva(reserva)
  res.json(reserva)
}

export async function actualizarEstado(req, res) {
  const reserva = await buscarOFallar(req.params.id)

  const { estado } = req.body
  const estadoAnterior = reserva.estado
  if (!ESTADOS.includes(estado)) {
    throw new HttpError(400, `Estado invalido. Valores permitidos: ${ESTADOS.join(', ')}.`)
  }
  if (estado !== estadoAnterior && !TRANSICIONES[estadoAnterior].includes(estado)) {
    throw new HttpError(
      409,
      `No se puede pasar una reserva de "${estadoAnterior}" a "${estado}".`,
      'INVALID_TRANSITION',
    )
  }

  if (estado === 'Confirmada' && estado !== estadoAnterior) {
    // Se revisa de nuevo al confirmar por si hay datos anteriores a la regla.
    await validarSolapamiento({
      tipoEspacio: reserva.tipoEspacio,
      espacio: reserva.espacio,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      excluirId: reserva.id,
    })
  }

  // Al confirmar una reserva de equipo se descuenta una unidad de su
  // stock; si sale de Confirmada (se cancela) se repone.
  if (reserva.tipoEspacio === 'equipo' && estado !== estadoAnterior) {
    if (estado === 'Confirmada') {
      const equipo = await Equipo.findOne({ where: { nombre: reserva.espacio } })
      if (equipo && equipo.stock <= 0) {
        throw new HttpError(409, 'No hay unidades disponibles de este equipo.', 'NO_UNITS_AVAILABLE')
      }
      await ajustarStockEquipo(reserva.espacio, -1)
    } else if (estadoAnterior === 'Confirmada') {
      await ajustarStockEquipo(reserva.espacio, 1)
    }
  }

  reserva.estado = estado
  await reserva.save()

  // Solo se registra en el historial cuando el estado realmente cambia.
  if (estado !== estadoAnterior) {
    await ReservaHistorial.create({ reservaId: reserva.id, estado, fecha: hoy(), por: req.user.nombre })
    // E2-32: la notificacion al solicitante la genera el servicio.
    notificar({
      usuarioId: reserva.solicitanteId,
      categoria: 'Reservas',
      titulo: `Reserva ${reserva.id}: ${estado}`,
      mensaje: `Tu reserva ${reserva.id} de ${reserva.espacio} (${reserva.fecha}, ${reserva.horaInicio}-${reserva.horaFin}) quedó ${estado.toLowerCase()}.`,
      entidadRelacionada: 'reserva',
      entidadId: reserva.id,
    })
  }
  indexarReserva(reserva)

  res.json(reserva)
}

export async function historial(req, res) {
  const reserva = await buscarOFallar(req.params.id)
  if (!esPersonal(req.user) && reserva.solicitanteId !== req.user.id) {
    throw new HttpError(403, 'No tienes permiso para ver el historial de esta reserva.')
  }
  const items = await ReservaHistorial.findAll({ where: { reservaId: reserva.id }, order: [['fecha', 'ASC']] })
  res.json(items)
}

export async function eliminar(req, res) {
  const reserva = await buscarOFallar(req.params.id)

  const esDuenio = reserva.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && reserva.estado === 'Pendiente')) {
    return res.status(403).json({
      error: 'Solo puedes eliminar tus propias reservas mientras esten en estado "Pendiente".',
    })
  }

  if (reserva.tipoEspacio === 'equipo' && reserva.estado === 'Confirmada') {
    await ajustarStockEquipo(reserva.espacio, 1)
  }

  await ReservaHistorial.destroy({ where: { reservaId: reserva.id } })
  await reserva.destroy()
  eliminarReservaDelIndice(reserva.id)

  res.status(204).send()
}
