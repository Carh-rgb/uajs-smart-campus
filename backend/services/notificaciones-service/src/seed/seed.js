import { Notificacion } from '../models/index.js'

const CAMILO_ID = 1

const NOTIFICACIONES_SEED = [
  { usuarioId: CAMILO_ID, categoria: 'Solicitudes', mensaje: 'Tu solicitud SOL-0229 cambió a estado Asignada.', fecha: '2026-08-20', leida: false },
  { usuarioId: CAMILO_ID, categoria: 'Reservas', mensaje: 'Reserva aprobada para Salón B05 el 19 de agosto.', fecha: '2026-08-18', leida: false },
  { usuarioId: CAMILO_ID, categoria: 'Institucional', mensaje: 'Recuerda inscribirte a la Semana de la Ingeniería.', fecha: '2026-08-17', leida: true },
  { usuarioId: CAMILO_ID, categoria: 'Solicitudes', mensaje: 'Tu solicitud SOL-0214 fue resuelta.', fecha: '2026-08-11', leida: true },
]

export async function seed() {
  if ((await Notificacion.count()) === 0) {
    await Notificacion.bulkCreate(NOTIFICACIONES_SEED)
    console.log(`[notificaciones-service] Sembradas ${NOTIFICACIONES_SEED.length} notificaciones.`)
  }
}
