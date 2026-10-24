import { Op } from 'sequelize'
import { sequelize } from '../config/database.js'
import { Reserva, ReservaHistorial, Equipo, Salon, SalaEspecial, SalaBiblioteca } from '../models/index.js'
import { indexarReserva, eliminarReservaDelIndice } from '../utils/busquedaClient.js'
import { verificarUsuarioActivo } from '../utils/usuariosClient.js'
import { ErrorApi, noEncontrado, prohibido, conflicto } from '../utils/errores.js'
import { validar, validarTransicion } from '../utils/validaciones.js'
import { TIPOS_ESPACIO, ESTADOS_ACTIVOS, TRANSICIONES_RESERVA, esPersonal, hoy, hoyLocal } from '../utils/catalogos.js'

async function siguienteId(transaction) {
  // Basado en el maximo id existente, no en el conteo de filas (ver la
  // misma nota en solicitudes.controller.js).
  const ultima = await Reserva.findOne({ order: [['id', 'DESC']], transaction })
  const ultimoNumero = ultima ? parseInt(ultima.id.split('-')[1], 10) : 150
  return `RES-${String(ultimoNumero + 1).padStart(4, '0')}`
}

async function buscarReserva(id) {
  const reserva = await Reserva.findByPk(id)
  if (!reserva) throw noEncontrado('Reserva')
  return reserva
}

function verificarAcceso(reserva, user) {
  if (!esPersonal(user) && reserva.solicitanteId !== user.id) {
    throw prohibido('No tienes permisos para ver esta reserva.')
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

// Verifica que el espacio (salon, sala especial, sala de biblioteca) o el
// equipo exista en el catalogo de este servicio, que es el dueño de esos
// datos. Devuelve el equipo cuando aplica (se necesita su stock).
async function resolverRecurso(tipoEspacio, nombre) {
  let encontrado
  let equipo = null
  if (tipoEspacio === 'equipo') {
    equipo = await Equipo.findOne({ where: { nombre } })
    encontrado = equipo
  } else {
    const resultados = await Promise.all([Salon, SalaEspecial, SalaBiblioteca].map((M) => M.findOne({ where: { nombre } })))
    encontrado = resultados.find(Boolean)
  }
  if (!encontrado) {
    throw new ErrorApi(
      400,
      `"${nombre}" no existe en el catalogo de ${tipoEspacio === 'equipo' ? 'equipos' : 'espacios'}.`,
      'RECURSO_INEXISTENTE',
      [{ campo: 'espacio', mensaje: 'Recurso inexistente en el catalogo.' }],
    )
  }
  return equipo
}

// Valida y normaliza el cuerpo de una reserva (POST y PUT).
function validarCuerpo(body, { parcial = false } = {}) {
  const datos = validar(body, {
    tipoEspacio: { tipo: 'texto', requerido: !parcial, valores: TIPOS_ESPACIO, etiqueta: 'El tipo de reserva' },
    espacio: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'El espacio o equipo' },
    fecha: { tipo: 'fecha', requerido: true, etiqueta: 'La fecha' },
    horaInicio: { tipo: 'hora', requerido: true, etiqueta: 'La hora de inicio' },
    horaFin: { tipo: 'hora', requerido: true, etiqueta: 'La hora de fin' },
    motivo: { tipo: 'texto', requerido: true, min: 3, max: 200, etiqueta: 'El motivo' },
  })

  if (datos.fecha < hoyLocal()) {
    throw new ErrorApi(400, 'La fecha de la reserva no puede estar en el pasado.', 'FECHA_INVALIDA', [
      { campo: 'fecha', mensaje: 'No se puede reservar en una fecha pasada.' },
    ])
  }
  if (datos.horaFin <= datos.horaInicio) {
    throw new ErrorApi(400, 'La hora de fin debe ser posterior a la hora de inicio.', 'RANGO_HORARIO_INVALIDO', [
      { campo: 'horaFin', mensaje: 'Debe ser posterior a la hora de inicio.' },
    ])
  }
  return datos
}

// Dos reservas se solapan si una empieza antes de que la otra termine y
// termina despues de que la otra empiece (los extremos que se tocan, ej.
// 08:00-10:00 y 10:00-12:00, NO son un solapamiento).
async function buscarSolapadas({ espacio, fecha, horaInicio, horaFin, excluirId, transaction }) {
  const where = {
    espacio,
    fecha,
    estado: { [Op.in]: ESTADOS_ACTIVOS },
    horaInicio: { [Op.lt]: horaFin },
    horaFin: { [Op.gt]: horaInicio },
  }
  if (excluirId) where.id = { [Op.ne]: excluirId }
  return Reserva.findAll({ where, transaction })
}

// Aplica la regla de disponibilidad:
//  - Espacios: no puede haber otra reserva activa del mismo espacio que se
//    cruce en horario (409 RESERVA_SOLAPADA).
//  - Equipos: hay varias unidades; se rechaza si no queda stock o si las
//    reservas activas que se cruzan ya ocupan todas las unidades libres.
async function verificarDisponibilidad(datos, { equipo, excluirId, transaction }) {
  const solapadas = await buscarSolapadas({ ...datos, excluirId, transaction })

  if (datos.tipoEspacio === 'equipo') {
    const pendientesSolapadas = solapadas.filter((r) => r.estado === 'Pendiente').length
    if (equipo.stock <= 0 || pendientesSolapadas >= equipo.stock) {
      throw conflicto(
        `No hay unidades disponibles de "${datos.espacio}" en ese horario.`,
        'SIN_DISPONIBILIDAD',
        solapadas.map((r) => ({ reserva: r.id, horaInicio: r.horaInicio, horaFin: r.horaFin, estado: r.estado })),
      )
    }
    return
  }

  if (solapadas.length > 0) {
    throw conflicto(
      `"${datos.espacio}" ya esta reservado el ${datos.fecha} de ${solapadas[0].horaInicio} a ${solapadas[0].horaFin}. Elige otro horario.`,
      'RESERVA_SOLAPADA',
      solapadas.map((r) => ({ reserva: r.id, horaInicio: r.horaInicio, horaFin: r.horaFin, estado: r.estado })),
    )
  }
}

// El check de solapamiento y la creacion deben ser atomicos: si dos
// peticiones llegan a la vez, ambas podrian pasar el check antes de que
// cualquiera inserte. Un advisory lock de PostgreSQL (se libera solo al
// terminar la transaccion) las serializa.
async function conBloqueoDeReservas(trabajo) {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('reservas-service:escritura'))", { transaction })
    return trabajo(transaction)
  })
}

