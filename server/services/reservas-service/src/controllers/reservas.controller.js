import { Op } from 'sequelize'
import { Reserva, ReservaHistorial } from '../models/index.js'

async function siguienteId() {
  const total = await Reserva.count()
  return `RES-${String(150 + total + 1).padStart(4, '0')}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
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

  res.status(201).json(reserva)
}

export async function actualizarEstado(req, res) {
  const reserva = await Reserva.findByPk(req.params.id)
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada.' })

  const { estado } = req.body
  const estadoAnterior = reserva.estado
  reserva.estado = estado
  await reserva.save()

  // Solo se registra en el historial cuando el estado realmente cambia.
  if (estado !== estadoAnterior) {
    await ReservaHistorial.create({ reservaId: reserva.id, estado, fecha: hoy(), por: req.user.nombre })
  }

  res.json(reserva)
}

export async function historial(req, res) {
  const items = await ReservaHistorial.findAll({ where: { reservaId: req.params.id }, order: [['fecha', 'ASC']] })
  res.json(items)
}
