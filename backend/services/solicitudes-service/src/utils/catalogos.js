// Catalogos cerrados y maquinas de estado del dominio de solicitudes/PQRS.

export const PRIORIDADES = ['Baja', 'Media', 'Alta']

// Ciclo de vida de una solicitud (PDF 7.4):
//   Registrada -> En revisión -> Asignada -> En proceso -> Resuelta -> Cerrada
// Unica transicion "hacia atras" definida y justificada: una solicitud
// Resuelta puede volver a En proceso (reapertura) si el solicitante o el
// personal detecta que la solucion no fue suficiente. Cerrada es final.
export const TRANSICIONES_SOLICITUD = {
  'Registrada': ['En revisión'],
  'En revisión': ['Asignada'],
  'Asignada': ['En proceso'],
  'En proceso': ['Resuelta'],
  'Resuelta': ['Cerrada', 'En proceso'],
  'Cerrada': [],
}

export const TIPOS_PQRS = ['Petición', 'Queja', 'Reclamo', 'Sugerencia']

// PQRS tiene un ciclo mas corto. Una PQRS sencilla puede resolverse
// directamente desde Registrada; Resuelta -> En gestión es la reapertura.
export const TRANSICIONES_PQRS = {
  'Registrada': ['En gestión', 'Resuelta'],
  'En gestión': ['Resuelta'],
  'Resuelta': ['En gestión'],
}

export const SIN_ASIGNAR = 'Sin asignar'

export const esPersonal = (user) => user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'

export const hoy = () => new Date().toISOString().slice(0, 10)
