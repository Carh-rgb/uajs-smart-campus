// Controlador de eventos: CRUD completo, estados e inscripciones con cupo.
import { Op } from 'sequelize'
import { sequelize } from '../config/database.js'
import { Evento, Inscripcion } from '../models/index.js'
import { indexarEvento, eliminarEventoDelIndice } from '../utils/busquedaClient.js'
import { ErrorApi, noEncontrado, conflicto } from '../utils/errores.js'
import { validar, idEntero } from '../utils/validaciones.js'

export const ESTADOS_EVENTO = ['Activo', 'Inactivo', 'Cancelado']

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

async function buscarEvento(idCrudo, user) {
  const id = idEntero(idCrudo, 'El id del evento')
  const evento = await Evento.findByPk(id)
  // Los eventos Inactivos son borradores: solo el personal sabe que existen.
  if (!evento || (evento.estado === 'Inactivo' && user && !puedeAdministrar(user))) throw noEncontrado('Evento')
  return evento
}

// Campos editables de un evento (POST y PUT). Rango horario: si hay hora de
// fin, debe ser posterior a la de inicio.
const REGLAS_EVENTO = {
  titulo: { tipo: 'texto', requerido: true, min: 3, max: 150, etiqueta: 'El titulo' },
  fecha: { tipo: 'fecha', requerido: true, etiqueta: 'La fecha' },
  hora: { tipo: 'hora', requerido: true, etiqueta: 'La hora de inicio' },
  horaFin: { tipo: 'hora', etiqueta: 'La hora de fin' },
  lugar: { tipo: 'texto', requerido: true, max: 120, etiqueta: 'El lugar' },
  ponente: { tipo: 'texto', requerido: true, max: 120, etiqueta: 'El ponente' },
  descripcion: { tipo: 'texto-largo', max: 1000, etiqueta: 'La descripcion' },
  facultad: { tipo: 'texto', requerido: true, max: 120, etiqueta: 'La facultad' },
  cupoMaximo: { tipo: 'entero', min: 1, max: 100000, etiqueta: 'El cupo maximo' },
  estado: { tipo: 'texto', valores: ESTADOS_EVENTO, etiqueta: 'El estado' },
}

function validarEvento(body) {
  const datos = validar(body, REGLAS_EVENTO)
  if (datos.horaFin && datos.horaFin <= datos.hora) {
    throw new ErrorApi(400, 'La hora de fin debe ser posterior a la hora de inicio.', 'RANGO_HORARIO_INVALIDO', [
      { campo: 'horaFin', mensaje: 'Debe ser posterior a la hora de inicio.' },
    ])
  }
  return datos
}

