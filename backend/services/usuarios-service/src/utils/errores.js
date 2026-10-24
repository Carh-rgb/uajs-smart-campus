// Manejo uniforme de errores de la API.
//
// Formato de error de TODOS los servicios (el frontend lee `error`):
//   { "error": "mensaje legible", "codigo": "CODIGO_ESTABLE", "detalles": [...] }
// "detalles" solo aparece en errores de validacion y lista cada campo
// invalido. Nunca se devuelven trazas, SQL ni datos internos.
//
// Los controladores lanzan `ErrorApi` (o dejan escapar errores de
// Sequelize) y `manejadorErrores` los traduce al codigo HTTP correcto.
// `asyncHandler` es necesario porque Express 4 no captura las promesas
// rechazadas de los handlers async: sin el, un error en un controlador
// termina como "unhandled rejection" y tumba el proceso del servicio.

export class ErrorApi extends Error {
  constructor(status, mensaje, codigo = 'ERROR', detalles) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
    this.detalles = detalles
  }
}

export const noEncontrado = (entidad) =>
  new ErrorApi(404, `${entidad} no encontrada.`, 'NO_ENCONTRADO')

export const conflicto = (mensaje, codigo = 'CONFLICTO', detalles) =>
  new ErrorApi(409, mensaje, codigo, detalles)

export const prohibido = (mensaje) => new ErrorApi(403, mensaje, 'PROHIBIDO')

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, codigo: 'RUTA_NO_ENCONTRADA' })
}

export function manejadorErrores(nombreServicio) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (err instanceof ErrorApi) {
      const cuerpo = { error: err.message, codigo: err.codigo }
      if (err.detalles) cuerpo.detalles = err.detalles
      return res.status(err.status).json(cuerpo)
    }

    // JSON malformado en el cuerpo de la peticion (body-parser de Express).
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la peticion no es un JSON valido.', codigo: 'JSON_INVALIDO' })
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'El cuerpo de la peticion es demasiado grande.', codigo: 'PAYLOAD_GRANDE' })
    }

    switch (err.name) {
      case 'SequelizeValidationError':
        return res.status(400).json({
          error: 'Datos invalidos.',
          codigo: 'VALIDACION',
          detalles: err.errors.map((e) => ({ campo: e.path, mensaje: e.message })),
        })
      case 'SequelizeUniqueConstraintError':
        return res.status(409).json({ error: 'Ya existe un registro con esos datos.', codigo: 'DUPLICADO' })
      case 'SequelizeForeignKeyConstraintError':
        return res.status(409).json({
          error: 'La operacion viola una relacion con otros registros.',
          codigo: 'INTEGRIDAD_REFERENCIAL',
        })
      case 'SequelizeDatabaseError':
        // Ej.: valor fuera de un ENUM o texto donde se esperaba un numero.
        console.error(`[${nombreServicio}] error de base de datos:`, err.parent?.message || err.message)
        return res.status(400).json({ error: 'Alguno de los datos enviados no es valido.', codigo: 'DATOS_INVALIDOS' })
      case 'SequelizeConnectionError':
      case 'SequelizeConnectionRefusedError':
      case 'SequelizeHostNotFoundError':
      case 'SequelizeConnectionTimedOutError':
      case 'SequelizeAccessDeniedError':
        console.error(`[${nombreServicio}] sin conexion a la base de datos:`, err.message)
        return res.status(503).json({
          error: 'La base de datos no esta disponible en este momento.',
          codigo: 'BASE_DE_DATOS_NO_DISPONIBLE',
        })
      default:
        console.error(`[${nombreServicio}]`, err)
        return res.status(500).json({ error: `Error interno del servicio de ${nombreServicio}.`, codigo: 'ERROR_INTERNO' })
    }
  }
}
