// Catalogos y reglas del dominio de solicitudes y PQRS. Son los mismos
// valores que ofrece el frontend (frontend/src/data/mockData.js); el backend
// los valida porque la guia exige que las reglas criticas no dependan de React.

export const TIPOS_SOLICITUD = [
  'Certificado académico',
  'Cambio de horario',
  'Constancia de matrícula',
  'Homologación de asignatura',
  'Corrección de datos personales',
  'Carta de presentación',
  'Otro',
]

export const DEPENDENCIAS = [
  'Registro Académico',
  'Recursos Tecnológicos',
  'Coordinación Académica',
  'Bienestar Universitario',
]

export const PRIORIDADES = ['Baja', 'Media', 'Alta']

// Ciclo de vida de una solicitud (Entregable 1, reglas 7.4 del Entregable 2).
// Cada estado solo puede avanzar al siguiente; no hay retrocesos ni saltos.
export const TRANSICIONES_SOLICITUD = {
  Registrada: ['En revisión'],
  'En revisión': ['Asignada'],
  Asignada: ['En proceso'],
  'En proceso': ['Resuelta'],
  Resuelta: ['Cerrada'],
  Cerrada: [],
}
export const ESTADOS_SOLICITUD = Object.keys(TRANSICIONES_SOLICITUD)

export const TIPOS_PQRS = ['Petición', 'Queja', 'Reclamo', 'Sugerencia']
export const ESTADOS_PQRS = ['Registrada', 'En gestión', 'Resuelta']

export function esPersonal(user) {
  return user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'
}
