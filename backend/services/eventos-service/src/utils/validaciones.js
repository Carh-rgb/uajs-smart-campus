// Validacion de entrada del backend (React tambien valida, pero esta es la
// que cuenta: ver "Validar datos recibidos por el backend" en el PDF).
//
// Cada servicio lleva su propia copia de este archivo a proposito: los
// microservicios no comparten codigo para poder desplegarse y evolucionar
// por separado.
//
// Uso:
//   const datos = validar(req.body, {
//     titulo: { tipo: 'texto', requerido: true, max: 150 },
//     fecha:  { tipo: 'fecha', requerido: true },
//   })
// Devuelve SOLO los campos declarados (evita "mass assignment") ya
// normalizados (texto recortado, ''/null -> null en opcionales). Si algo
// falla lanza ErrorApi 400 con `detalles: [{ campo, mensaje }]`.
import { ErrorApi } from './errores.js'

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function esFechaValida(valor) {
  if (typeof valor !== 'string' || !RE_FECHA.test(valor)) return false
  const d = new Date(`${valor}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor
}

export const esHoraValida = (valor) => typeof valor === 'string' && RE_HORA.test(valor)

function validarCampo(nombre, valor, regla) {
  const etiqueta = regla.etiqueta || nombre
  const vacio = valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')

  if (vacio) {
    if (regla.requerido) return { error: `${etiqueta} es obligatorio.` }
    return { valor: valor === undefined ? undefined : null }
  }

  switch (regla.tipo) {
    case 'texto':
    case 'texto-largo': {
      if (typeof valor !== 'string') return { error: `${etiqueta} debe ser texto.` }
      const texto = valor.trim()
      const max = regla.max || (regla.tipo === 'texto-largo' ? 5000 : 255)
      if (texto.length > max) return { error: `${etiqueta} no puede superar ${max} caracteres.` }
      if (regla.min && texto.length < regla.min) return { error: `${etiqueta} debe tener al menos ${regla.min} caracteres.` }
      if (regla.valores && !regla.valores.includes(texto)) {
        return { error: `${etiqueta} debe ser uno de: ${regla.valores.join(', ')}.` }
      }
      return { valor: texto }
    }
    case 'entero': {
      const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor
      if (!Number.isInteger(n)) return { error: `${etiqueta} debe ser un numero entero.` }
      if (regla.min !== undefined && n < regla.min) return { error: `${etiqueta} debe ser mayor o igual a ${regla.min}.` }
      if (regla.max !== undefined && n > regla.max) return { error: `${etiqueta} debe ser menor o igual a ${regla.max}.` }
      return { valor: n }
    }
    case 'fecha':
      if (!esFechaValida(valor)) return { error: `${etiqueta} debe ser una fecha valida con formato AAAA-MM-DD.` }
      return { valor }
    case 'hora':
      if (!esHoraValida(valor)) return { error: `${etiqueta} debe tener formato HH:MM (24 horas).` }
      return { valor }
    case 'correo': {
      const correo = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
      if (!RE_CORREO.test(correo) || correo.length > 255) return { error: `${etiqueta} no tiene un formato de correo valido.` }
      return { valor: correo }
    }
    case 'booleano':
      if (typeof valor !== 'boolean') return { error: `${etiqueta} debe ser verdadero o falso.` }
      return { valor }
    default:
      return { valor }
  }
}

export function validar(datos, reglas) {
  const cuerpo = datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {}
  const resultado = {}
  const detalles = []

  for (const [campo, regla] of Object.entries(reglas)) {
    const { valor, error } = validarCampo(campo, cuerpo[campo], regla)
    if (error) detalles.push({ campo, mensaje: error })
    else if (valor !== undefined) resultado[campo] = valor
  }

  if (detalles.length > 0) {
    throw new ErrorApi(400, detalles.map((d) => d.mensaje).join(' '), 'VALIDACION', detalles)
  }
  return resultado
}

// Para ids numericos que llegan en la URL (/eventos/:id). Un "abc" llegaria
// hasta la base de datos y fallaria alli; aqui se rechaza con 400 claro.
export function idEntero(valor, etiqueta = 'El identificador') {
  const n = Number(valor)
  if (!Number.isInteger(n) || n <= 0) {
    throw new ErrorApi(400, `${etiqueta} debe ser un numero entero positivo.`, 'VALIDACION', [
      { campo: 'id', mensaje: `${etiqueta} debe ser un numero entero positivo.` },
    ])
  }
  return n
}

// Verifica que un valor pertenezca a un catalogo cerrado (estados, tipos...).
export function enCatalogo(valor, catalogo, etiqueta) {
  if (!catalogo.includes(valor)) {
    throw new ErrorApi(400, `${etiqueta} debe ser uno de: ${catalogo.join(', ')}.`, 'VALIDACION', [
      { campo: etiqueta, mensaje: `Valores permitidos: ${catalogo.join(', ')}.` },
    ])
  }
  return valor
}

// Valida una transicion de estado contra un mapa { estadoActual: [siguientes] }.
// Responde 409 (el recurso esta en un estado que no admite el cambio) e
// indica cuales transiciones SI estan permitidas desde el estado actual.
export function validarTransicion(mapa, actual, nuevo, entidad) {
  if (!Object.keys(mapa).includes(nuevo)) {
    throw new ErrorApi(400, `Estado no valido. Debe ser uno de: ${Object.keys(mapa).join(', ')}.`, 'VALIDACION', [
      { campo: 'estado', mensaje: `Valores permitidos: ${Object.keys(mapa).join(', ')}.` },
    ])
  }
  if (nuevo === actual) return
  const permitidas = mapa[actual] || []
  if (!permitidas.includes(nuevo)) {
    const hacia = permitidas.length > 0 ? `Desde "${actual}" solo se puede pasar a: ${permitidas.join(', ')}.` : `"${actual}" es un estado final.`
    throw new ErrorApi(409, `Transicion no permitida para ${entidad}: "${actual}" -> "${nuevo}". ${hacia}`, 'TRANSICION_INVALIDA', [
      { campo: 'estado', actual, solicitado: nuevo, permitidas },
    ])
  }
}