export async function listar(req, res) {
  // Los roles administrativos ven todas las reservas sin excepcion; el
  // resto, solo las propias (mismo patron que solicitudes.controller.js).
  const where = esPersonal(req.user) ? {} : { solicitanteId: req.user.id }

  // Filtros opcionales: ?estado=Pendiente&fecha=2026-10-30&espacio=Sala S02
  const { estado, fecha, espacio } = req.query
  if (estado && estado !== 'Todos') where.estado = String(estado)
  if (fecha) where.fecha = String(fecha)
  if (espacio) where.espacio = String(espacio)

  const reservas = await Reserva.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(reservas)
}

export async function obtener(req, res) {
  const reserva = await buscarReserva(req.params.id)
  verificarAcceso(reserva, req.user)
  const historial = await ReservaHistorial.findAll({
    where: { reservaId: reserva.id },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json({ ...reserva.toJSON(), historial })
}

// GET /reservas/disponibilidad?espacio=Sala S02&fecha=2026-10-30
// Franjas ocupadas (reservas activas) de un espacio en una fecha, para que
// la interfaz pueda mostrar que horarios estan tomados antes de reservar.
export async function disponibilidad(req, res) {
  const { espacio, fecha } = validar(req.query, {
    espacio: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'El espacio' },
    fecha: { tipo: 'fecha', requerido: true, etiqueta: 'La fecha' },
  })
  const ocupadas = await Reserva.findAll({
    where: { espacio, fecha, estado: { [Op.in]: ESTADOS_ACTIVOS } },
    attributes: ['id', 'horaInicio', 'horaFin', 'estado'],
    order: [['horaInicio', 'ASC']],
  })
  res.json({ espacio, fecha, ocupadas })
}

// GET /reservas/equipos/uso?nombre=Videobeam — cuantas reservas activas (de
// hoy en adelante) tiene un equipo. Lo consulta recursos-service antes de
// eliminar un recurso (integridad entre dominios, sin tocar nuestras tablas).
export async function usoDeEquipo(req, res) {
  const { nombre } = validar(req.query, { nombre: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'El nombre del equipo' } })
  const activas = await Reserva.count({
    where: { tipoEspacio: 'equipo', espacio: nombre, estado: { [Op.in]: ESTADOS_ACTIVOS }, fecha: { [Op.gte]: hoyLocal() } },
  })
  res.json({ nombre, activas })
}

export async function crear(req, res) {
  const datos = validarCuerpo(req.body)

  // Dependencias de otros dominios / catalogo, antes de tocar la base:
  await verificarUsuarioActivo(req.user.id)
  const equipo = await resolverRecurso(datos.tipoEspacio, datos.espacio)

  const reserva = await conBloqueoDeReservas(async (transaction) => {
    await verificarDisponibilidad(datos, { equipo, transaction })

    const id = await siguienteId(transaction)
    const nueva = await Reserva.create(
      {
        id,
        ...datos,
        estado: 'Pendiente',
        solicitanteId: req.user.id,
        solicitanteNombre: req.user.nombre,
        rolSolicitante: req.user.rol,
      },
      { transaction },
    )
    await ReservaHistorial.create({ reservaId: id, estado: 'Pendiente', fecha: hoy(), por: req.user.nombre }, { transaction })
    return nueva
  })

  indexarReserva(reserva)
  res.status(201).json(reserva)
}

