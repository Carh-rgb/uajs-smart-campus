import { api } from '../api/client.js'

// Cliente HTTP del servicio de busqueda (Elasticsearch, detras del Gateway).
export const busquedaService = {
  buscar: (texto) => api.get(`/buscar?q=${encodeURIComponent(texto)}`),
}
