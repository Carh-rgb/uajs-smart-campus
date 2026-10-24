import { api } from '../api/client.js'

// Cliente HTTP del dominio de eventos.
export const eventosService = {
  listar: () => api.get('/eventos'),
  obtener: (id) => api.get(`/eventos/${id}`),
  crear: (datos) => api.post('/eventos', datos),
  actualizar: (id, datos) => api.put(`/eventos/${id}`, datos),
  cambiarEstado: (id, estado) => api.patch(`/eventos/${id}/estado`, { estado }),
  inscritos: (id) => api.get(`/eventos/${id}/inscritos`),
  inscribir: (id) => api.post(`/eventos/${id}/inscribir`),
  cancelarInscripcion: (id) => api.delete(`/eventos/${id}/inscripcion`),
  eliminar: (id) => api.delete(`/eventos/${id}`),
}
