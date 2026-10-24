// Catalogos cerrados y reglas de estado que el frontend necesita para armar
// formularios, filtros y selectores. Los valores DEBEN coincidir con los que
// valida el backend (el backend es quien manda: si un valor no coincide, la
// API responde 400/409). No son datos de demostracion: son vocabulario del
// dominio.

// --- Solicitudes ---------------------------------------------------------
export const dependencias = [
  'Registro Académico',
  'Recursos Tecnológicos',
  'Coordinación Académica',
  'Bienestar Universitario',
  'Sin asignar',
]

export const estadosSolicitud = ['Registrada', 'En revisión', 'Asignada', 'En proceso', 'Resuelta', 'Cerrada']

export const tiposSolicitud = [
  'Certificado académico',
  'Cambio de horario',
  'Constancia de matrícula',
  'Homologación de asignatura',
  'Corrección de datos personales',
  'Carta de presentación',
  'Otro',
]

export const prioridadesSolicitud = ['Baja', 'Media', 'Alta']

// --- PQRS ----------------------------------------------------------------
export const tiposPqrs = ['Petición', 'Queja', 'Reclamo', 'Sugerencia']
export const estadosPqrs = ['Registrada', 'En gestión', 'Resuelta']

// --- Reservas ------------------------------------------------------------
export const estadosReserva = ['Pendiente', 'Confirmada', 'Cancelada', 'Denegada']

// --- Recursos ------------------------------------------------------------
export const tiposRecurso = ['Audiovisual', 'Equipo de cómputo', 'Mobiliario', 'Instrumento de laboratorio', 'Otro']
export const estadosRecurso = ['Disponible', 'En mantenimiento', 'Fuera de servicio']

// --- Eventos -------------------------------------------------------------
export const facultadesEventos = [
  'Facultad de Ciencias de la Ingeniería',
  'Facultad de Ciencias Administrativas, Económicas y Contables',
  'Facultad de Ciencias Sociales y Educación',
  'Facultad de Ciencias de la Salud',
  'General / Bienestar Universitario',
]
export const estadosEvento = ['Activo', 'Inactivo', 'Cancelado']

// --- Maquinas de estado --------------------------------------------------
// Espejo de las transiciones que acepta el backend (ver
// backend/services/*/src/utils/catalogos.js). Se usan para ofrecer en los
// selectores SOLO los cambios de estado permitidos; la validacion real
// sigue estando en el backend.
export const TRANSICIONES_SOLICITUD = {
  'Registrada': ['En revisión'],
  'En revisión': ['Asignada'],
  'Asignada': ['En proceso'],
  'En proceso': ['Resuelta'],
  'Resuelta': ['Cerrada', 'En proceso'],
  'Cerrada': [],
}

export const TRANSICIONES_PQRS = {
  'Registrada': ['En gestión', 'Resuelta'],
  'En gestión': ['Resuelta'],
  'Resuelta': ['En gestión'],
}

export const TRANSICIONES_RESERVA = {
  'Pendiente': ['Confirmada', 'Denegada', 'Cancelada'],
  'Confirmada': ['Cancelada'],
  'Denegada': [],
  'Cancelada': [],
}

// Estado actual + los estados a los que se puede pasar desde el.
export function estadosDisponibles(mapa, actual) {
  return [actual, ...(mapa[actual] || [])]
}
