import { Op } from 'sequelize'
import { Recurso, RecursoHistorial } from '../models/index.js'
import { sincronizarEquipoEnReservas, contarReservasActivas } from '../utils/reservasClient.js'
import { indexarRecurso, eliminarRecursoDelIndice } from '../utils/busquedaClient.js'
import { ErrorApi, noEncontrado, conflicto } from '../utils/errores.js'
import { validar, enCatalogo } from '../utils/validaciones.js'

export const TIPOS_RECURSO = ['Audiovisual', 'Equipo de cómputo', 'Mobiliario', 'Instrumento de laboratorio', 'Otro']
export const ESTADOS_RECURSO = ['Disponible', 'En mantenimiento', 'Fuera de servicio']

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

async function buscarRecurso(codigo) {
  const recurso = await Recurso.findByPk(codigo)
  if (!recurso) throw noEncontrado('Recurso')
  return recurso
}

// Campos editables de un recurso (se usan en POST y PUT). El estado tiene su
// propio endpoint por el efecto colateral que tiene sobre el stock reservable,
// pero tambien se acepta aqui y se aplica con la misma logica.
const REGLAS_RECURSO = {
  nombre: { tipo: 'texto', requerido: true, min: 3, max: 100, etiqueta: 'El nombre' },
  tipo: { tipo: 'texto', requerido: true, valores: TIPOS_RECURSO, etiqueta: 'El tipo' },
  ubicacion: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'La ubicacion' },
  descripcion: { tipo: 'texto-largo', max: 500, etiqueta: 'La descripcion' },
  estado: { tipo: 'texto', valores: ESTADOS_RECURSO, etiqueta: 'El estado' },
}

export async function listar(req, res) {
  const { tipo, estado, q } = req.query
  const where = {}
  if (tipo && tipo !== 'Todos') where.tipo = String(tipo)
  if (estado && estado !== 'Todos') where.estado = String(estado)
  if (q) {
    const patron = `%${String(q).slice(0, 100)}%`
    where[Op.or] = [{ codigo: { [Op.iLike]: patron } }, { nombre: { [Op.iLike]: patron } }, { ubicacion: { [Op.iLike]: patron } }]
  }
  const recursos = await Recurso.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(recursos)
}

export async function obtener(req, res) {
  res.json(await buscarRecurso(req.params.codigo))
}

export async function crear(req, res) {
  const datos = validar(req.body, {
    ...REGLAS_RECURSO,
    codigo: { tipo: 'texto', max: 20, etiqueta: 'El codigo' },
  })

  // El codigo lo genera el backend (REC-###); si el cliente envia uno debe
  // tener el formato correcto y no estar repetido.
  let codigo = datos.codigo
  if (codigo) {
    if (!/^REC-\d{3,5}$/.test(codigo)) {
      throw new ErrorApi(400, 'El codigo debe tener el formato REC-001.', 'VALIDACION', [{ campo: 'codigo', mensaje: 'Formato esperado: REC-001.' }])
    }
    if (await Recurso.findByPk(codigo)) {
      throw conflicto(`Ya existe un recurso con el codigo ${codigo}.`, 'CODIGO_DUPLICADO', [{ campo: 'codigo', mensaje: 'Codigo ya registrado.' }])
    }
  } else {
    codigo = await siguienteCodigo()
  }

  const estado = datos.estado || 'Disponible'
  const recurso = await Recurso.create({
    codigo,
    nombre: datos.nombre,
    tipo: datos.tipo,
    ubicacion: datos.ubicacion,
    descripcion: datos.descripcion || null,
    estado,
  })
  await RecursoHistorial.create({ recursoCodigo: codigo, estado, fecha: hoy(), por: req.user.nombre })

  // Un recurso aporta una unidad reservable solo si esta Disponible.
  if (TIPOS_RESERVABLES.includes(datos.tipo)) {
    sincronizarEquipoEnReservas({ codigo, nombre: datos.nombre, tipo: datos.tipo, delta: estado === 'Disponible' ? 1 : 0 })
  }
  indexarRecurso(recurso)

  res.status(201).json(recurso)
}

