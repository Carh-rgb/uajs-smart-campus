import { api } from '../api/client.js'

// Cliente HTTP del dominio de recursos.
export const recursosService = {
  listar: (tipo) => api.get(tipo && tipo !== 'Todos' ? `/recursos?tipo=${encodeURIComponent(tipo)}` : '/recursos'),
  obtener: (codigo) => api.get(`/recursos/${codigo}`),
  crear: (datos) => api.post('/recursos', datos),
  actualizar: (codigo, datos) => api.put(`/recursos/${codigo}`, datos),
  cambiarEstado: (codigo, estado) => api.patch(`/recursos/${codigo}/estado`, { estado }),
  historial: (codigo) => api.get(`/recursos/${codigo}/historial`),
  eliminar: (codigo) => api.delete(`/recursos/${codigo}`),
}
