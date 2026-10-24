import { Op } from 'sequelize'
import { Solicitud, SolicitudHistorial } from '../models/index.js'
import { indexarSolicitud, eliminarDelIndice } from '../utils/busquedaClient.js'
import { validarResponsable } from '../utils/usuariosClient.js'
import { ErrorApi, noEncontrado, prohibido, conflicto } from '../utils/errores.js'
import { validar, validarTransicion } from '../utils/validaciones.js'
import { PRIORIDADES, TRANSICIONES_SOLICITUD, SIN_ASIGNAR, esPersonal, hoy } from '../utils/catalogos.js'

async function siguienteId() {
  // Basado en el maximo id existente (no en el conteo de filas): si alguna
  // vez se elimina una solicitud, contar filas puede volver a calcular un id
  // ya usado por el seed y chocar con la restriccion de llave primaria.
  const ultima = await Solicitud.findOne({ order: [['id', 'DESC']] })
  const ultimoNumero = ultima ? parseInt(ultima.id.split('-')[1], 10) : 300
  return `SOL-${String(ultimoNumero + 1).padStart(4, '0')}`
}

async function buscarSolicitud(id) {
  const solicitud = await Solicitud.findByPk(id)
  if (!solicitud) throw noEncontrado('Solicitud')
  return solicitud
}

// Un solicitante solo ve sus propias solicitudes; el personal ve todas.
function verificarAcceso(solicitud, user) {
  if (!esPersonal(user) && solicitud.solicitanteId !== user.id) {
    throw prohibido('No tienes permisos para ver esta solicitud.')
  }
}

export async function listar(req, res) {
  const where = esPersonal(req.user) ? {} : { solicitanteId: req.user.id }

  // Filtros opcionales: ?estado=Asignada&prioridad=Alta&q=certificado
  const { estado, prioridad, q } = req.query
  if (estado && estado !== 'Todos') where.estado = String(estado)
  if (prioridad && prioridad !== 'Todos') where.prioridad = String(prioridad)
  if (q) {
    const patron = `%${String(q).slice(0, 100)}%`
    where[Op.or] = [{ id: { [Op.iLike]: patron } }, { tipo: { [Op.iLike]: patron } }, { descripcion: { [Op.iLike]: patron } }]
  }

  const solicitudes = await Solicitud.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(solicitudes)
}

export async function obtener(req, res) {
  const solicitud = await buscarSolicitud(req.params.id)
  verificarAcceso(solicitud, req.user)

  const historial = await SolicitudHistorial.findAll({
    where: { solicitudId: solicitud.id },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json({ ...solicitud.toJSON(), historial })
}

export async function historial(req, res) {
  const solicitud = await buscarSolicitud(req.params.id)
  verificarAcceso(solicitud, req.user)

  const items = await SolicitudHistorial.findAll({
    where: { solicitudId: solicitud.id },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json(items)
}

// Reglas de los campos editables de una solicitud (se usan en POST y PUT).
const REGLAS_SOLICITUD = {
  tipo: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'El tipo de solicitud' },
  dependencia: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'La dependencia' },
  descripcion: { tipo: 'texto-largo', requerido: true, min: 10, max: 2000, etiqueta: 'La descripcion' },
}

export async function crear(req, res) {
  if (req.user.rol === 'Administrativo') {
    throw prohibido('El rol Administrativo gestiona solicitudes, no las registra.')
  }

  const datos = validar(req.body, {
    ...REGLAS_SOLICITUD,
    prioridad: { tipo: 'texto', valores: PRIORIDADES, etiqueta: 'La prioridad' },
  })

  const id = await siguienteId()
  const fecha = hoy()
  const solicitud = await Solicitud.create({
    id,
    ...datos,
    prioridad: datos.prioridad || 'Media',
    fecha,
    estado: 'Registrada',
    asignadoA: SIN_ASIGNAR,
    solicitanteId: req.user.id,
    solicitanteNombre: req.user.nombre,
    rolSolicitante: req.user.rol,
  })
  await SolicitudHistorial.create({ solicitudId: id, estado: 'Registrada', fecha, por: req.user.nombre })
  indexarSolicitud(solicitud)

  res.status(201).json(solicitud)
}

// PUT /solicitudes/:id — reemplaza los datos editables de la solicitud
// (tipo, dependencia, prioridad, descripcion). El estado y la respuesta NO
// se tocan aqui: tienen su propio flujo validado (PATCH /:id/responder).
// El dueño solo puede editarla mientras siga "Registrada"; el personal, en
// cualquier estado salvo "Cerrada".
export async function actualizar(req, res) {
  const solicitud = await buscarSolicitud(req.params.id)

  const esDuenio = solicitud.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && solicitud.estado === 'Registrada')) {
    throw prohibido('Solo puedes editar tus propias solicitudes mientras esten en estado "Registrada".')
  }
  if (solicitud.estado === 'Cerrada') {
    throw conflicto('Una solicitud cerrada no se puede modificar.', 'SOLICITUD_CERRADA')
  }

  const datos = validar(req.body, {
    ...REGLAS_SOLICITUD,
    prioridad: { tipo: 'texto', requerido: true, valores: PRIORIDADES, etiqueta: 'La prioridad' },
  })

  solicitud.set(datos)
  await solicitud.save()
  indexarSolicitud(solicitud)

  res.json(solicitud)
}

