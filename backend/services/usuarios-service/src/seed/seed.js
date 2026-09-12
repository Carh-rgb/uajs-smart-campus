import bcrypt from 'bcryptjs'
import { Usuario, Permiso } from '../models/index.js'

const USUARIOS_SEED = [
  { nombre: 'Camilo Ramírez', rol: 'Estudiante', programa: 'Ingeniería de Sistemas', correo: 'camilo.ramirez@uajs.edu.co' },
  { nombre: 'Laura Pérez', rol: 'Docente', programa: 'Facultad de Ingeniería', correo: 'laura.perez@uajs.edu.co' },
  { nombre: 'Andrés Gómez', rol: 'Administrativo', programa: 'Bienestar Universitario', correo: 'andres.gomez@uajs.edu.co' },
  { nombre: 'Admin UAJS', rol: 'Administrador del sistema', programa: 'Oficina de Tecnología', correo: 'admin@uajs.edu.co' },
]

const PERMISOS_INICIALES = {
  Estudiante: ['inicio', 'perfil', 'solicitudes', 'reservas', 'eventos', 'notificaciones', 'pqrs'],
  Docente: ['inicio', 'perfil', 'solicitudes', 'reservas', 'eventos', 'notificaciones', 'pqrs'],
  Administrativo: ['inicio', 'perfil', 'solicitudes', 'reservas', 'recursos', 'eventos', 'notificaciones', 'pqrs', 'reportes'],
}

export async function seed() {
  const totalUsuarios = await Usuario.count()
  if (totalUsuarios === 0) {
    const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'uajs2026', 10)
    await Usuario.bulkCreate(
      USUARIOS_SEED.map((u) => ({ ...u, passwordHash, activo: true })),
    )
    console.log(`[usuarios-service] Sembrados ${USUARIOS_SEED.length} usuarios (password: ${process.env.SEED_PASSWORD || 'uajs2026'})`)
  }

  const totalPermisos = await Permiso.count()
  if (totalPermisos === 0) {
    await Permiso.bulkCreate(
      Object.entries(PERMISOS_INICIALES).map(([rol, modulosActivos]) => ({ rol, modulosActivos })),
    )
    console.log('[usuarios-service] Sembrados permisos por defecto.')
  }
}
