/**
 * Manejo centralizado de errores (Entregable 2, secciones 7.2 y 9.1).
 *
 * Formato unico de error para toda la API:
 *   { "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
 *
 * Las respuestas exitosas no cambian: devuelven el recurso o la coleccion
 * directamente, como en el Entregable 1.
 *
 * Este archivo es identico en los 7 microservicios a proposito: cada
 * servicio debe poder desplegarse solo, sin depender de un paquete compartido.
 * Si se cambia aqui, hay que copiarlo a los demas.
 *
 * Como usarlo en un controlador:
 *   - Lo de siempre sigue funcionando:
 *       return res.status(404).json({ error: 'Recurso no encontrado.' })
 *     (normalizarErrores lo convierte al formato de arriba con code NOT_FOUND)
 *   - Con un codigo propio:
 *       return res.status(409).json({ error: 'Horario ocupado.', code: 'RESERVATION_CONFLICT' })
 *   - O lanzando un error (no hace falta try/catch, express-async-errors
 *     lo lleva al manejador de abajo):
 *       throw new HttpError(400, 'Transicion no permitida.', 'INVALID_TRANSITION')
 */

const CODIGO_POR_STATUS = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  500: 'INTERNAL_ERROR',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
}

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code || CODIGO_POR_STATUS[status] || 'ERROR'
  }
}

// Convierte cualquier { error: 'texto' } enviado con status >= 400 al
// formato unico. Asi los controladores existentes quedan consistentes sin
// tener que reescribir cada res.status(...).json(...).
export function normalizarErrores(req, res, next) {
  const jsonOriginal = res.json.bind(res)
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body.error === 'string') {
      body = {
        success: false,
        error: {
          code: body.code || CODIGO_POR_STATUS[res.statusCode] || 'ERROR',
          message: body.error,
        },
      }
    }
    return jsonOriginal(body)
  }
  next()
}

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, code: 'ROUTE_NOT_FOUND' })
}

// Traduce los errores conocidos (de Sequelize/Postgres, del parser JSON o
// HttpError) a un status y mensaje entendibles. Lo desconocido es 500 y
// nunca se envian trazas internas al cliente, solo se registran en consola.
function clasificar(err) {
  if (err instanceof HttpError) {
    return { status: err.status, code: err.code, message: err.message }
  }
  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'El cuerpo de la peticion no es un JSON valido.' }
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo de la peticion es demasiado grande.' }
  }
  switch (err.name) {
    case 'SequelizeValidationError':
      return { status: 400, code: 'VALIDATION_ERROR', message: err.errors.map((e) => e.message).join(' ') }
    case 'SequelizeUniqueConstraintError':
      return { status: 409, code: 'DUPLICATE', message: 'Ya existe un registro con esos datos.' }
    case 'SequelizeForeignKeyConstraintError':
      return { status: 409, code: 'INTEGRITY_CONFLICT', message: 'La operacion viola la integridad de datos relacionados.' }
    case 'SequelizeDatabaseError': {
      // 22P02: valor con formato invalido (ej. un estado fuera del ENUM o
      // texto donde va un numero). 22007/22008: fecha u hora invalida.
      const codigoPg = err.original?.code || err.parent?.code
      if (['22P02', '22007', '22008', '22003'].includes(codigoPg)) {
        return { status: 400, code: 'VALIDATION_ERROR', message: 'Uno de los valores enviados no es valido para este campo.' }
      }
      break
    }
    default:
      break
  }
  return null
}

export function manejadorDeErrores(nombreServicio) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    const conocido = clasificar(err)
    if (conocido) {
      return res.status(conocido.status).json({ error: conocido.message, code: conocido.code })
    }
    console.error(`[${nombreServicio}] error no controlado en ${req.method} ${req.originalUrl}:`, err)
    res.status(500).json({ error: `Error interno del servicio de ${nombreServicio.replace('-service', '')}.`, code: 'INTERNAL_ERROR' })
  }
}
