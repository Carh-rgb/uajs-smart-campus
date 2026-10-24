// Catalogos y reglas de estado del dominio de reservas.

export const TIPOS_ESPACIO = ['espacio', 'equipo']

// Estados activos: ocupan el espacio/equipo y bloquean otras reservas
// solapadas. Cancelada y Denegada liberan el horario.
export const ESTADOS_ACTIVOS = ['Pendiente', 'Confirmada']

// Ciclo de vida de una reserva (PDF 7.5). Cancelar es el estado acordado
// para anular: se puede cancelar mientras este Pendiente o Confirmada.
// Denegada y Cancelada son finales.
export const TRANSICIONES_RESERVA = {
  'Pendiente': ['Confirmada', 'Denegada', 'Cancelada'],
  'Confirmada': ['Cancelada'],
  'Denegada': [],
  'Cancelada': [],
}

export const esPersonal = (user) => user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'

// Fecha de "hoy" para historial (UTC, como el resto de servicios).
export const hoy = () => new Date().toISOString().slice(0, 10)

// Fecha de "hoy" en hora de Colombia: es la que sirve para decidir si una
// reserva esta en el pasado (con UTC, despues de las 7 p.m. "hoy" ya seria
// manana y se rechazarian reservas validas del mismo dia).
export const hoyLocal = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
