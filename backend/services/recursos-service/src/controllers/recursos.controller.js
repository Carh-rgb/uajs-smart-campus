import { Recurso, RecursoHistorial } from '../models/index.js'
import { sincronizarEquipoEnReservas } from '../utils/reservasClient.js'
import { indexarRecurso, eliminarRecursoDelIndice } from '../utils/busquedaClient.js'

// Solo estos tipos de recurso se pueden reservar (ver "Laboratorios y
// equipos" en el modulo de Reservas); mobiliario, instrumentos de
// laboratorio, etc. no tienen contraparte reservable.
const TIPOS_RESERVABLES = ['Audiovisual', 'Equipo de cómputo']

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

async function siguienteCodigo() {
  // Basado en el maximo codigo existente, no en el conteo de filas (ver la
  // misma nota en solicitudes.controller.js).
  const ultimo = await Recurso.findOne({ order: [['codigo', 'DESC']] })
  const ultimoNumero = ultimo ? parseInt(ultimo.codigo.split('-')[1], 10) : 100
  return `REC-${String(ultimoNumero + 1).padStart(3, '0')}`
}

export async function listar(req, res) {
  const { tipo, estado } = req.query
  const where = {}
  if (tipo && tipo !== 'Todos') where.tipo = tipo
  if (estado && estado !== 'Todos') where.estado = estado
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
  await RecursoHistorial.create({ recursoCodigo: codigo, estado: 'Disponible', fecha: hoy(), por: req.user.nombre })

  if (TIPOS_RESERVABLES.includes(tipo)) {
    sincronizarEquipoEnReservas({ codigo, nombre, tipo, delta: 1 })
  }
  indexarRecurso(recurso)

  res.status(201).json(recurso)
}

// Edita nombre/tipo/ubicacion (todo menos el estado, que tiene su propio
// endpoint por el efecto colateral que tiene sobre el stock reservable).
export async function actualizar(req, res) {
  const recurso = await Recurso.findByPk(req.params.codigo)
  if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado.' })

  const { nombre, tipo, ubicacion } = req.body
  if (!nombre || !tipo || !ubicacion) {
    return res.status(400).json({ error: 'nombre, tipo y ubicacion son obligatorios.' })
  }

  const nombreAnterior = recurso.nombre
  const tipoAnterior = recurso.tipo
  const cambioDeIdentidad = nombre !== nombreAnterior || tipo !== tipoAnterior

  recurso.nombre = nombre
  recurso.tipo = tipo
  recurso.ubicacion = ubicacion
  await recurso.save()

  // El catalogo de equipos reservables en reservas-service agrupa el stock
  // por nombre (ver catalogo.controller.js alla). Si este recurso estaba
  // aportando una unidad y cambia de nombre o tipo, hay que mover esa
  // unidad del equipo viejo al nuevo para no desincronizar el stock.
  //
  // Esto debe correr aunque el recurso NO este Disponible: si solo se
  // sincronizara en ese caso, renombrar un recurso en mantenimiento deja
  // el nombre viejo huerfano para siempre en reservas-service (con 0
  // unidades, sin nada que despues lo limpie ni lo renombre). Lo que si
  // depende del estado es cuanto stock se mueve (0 si no esta Disponible,
  // porque este recurso no estaba aportando ninguna unidad real).
  if (cambioDeIdentidad) {
    const unidadesQueAporta = recurso.estado === 'Disponible' ? 1 : 0
    if (TIPOS_RESERVABLES.includes(tipoAnterior)) {
      sincronizarEquipoEnReservas({
        codigo: recurso.codigo,
        nombre: nombreAnterior,
        tipo: tipoAnterior,
        delta: -unidadesQueAporta,
        eliminarSiVacio: true,
      })
    }
    if (TIPOS_RESERVABLES.includes(tipo) && unidadesQueAporta > 0) {
      sincronizarEquipoEnReservas({ codigo: recurso.codigo, nombre, tipo, delta: unidadesQueAporta })
    }
  }
  indexarRecurso(recurso)

  res.json(recurso)
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

  if (nuevoEstado !== estadoAnterior) {
    await RecursoHistorial.create({ recursoCodigo: recurso.codigo, estado: nuevoEstado, fecha: hoy(), por: req.user.nombre })
  }
  indexarRecurso(recurso)

  res.json(recurso)
}

export async function historial(req, res) {
  const items = await RecursoHistorial.findAll({ where: { recursoCodigo: req.params.codigo }, order: [['fecha', 'ASC']] })
  res.json(items)
}

export async function eliminar(req, res) {
  const recurso = await Recurso.findByPk(req.params.codigo)
  if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado.' })

  await recurso.destroy()
  await RecursoHistorial.destroy({ where: { recursoCodigo: recurso.codigo } })

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
