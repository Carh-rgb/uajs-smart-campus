import { Recurso } from '../models/index.js'
import { sincronizarEquipoEnReservas } from '../utils/reservasClient.js'
import { indexarRecurso, eliminarRecursoDelIndice } from '../utils/busquedaClient.js'

// Solo estos tipos de recurso se pueden reservar (ver "Laboratorios y
// equipos" en el modulo de Reservas); mobiliario, instrumentos de
// laboratorio, etc. no tienen contraparte reservable.
const TIPOS_RESERVABLES = ['Audiovisual', 'Equipo de cómputo']

async function siguienteCodigo() {
  // Basado en el maximo codigo existente, no en el conteo de filas (ver la
  // misma nota en solicitudes.controller.js).
  const ultimo = await Recurso.findOne({ order: [['codigo', 'DESC']] })
  const ultimoNumero = ultimo ? parseInt(ultimo.codigo.split('-')[1], 10) : 100
  return `REC-${String(ultimoNumero + 1).padStart(3, '0')}`
}

export async function listar(req, res) {
  const { tipo } = req.query
  const where = tipo && tipo !== 'Todos' ? { tipo } : {}
  const recursos = await Recurso.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(recursos)
}

export async function crear(req, res) {
  const { nombre, tipo, ubicacion } = req.body
  if (!nombre || !tipo || !ubicacion) {
    return res.status(400).json({ error: 'nombre, tipo y ubicacion son obligatorios.' })
  }

  const codigo = await siguienteCodigo()
  const recurso = await Recurso.create({ codigo, nombre, tipo, ubicacion, estado: 'Disponible' })

  if (TIPOS_RESERVABLES.includes(tipo)) {
    sincronizarEquipoEnReservas({ codigo, nombre, tipo, delta: 1 })
  }
  indexarRecurso(recurso)

  res.status(201).json(recurso)
}

export async function actualizarEstado(req, res) {
  const recurso = await Recurso.findByPk(req.params.codigo)
  if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado.' })

  const estadoAnterior = recurso.estado
  const nuevoEstado = req.body.estado
  recurso.estado = nuevoEstado
  await recurso.save()

  // Un recurso en mantenimiento o fuera de servicio no se puede reservar:
  // se descuenta esa unidad del stock reservable (y se repone al volver
  // a estar Disponible). No se elimina el equipo del catalogo: sigue
  // existiendo, solo temporalmente sin unidades libres.
  if (TIPOS_RESERVABLES.includes(recurso.tipo) && nuevoEstado !== estadoAnterior) {
    const eraDisponible = estadoAnterior === 'Disponible'
    const esDisponible = nuevoEstado === 'Disponible'
    if (eraDisponible && !esDisponible) {
      sincronizarEquipoEnReservas({ codigo: recurso.codigo, nombre: recurso.nombre, tipo: recurso.tipo, delta: -1 })
    } else if (!eraDisponible && esDisponible) {
      sincronizarEquipoEnReservas({ codigo: recurso.codigo, nombre: recurso.nombre, tipo: recurso.tipo, delta: 1 })
    }
  }
  indexarRecurso(recurso)

  res.json(recurso)
}

export async function eliminar(req, res) {
  const recurso = await Recurso.findByPk(req.params.codigo)
  if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado.' })

  await recurso.destroy()

  if (TIPOS_RESERVABLES.includes(recurso.tipo)) {
    // Solo se descuenta del catalogo reservable si el recurso seguia
    // Disponible (si ya estaba en mantenimiento/fuera de servicio, ese
    // stock ya se habia descontado antes y no hay que volver a tocarlo).
    if (recurso.estado === 'Disponible') {
      sincronizarEquipoEnReservas({
        codigo: recurso.codigo,
        nombre: recurso.nombre,
        tipo: recurso.tipo,
        delta: -1,
        eliminarSiVacio: true,
      })
    } else {
      sincronizarEquipoEnReservas({
        codigo: recurso.codigo,
        nombre: recurso.nombre,
        tipo: recurso.tipo,
        delta: 0,
        eliminarSiVacio: true,
      })
    }
  }
  eliminarRecursoDelIndice(recurso.codigo)

  res.status(204).send()
}