// Cambia nombre/tipo/ubicacion/descripcion (y opcionalmente el estado).
// PUT y PATCH /:codigo comparten esta logica.
export async function actualizar(req, res) {
  const recurso = await buscarRecurso(req.params.codigo)
  const datos = validar(req.body, REGLAS_RECURSO)

  const nombreAnterior = recurso.nombre
  const tipoAnterior = recurso.tipo
  const cambioDeIdentidad = datos.nombre !== nombreAnterior || datos.tipo !== tipoAnterior

  recurso.nombre = datos.nombre
  recurso.tipo = datos.tipo
  recurso.ubicacion = datos.ubicacion
  recurso.descripcion = datos.descripcion || null
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
    if (TIPOS_RESERVABLES.includes(datos.tipo) && unidadesQueAporta > 0) {
      sincronizarEquipoEnReservas({ codigo: recurso.codigo, nombre: datos.nombre, tipo: datos.tipo, delta: unidadesQueAporta })
    }
  }

  if (datos.estado && datos.estado !== recurso.estado) await aplicarEstado(recurso, datos.estado, req.user)
  indexarRecurso(recurso)

  res.json(recurso)
}

async function aplicarEstado(recurso, nuevoEstado, user) {
  const estadoAnterior = recurso.estado
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
    await RecursoHistorial.create({ recursoCodigo: recurso.codigo, estado: nuevoEstado, fecha: hoy(), por: user.nombre })
  }
}

export async function actualizarEstado(req, res) {
  const recurso = await buscarRecurso(req.params.codigo)
  const { estado } = validar(req.body, { estado: { tipo: 'texto', requerido: true, etiqueta: 'El estado' } })
  enCatalogo(estado, ESTADOS_RECURSO, 'El estado')

  await aplicarEstado(recurso, estado, req.user)
  indexarRecurso(recurso)

  res.json(recurso)
}

export async function historial(req, res) {
  await buscarRecurso(req.params.codigo)
  const items = await RecursoHistorial.findAll({
    where: { recursoCodigo: req.params.codigo },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json(items)
}

export async function eliminar(req, res) {
  const recurso = await buscarRecurso(req.params.codigo)

  // Integridad entre dominios: un equipo reservable no se puede eliminar si
  // hay reservas activas que quedarian sin unidad que las respalde. Si el
  // recurso no esta Disponible no aporta ninguna unidad, asi que se puede
  // eliminar sin afectar reservas.
  if (TIPOS_RESERVABLES.includes(recurso.tipo) && recurso.estado === 'Disponible') {
    const activas = await contarReservasActivas(recurso.nombre)
    if (activas > 0) {
      const otrasUnidades = await Recurso.count({
        where: { nombre: recurso.nombre, tipo: { [Op.in]: TIPOS_RESERVABLES }, estado: 'Disponible', codigo: { [Op.ne]: recurso.codigo } },
      })
      if (activas > otrasUnidades) {
        throw conflicto(
          `No se puede eliminar: "${recurso.nombre}" tiene ${activas} reserva(s) activa(s) y quedarian sin equipo. Cancelalas primero o marca el recurso como fuera de servicio.`,
          'RECURSO_EN_USO',
          [{ campo: 'codigo', reservasActivas: activas, unidadesRestantes: otrasUnidades }],
        )
      }
    }
  }

  await RecursoHistorial.destroy({ where: { recursoCodigo: recurso.codigo } })
  await recurso.destroy()

  if (TIPOS_RESERVABLES.includes(recurso.tipo)) {
    // Solo se descuenta del catalogo reservable si el recurso seguia
    // Disponible (si ya estaba en mantenimiento/fuera de servicio, ese
    // stock ya se habia descontado antes y no hay que volver a tocarlo).
    sincronizarEquipoEnReservas({
      codigo: recurso.codigo,
      nombre: recurso.nombre,
      tipo: recurso.tipo,
      delta: recurso.estado === 'Disponible' ? -1 : 0,
      eliminarSiVacio: true,
    })
  }
  eliminarRecursoDelIndice(recurso.codigo)

  res.status(204).send()
}