// PATCH /solicitudes/:id/responder (alias: /:id/estado)
// Registra la respuesta del personal y/o cambia el estado. El backend es
// quien decide si la transicion es valida: el frontend no puede saltarse
// el ciclo de vida (PDF 7.4).
export async function responder(req, res) {
  const solicitud = await buscarSolicitud(req.params.id)

  const datos = validar(
    {
      respuesta: req.body.respuesta,
      adjunto: req.body.adjunto,
      nuevoEstado: req.body.nuevoEstado ?? req.body.estado,
      asignadoA: req.body.asignadoA,
    },
    {
      respuesta: { tipo: 'texto-largo', max: 3000, etiqueta: 'La respuesta' },
      adjunto: { tipo: 'texto', max: 255, etiqueta: 'El adjunto' },
      nuevoEstado: { tipo: 'texto', etiqueta: 'El estado' },
      asignadoA: { tipo: 'texto', max: 100, etiqueta: 'El responsable' },
    },
  )

  if (!datos.respuesta && !datos.nuevoEstado && !datos.asignadoA) {
    throw new ErrorApi(400, 'Indica una respuesta, un nuevo estado o un responsable.', 'VALIDACION')
  }

  const fecha = hoy()
  const estadoAnterior = solicitud.estado
  const estadoDestino = datos.nuevoEstado || estadoAnterior

  // 1) La transicion debe estar definida en el ciclo de vida (409 si no).
  if (datos.nuevoEstado) validarTransicion(TRANSICIONES_SOLICITUD, estadoAnterior, datos.nuevoEstado, 'la solicitud')

  // 2) Condiciones de cada transicion (PDF 7.4).
  if (datos.asignadoA) {
    await validarResponsable(datos.asignadoA)
    solicitud.asignadoA = datos.asignadoA
  } else if (estadoDestino === 'Asignada' && estadoAnterior !== 'Asignada' && solicitud.asignadoA === SIN_ASIGNAR) {
    // "Se identifica un responsable": si el personal no eligio uno, queda a
    // cargo de la dependencia que recibio la solicitud.
    solicitud.asignadoA = solicitud.dependencia
  }

  const respuestaFinal = datos.respuesta || solicitud.respuesta
  if ((estadoDestino === 'Resuelta' || estadoDestino === 'Cerrada') && !respuestaFinal) {
    throw new ErrorApi(400, 'Para resolver la solicitud debes registrar una respuesta o solucion.', 'VALIDACION', [
      { campo: 'respuesta', mensaje: 'La respuesta es obligatoria para resolver o cerrar.' },
    ])
  }

  if (datos.respuesta) {
    solicitud.respuesta = datos.respuesta
    solicitud.respondidoPor = req.user.nombre
    solicitud.fechaRespuesta = fecha
  }
  if (datos.adjunto) solicitud.adjuntoRespuesta = datos.adjunto
  solicitud.estado = estadoDestino
  await solicitud.save()

  // Solo se registra en el historial cuando el estado realmente cambia,
  // para no acumular una fila cada vez que se edita la respuesta.
  if (solicitud.estado !== estadoAnterior) {
    await SolicitudHistorial.create({ solicitudId: solicitud.id, estado: solicitud.estado, fecha, por: req.user.nombre })
  }
  indexarSolicitud(solicitud)

  res.json(solicitud)
}

export async function eliminar(req, res) {
  const solicitud = await buscarSolicitud(req.params.id)

  const esDuenio = solicitud.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && solicitud.estado === 'Registrada')) {
    throw prohibido('Solo puedes eliminar tus propias solicitudes mientras esten en estado "Registrada".')
  }

  await SolicitudHistorial.destroy({ where: { solicitudId: solicitud.id } })
  await solicitud.destroy()
  eliminarDelIndice('solicitud', solicitud.id)

  res.status(204).send()
}
