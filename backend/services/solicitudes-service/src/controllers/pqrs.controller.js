import { Pqrs, PqrsHistorial } from '../models/index.js'
import { indexarPqrs, eliminarDelIndice } from '../utils/busquedaClient.js'
import { validarResponsable } from '../utils/usuariosClient.js'
import { ErrorApi, noEncontrado, prohibido, conflicto } from '../utils/errores.js'
import { validar, validarTransicion } from '../utils/validaciones.js'
import { TIPOS_PQRS, TRANSICIONES_PQRS, SIN_ASIGNAR, esPersonal, hoy } from '../utils/catalogos.js'

async function siguienteId() {
  // Basado en el maximo id existente, no en el conteo de filas (ver la
  // misma nota en solicitudes.controller.js).
  const ultima = await Pqrs.findOne({ order: [['id', 'DESC']] })
  const ultimoNumero = ultima ? parseInt(ultima.id.split('-')[1], 10) : 1100
  return `PQRS-${String(ultimoNumero + 1).padStart(4, '0')}`
}

async function buscarPqrs(id) {
  const pqrs = await Pqrs.findByPk(id)
  if (!pqrs) throw noEncontrado('PQRS')
  return pqrs
}

const esResponsableAsignado = (user, pqrs) => user.rol === 'Docente' && pqrs.asignadoA === user.nombre

// Ve una PQRS: el personal, quien la radico o el docente a quien se asigno.
function verificarAcceso(pqrs, user) {
  if (!esPersonal(user) && pqrs.solicitanteId !== user.id && !esResponsableAsignado(user, pqrs)) {
    throw prohibido('No tienes permisos para ver esta PQRS.')
  }
}

export async function listar(req, res) {
  let where = {}
  if (req.user.rol === 'Estudiante') where = { solicitanteId: req.user.id }
  else if (req.user.rol === 'Docente') where = { asignadoA: req.user.nombre }
  // Administrativo / Administrador del sistema ven todas.

  const { estado, tipo } = req.query
  if (estado && estado !== 'Todos') where.estado = String(estado)
  if (tipo && tipo !== 'Todos') where.tipo = String(tipo)

  const pqrs = await Pqrs.findAll({ where, order: [['createdAt', 'DESC']] })
  res.json(pqrs)
}

export async function obtener(req, res) {
  const pqrs = await buscarPqrs(req.params.id)
  verificarAcceso(pqrs, req.user)

  const historial = await PqrsHistorial.findAll({
    where: { pqrsId: pqrs.id },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json({ ...pqrs.toJSON(), historial })
}

const REGLAS_PQRS = {
  tipo: { tipo: 'texto', requerido: true, valores: TIPOS_PQRS, etiqueta: 'El tipo de PQRS' },
  dirigidoA: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'La dependencia destino' },
  asunto: { tipo: 'texto', requerido: true, max: 150, etiqueta: 'El asunto' },
  descripcion: { tipo: 'texto-largo', requerido: true, min: 10, max: 2000, etiqueta: 'La descripcion' },
  adjunto: { tipo: 'texto', max: 255, etiqueta: 'El adjunto' },
}

export async function crear(req, res) {
  const datos = validar(req.body, REGLAS_PQRS)

  const id = await siguienteId()
  const fecha = hoy()
  const nueva = await Pqrs.create({
    id,
    ...datos,
    adjunto: datos.adjunto || null,
    estado: 'Registrada',
    solicitanteId: req.user.id,
    solicitante: req.user.nombre,
    rolSolicitante: req.user.rol,
    asignadoA: SIN_ASIGNAR,
    fecha,
  })
  await PqrsHistorial.create({ pqrsId: id, estado: 'Registrada', fecha, por: req.user.nombre })
  indexarPqrs(nueva)

  res.status(201).json(nueva)
}

// PUT /pqrs/:id — reemplaza los datos editables (tipo, dependencia destino,
// asunto, descripcion, adjunto). Solo el dueño y solo mientras la PQRS siga
// "Registrada" (despues ya esta en gestion); el personal puede en cualquier
// estado.
export async function actualizar(req, res) {
  const pqrs = await buscarPqrs(req.params.id)

  const esDuenio = pqrs.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && pqrs.estado === 'Registrada')) {
    throw prohibido('Solo puedes editar tus propias PQRS mientras esten en estado "Registrada".')
  }

  const datos = validar(req.body, REGLAS_PQRS)
  pqrs.set({ ...datos, adjunto: datos.adjunto || null })
  await pqrs.save()
  indexarPqrs(pqrs)

  res.json(pqrs)
}

