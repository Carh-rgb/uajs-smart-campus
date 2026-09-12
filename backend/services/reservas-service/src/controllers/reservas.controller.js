import { Op } from 'sequelize'
import { Reserva, ReservaHistorial, Equipo } from '../models/index.js'
import { indexarReserva, eliminarReservaDelIndice } from '../utils/busquedaClient.js'

async function siguienteId() {
  // Basado en el maximo id existente, no en el conteo de filas (ver la
  // misma nota en solicitudes.controller.js).
  const ultima = await Reserva.findOne({ order: [['id', 'DESC']] })
  const ultimoNumero = ultima ? parseInt(ultima.id.split('-')[1], 10) : 150
  return `RES-${String(ultimoNumero + 1).padStart(4, '0')}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
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
  const esAdministrativo = req.user.rol === 'Administrativo' || req.user.rol === 'Administrador del sistema'
  const where = esAdministrativo ? { rolSolicitante: { [Op.ne]: 'Administrativo' } } : { solicitanteId: req.user.id }
  const reservas = await Reserva.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(reservas)
}

export async function crear(req, res) {
  const { tipoEspacio, espacio, fecha, horaInicio, horaFin, motivo } = req.body
  if (!tipoEspacio || !espacio || !fecha || !horaInicio || !horaFin || !motivo) {
    return res.status(400).json({ error: 'Todos los campos de la reserva son obligatorios.' })
  }

  const id = await siguienteId()
  const reserva = await Reserva.create({
    id,
    tipoEspacio,
    espacio,
    fecha,
    horaInicio,
    horaFin,
    motivo,
    estado: 'Pendiente',
    solicitanteId: req.user.id,
    solicitanteNombre: req.user.nombre,
    rolSolicitante: req.user.rol,
  })
  await ReservaHistorial.create({ reservaId: id, estado: 'Pendiente', fecha: hoy(), por: req.user.nombre })
  indexarReserva(reserva)

  res.status(201).json(reserva)
}

export async function actualizarEstado(req, res) {
  const reserva = await Reserva.findByPk(req.params.id)
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' })

  const { estado } = req.body
  const estadoAnterior = reserva.estado

  // Al confirmar una reserva de equipo se descuenta una unidad de su
  // stock; si sale de Confirmada (se cancela, deniega, etc.) se repone.
  if (reserva.tipoEspacio === 'equipo' && estado !== estadoAnterior) {
    if (estado === 'Confirmada') {
      const equipo = await Equipo.findOne({ where: { nombre: reserva.espacio } })
      if (equipo && equipo.stock <= 0) {
        return res.status(400).json({ error: 'No hay unidades disponibles de este equipo.' })
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
  }
  indexarReserva(reserva)

  res.json(reserva)
}

export async function historial(req, res) {
  const items = await ReservaHistorial.findAll({ where: { reservaId: req.params.id }, order: [['fecha', 'ASC']] })
  res.json(items)
}

export async function eliminar(req, res) {
  const reserva = await Reserva.findByPk(req.params.id)
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' })

  const puedeGestionar = req.user.rol === 'Administrativo' || req.user.rol === 'Administrador del sistema'
  const esDuenio = reserva.solicitanteId === req.user.id
  if (!puedeGestionar && !(esDuenio && reserva.estado === 'Pendiente')) {
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