// PUT /reservas/:id — modifica fecha, horario, motivo y espacio de una
// reserva (siempre del mismo tipo). El dueño solo mientras este Pendiente;
// el personal mientras este activa. Se vuelve a validar todo, incluido el
// solapamiento (ignorando la propia reserva).
export async function actualizar(req, res) {
  const reserva = await buscarReserva(req.params.id)

  const esDuenio = reserva.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && reserva.estado === 'Pendiente')) {
    throw prohibido('Solo puedes modificar tus propias reservas mientras esten en estado "Pendiente".')
  }
  if (!ESTADOS_ACTIVOS.includes(reserva.estado)) {
    throw conflicto(`Una reserva ${reserva.estado.toLowerCase()} no se puede modificar.`, 'RESERVA_FINALIZADA')
  }

  const datos = validarCuerpo({ ...req.body, tipoEspacio: reserva.tipoEspacio }, { parcial: true })
  if (reserva.tipoEspacio === 'equipo' && reserva.estado === 'Confirmada' && datos.espacio !== reserva.espacio) {
    throw conflicto('No se puede cambiar el equipo de una reserva confirmada: cancelala y crea una nueva.', 'CAMBIO_NO_PERMITIDO')
  }

  const equipo = await resolverRecurso(reserva.tipoEspacio, datos.espacio)

  await conBloqueoDeReservas(async (transaction) => {
    await verificarDisponibilidad({ ...datos, tipoEspacio: reserva.tipoEspacio }, { equipo, excluirId: reserva.id, transaction })
    reserva.set({ espacio: datos.espacio, fecha: datos.fecha, horaInicio: datos.horaInicio, horaFin: datos.horaFin, motivo: datos.motivo })
    await reserva.save({ transaction })
  })

  indexarReserva(reserva)
  res.json(reserva)
}

// Cambia el estado aplicando el ciclo de vida y el efecto sobre el stock.
async function aplicarEstado(reserva, estado, user) {
  const estadoAnterior = reserva.estado
  validarTransicion(TRANSICIONES_RESERVA, estadoAnterior, estado, 'la reserva')

  // Al confirmar una reserva de equipo se descuenta una unidad de su
  // stock; si sale de Confirmada (se cancela, deniega, etc.) se repone.
  if (reserva.tipoEspacio === 'equipo' && estado !== estadoAnterior) {
    if (estado === 'Confirmada') {
      const equipo = await Equipo.findOne({ where: { nombre: reserva.espacio } })
      if (equipo && equipo.stock <= 0) {
        throw conflicto('No hay unidades disponibles de este equipo.', 'SIN_STOCK')
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
    await ReservaHistorial.create({ reservaId: reserva.id, estado, fecha: hoy(), por: user.nombre })
  }
  indexarReserva(reserva)
}

export async function actualizarEstado(req, res) {
  const reserva = await buscarReserva(req.params.id)
  const { estado } = validar(req.body, { estado: { tipo: 'texto', requerido: true, etiqueta: 'El estado' } })
  await aplicarEstado(reserva, estado, req.user)
  res.json(reserva)
}

// PATCH /reservas/:id/cancelar — el solicitante (o el personal) anula una
// reserva activa. Es la "cancelacion" del PDF: queda en estado Cancelada,
// con historial, y libera el horario.
export async function cancelar(req, res) {
  const reserva = await buscarReserva(req.params.id)
  if (!esPersonal(req.user) && reserva.solicitanteId !== req.user.id) {
    throw prohibido('Solo puedes cancelar tus propias reservas.')
  }
  await aplicarEstado(reserva, 'Cancelada', req.user)
  res.json(reserva)
}

export async function historial(req, res) {
  const reserva = await buscarReserva(req.params.id)
  verificarAcceso(reserva, req.user)
  const items = await ReservaHistorial.findAll({
    where: { reservaId: reserva.id },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json(items)
}

export async function eliminar(req, res) {
  const reserva = await buscarReserva(req.params.id)

  const esDuenio = reserva.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && reserva.estado === 'Pendiente')) {
    throw prohibido('Solo puedes eliminar tus propias reservas mientras esten en estado "Pendiente".')
  }

  if (reserva.tipoEspacio === 'equipo' && reserva.estado === 'Confirmada') {
    await ajustarStockEquipo(reserva.espacio, 1)
  }

  await ReservaHistorial.destroy({ where: { reservaId: reserva.id } })
  await reserva.destroy()
  eliminarReservaDelIndice(reserva.id)

  res.status(204).send()
}
