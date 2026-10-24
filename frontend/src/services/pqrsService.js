import { api } from '../api/client.js'

// Cliente HTTP del dominio de PQRS.
export const pqrsService = {
  listar: () => api.get('/pqrs'),
  obtener: (id) => api.get(`/pqrs/${id}`),
  crear: (datos) => api.post('/pqrs', datos),
  actualizar: (id, datos) => api.put(`/pqrs/${id}`, datos),
  responder: (id, datos) => api.patch(`/pqrs/${id}/responder`, datos),
  asignar: (id, asignadoA) => api.patch(`/pqrs/${id}/asignar`, { asignadoA }),
  historial: (id) => api.get(`/pqrs/${id}/historial`),
  eliminar: (id) => api.delete(`/pqrs/${id}`),
}
