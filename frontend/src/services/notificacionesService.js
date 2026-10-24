import { api } from '../api/client.js'

// Cliente HTTP del dominio de notificaciones.
export const notificacionesService = {
  listar: () => api.get('/notificaciones'),
  obtener: (id) => api.get(`/notificaciones/${id}`),
  crear: (datos) => api.post('/notificaciones', datos),
  marcarLeida: (id) => api.patch(`/notificaciones/${id}/leida`),
  marcarTodasLeidas: () => api.patch('/notificaciones/marcar-todas'),
  eliminar: (id) => api.delete(`/notificaciones/${id}`),
}
