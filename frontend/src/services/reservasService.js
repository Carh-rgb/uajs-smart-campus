import { api } from '../api/client.js'

// Cliente HTTP del dominio de reservas.
export const reservasService = {
  listar: () => api.get('/reservas'),
  obtener: (id) => api.get(`/reservas/${id}`),
  catalogo: () => api.get('/reservas/catalogo'),
  // Franjas ocupadas de un espacio en una fecha (reservas activas).
  disponibilidad: (espacio, fecha) =>
    api.get(`/reservas/disponibilidad?espacio=${encodeURIComponent(espacio)}&fecha=${encodeURIComponent(fecha)}`),
  crear: (datos) => api.post('/reservas', datos),
  actualizar: (id, datos) => api.put(`/reservas/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/reservas/${id}/estado`, { estado }),
  cancelar: (id) => api.patch(`/reservas/${id}/cancelar`),
  historial: (id) => api.get(`/reservas/${id}/historial`),
  eliminar: (id) => api.delete(`/reservas/${id}`),
}
