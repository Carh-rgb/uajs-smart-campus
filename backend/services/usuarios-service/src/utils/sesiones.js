import crypto from 'crypto'
import { Sesion } from '../models/index.js'

// Minutos sin actividad tras los cuales la sesion se cierra (por defecto 30).
export const MINUTOS_INACTIVIDAD = Number(process.env.SESION_INACTIVIDAD_MIN) || 30
const LIMITE_MS = MINUTOS_INACTIVIDAD * 60 * 1000

// Para no escribir en la base de datos en cada peticion, la ultima
// actividad solo se guarda si la anterior tiene mas de 30 segundos.
const INTERVALO_ESCRITURA_MS = 30 * 1000

// Abre una sesion nueva para el usuario y devuelve su identificador (sid).
// Si ya tenia una abierta en otro dispositivo, queda reemplazada.
export async function abrirSesion(usuarioId) {
  const sid = crypto.randomUUID()
  await Sesion.upsert({ usuarioId, sid, ultimaActividad: new Date() })
  return sid
}

// Cierra la sesion del usuario (logout, cambio de contraseña, cuenta
// desactivada o eliminada). Cualquier token emitido antes deja de servir.
export async function cerrarSesion(usuarioId) {
  await Sesion.destroy({ where: { usuarioId } })
}

// Revisa si el token (ya verificado) corresponde a la sesion vigente.
// Devuelve { ok: true } o { ok: false, code, message }.
// Si `registrarActividad` es true, cuenta la peticion como actividad.
export async function verificarSesion(payload, { registrarActividad = true } = {}) {
  const sesion = payload?.sid ? await Sesion.findByPk(payload.id) : null

  if (!sesion) {
    // Sin fila: el usuario cerro sesion, se le cambio la contraseña o el
    // token es anterior a esta funcion. Se pide iniciar sesion de nuevo.
    return { ok: false, code: 'SESSION_EXPIRED', message: 'Tu sesión terminó. Inicia sesión de nuevo.' }
  }
  if (sesion.sid !== payload.sid) {
    return {
      ok: false,
      code: 'SESSION_REPLACED',
      message: 'Tu cuenta inició sesión en otro dispositivo, así que esta sesión se cerró.',
    }
  }

  const inactivoMs = Date.now() - new Date(sesion.ultimaActividad).getTime()
  if (inactivoMs > LIMITE_MS) {
    await sesion.destroy()
    return {
      ok: false,
      code: 'SESSION_EXPIRED',
      message: `Tu sesión se cerró por inactividad (más de ${MINUTOS_INACTIVIDAD} minutos). Inicia sesión de nuevo.`,
    }
  }

  if (registrarActividad && inactivoMs > INTERVALO_ESCRITURA_MS) {
    sesion.ultimaActividad = new Date()
    await sesion.save()
  }
  return { ok: true }
}
