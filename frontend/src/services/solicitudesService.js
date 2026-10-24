import { api } from '../api/client.js'

// Cliente HTTP del dominio de solicitudes (a traves del API Gateway).
export const solicitudesService = {
  listar: () => api.get('/solicitudes'),
  obtener: (id) => api.get(`/solicitudes/${id}`),
  crear: (datos) => api.post('/solicitudes', datos),
  actualizar: (id, datos) => api.put(`/solicitudes/${id}`, datos),
  responder: (id, datos) => api.patch(`/solicitudes/${id}/responder`, datos),
  historial: (id) => api.get(`/solicitudes/${id}/historial`),
  eliminar: (id) => api.delete(`/solicitudes/${id}`),
}
