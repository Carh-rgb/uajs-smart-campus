// Mapea la categoria de una notificacion al modulo que la genero, para
// poder redirigir con un clic. "Institucional" no tiene modulo propio
// (son avisos generales), asi que no redirige a ningun lado.
const RUTA_POR_CATEGORIA = {
  Solicitudes: '/app/solicitudes',
  PQRS: '/app/pqrs',
  Reservas: '/app/reservas',
  Eventos: '/app/eventos',
}

export function rutaDeNotificacion(categoria) {
  return RUTA_POR_CATEGORIA[categoria] || null
}