export async function listar(req, res) {
  // El personal administra el catalogo completo (incluye eventos
  // Inactivos, que son borradores aun no publicados). Estudiantes y
  // docentes solo ven lo publicado: Activo o Cancelado (para que sepan
  // que un evento al que ya estaban inscritos se cancelo).
  const where = puedeAdministrar(req.user) ? {} : { estado: ['Activo', 'Cancelado'] }

  // Filtros opcionales: ?estado=Activo&facultad=...&q=texto
  const { estado, facultad, q } = req.query
  if (estado && estado !== 'Todos') {
    where.estado = puedeAdministrar(req.user) || estado !== 'Inactivo' ? String(estado) : 'Activo'
  }
  if (facultad && facultad !== 'Todas') where.facultad = String(facultad)
  if (q) {
    const patron = `%${String(q).slice(0, 100)}%`
    where[Op.or] = [{ titulo: { [Op.iLike]: patron } }, { lugar: { [Op.iLike]: patron } }, { ponente: { [Op.iLike]: patron } }]
  }
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

export async function obtener(req, res) {
  const evento = await buscarEvento(req.params.id, req.user)
  const inscritosCount = await Inscripcion.count({ where: { eventoId: evento.id } })
  const inscrito = (await Inscripcion.count({ where: { eventoId: evento.id, usuarioId: req.user.id } })) > 0
  res.json({ ...evento.toJSON(), inscrito, inscritosCount })
}

export async function crear(req, res) {
  const datos = validarEvento(req.body)
  const evento = await Evento.create({
    ...datos,
    descripcion: datos.descripcion || null,
    horaFin: datos.horaFin || null,
    cupoMaximo: datos.cupoMaximo || null,
    estado: datos.estado || 'Activo',
  })
  indexarEvento(evento)
  res.status(201).json({ ...evento.toJSON(), inscrito: false, inscritosCount: 0 })
}

// PUT /eventos/:id (alias PATCH /eventos/:id) — reemplaza los datos del
// evento; el estado es opcional aqui y tambien tiene su propio endpoint.
// Mismo patron usado en recursos.controller.js.
export async function actualizar(req, res) {
  const evento = await buscarEvento(req.params.id)
  const datos = validarEvento(req.body)

  if (datos.cupoMaximo) {
    const inscritos = await Inscripcion.count({ where: { eventoId: evento.id } })
    if (datos.cupoMaximo < inscritos) {
      throw conflicto(
        `El cupo no puede ser menor que los ${inscritos} inscritos actuales.`,
        'CUPO_INFERIOR_A_INSCRITOS',
        [{ campo: 'cupoMaximo', inscritos }],
      )
    }
  }

  evento.set({
    ...datos,
    descripcion: datos.descripcion || null,
    horaFin: datos.horaFin || null,
    cupoMaximo: datos.cupoMaximo || null,
    estado: datos.estado || evento.estado,
  })
  await evento.save()
  indexarEvento(evento)

  const inscritosCount = await Inscripcion.count({ where: { eventoId: evento.id } })
  res.json({ ...evento.toJSON(), inscritosCount })
}

export async function actualizarEstado(req, res) {
  const evento = await buscarEvento(req.params.id)
  const { estado } = validar(req.body, {
    estado: { tipo: 'texto', requerido: true, valores: ESTADOS_EVENTO, etiqueta: 'El estado' },
  })

  evento.estado = estado
  await evento.save()
  indexarEvento(evento)

  res.json(evento)
}

export async function inscritos(req, res) {
  const evento = await buscarEvento(req.params.id)
  const items = await Inscripcion.findAll({ where: { eventoId: evento.id }, order: [['createdAt', 'ASC']] })
  res.json(items)
}

export async function inscribir(req, res) {
  const id = idEntero(req.params.id, 'El id del evento')

  // La verificacion de cupo y la inscripcion deben ser atomicas: se bloquea
  // la fila del evento (SELECT ... FOR UPDATE) para que dos inscripciones
  // simultaneas no superen el cupo maximo.
  const inscripcion = await sequelize.transaction(async (transaction) => {
    const evento = await Evento.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!evento || (evento.estado === 'Inactivo' && !puedeAdministrar(req.user))) throw noEncontrado('Evento')

    if (evento.estado !== 'Activo') {
      throw conflicto('Este evento no está disponible para inscripciones.', 'EVENTO_NO_DISPONIBLE')
    }

    const existente = await Inscripcion.findOne({ where: { eventoId: evento.id, usuarioId: req.user.id }, transaction })
    if (existente) throw conflicto('Ya estas inscrito en este evento.', 'YA_INSCRITO')

    if (evento.cupoMaximo != null) {
      const totalInscritos = await Inscripcion.count({ where: { eventoId: evento.id }, transaction })
      if (totalInscritos >= evento.cupoMaximo) {
        throw conflicto('Este evento ya alcanzó su cupo máximo de inscritos.', 'CUPO_AGOTADO')
      }
    }

    return Inscripcion.create(
      { eventoId: evento.id, usuarioId: req.user.id, nombre: req.user.nombre, rol: req.user.rol },
      { transaction },
    )
  })

  res.status(201).json(inscripcion)
}

// DELETE /eventos/:id/inscripcion — el usuario cancela SU inscripcion.
export async function cancelarInscripcion(req, res) {
  const id = idEntero(req.params.id, 'El id del evento')
  const inscripcion = await Inscripcion.findOne({ where: { eventoId: id, usuarioId: req.user.id } })
  if (!inscripcion) throw noEncontrado('Inscripcion')
  await inscripcion.destroy()
  res.status(204).send()
}

export async function eliminar(req, res) {
  const evento = await buscarEvento(req.params.id)

  // Regla de integridad: al eliminar un evento tambien se eliminan sus
  // inscripciones (relacion 1:N con ON DELETE CASCADE). Si se quiere
  // conservar el historial, el evento se marca como Cancelado en su lugar.
  await Inscripcion.destroy({ where: { eventoId: evento.id } })
  await evento.destroy()
  eliminarEventoDelIndice(evento.id)

  res.status(204).send()
}