export async function responder(req, res) {
  const pqrs = await buscarPqrs(req.params.id)

  if (!esPersonal(req.user) && !esResponsableAsignado(req.user, pqrs)) {
    throw prohibido('No tienes permisos para responder esta PQRS.')
  }

  const datos = validar(req.body, {
    respuesta: { tipo: 'texto-largo', requerido: true, max: 3000, etiqueta: 'La respuesta' },
    adjunto: { tipo: 'texto', max: 255, etiqueta: 'El adjunto' },
    estado: { tipo: 'texto', etiqueta: 'El estado' },
  })

  const estadoAnterior = pqrs.estado
  const estadoDestino = datos.estado || 'Resuelta'
  validarTransicion(TRANSICIONES_PQRS, estadoAnterior, estadoDestino, 'la PQRS')

  pqrs.respuesta = datos.respuesta
  if (datos.adjunto) pqrs.adjuntoRespuesta = datos.adjunto
  pqrs.respondidoPor = req.user.nombre
  pqrs.estado = estadoDestino
  await pqrs.save()

  // Solo se registra en el historial cuando el estado realmente cambia,
  // para no acumular una fila cada vez que se edita la respuesta.
  if (pqrs.estado !== estadoAnterior) {
    await PqrsHistorial.create({ pqrsId: pqrs.id, estado: pqrs.estado, fecha: hoy(), por: req.user.nombre })
  }
  indexarPqrs(pqrs)

  res.json(pqrs)
}

export async function asignar(req, res) {
  const pqrs = await buscarPqrs(req.params.id)

  const datos = validar(req.body, {
    asignadoA: { tipo: 'texto', requerido: true, max: 100, etiqueta: 'El responsable' },
  })

  // "Sin asignar" siempre es valido; cualquier otro nombre se verifica
  // contra usuarios-service (dueño de los datos de usuarios).
  if (datos.asignadoA !== SIN_ASIGNAR) await validarResponsable(datos.asignadoA)

  const estadoAnterior = pqrs.estado
  pqrs.asignadoA = datos.asignadoA
  // Asignar a alguien pone en gestion una PQRS recien registrada; si ya
  // estaba en gestion o resuelta, reasignar no cambia su estado.
  if (datos.asignadoA !== SIN_ASIGNAR && estadoAnterior === 'Registrada') pqrs.estado = 'En gestión'
  await pqrs.save()

  if (pqrs.estado !== estadoAnterior) {
    await PqrsHistorial.create({ pqrsId: pqrs.id, estado: pqrs.estado, fecha: hoy(), por: req.user.nombre })
  }
  indexarPqrs(pqrs)

  res.json(pqrs)
}

export async function historial(req, res) {
  const pqrs = await buscarPqrs(req.params.id)
  verificarAcceso(pqrs, req.user)

  const items = await PqrsHistorial.findAll({
    where: { pqrsId: pqrs.id },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  })
  res.json(items)
}

export async function eliminar(req, res) {
  const pqrs = await buscarPqrs(req.params.id)

  const esDuenio = pqrs.solicitanteId === req.user.id
  if (!esPersonal(req.user) && !(esDuenio && pqrs.estado === 'Registrada')) {
    throw prohibido('Solo puedes eliminar tus propias PQRS mientras esten en estado "Registrada".')
  }

  await PqrsHistorial.destroy({ where: { pqrsId: pqrs.id } })
  await pqrs.destroy()
  eliminarDelIndice('pqrs', pqrs.id)

  res.status(204).send()
}
