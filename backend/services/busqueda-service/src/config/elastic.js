import { Client } from '@elastic/elasticsearch'

export const INDICE = 'uajs_buscar'

export const es = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' })

// Indice unico para todos los tipos de documento (solicitud, pqrs, reserva,
// evento, recurso, usuario), distinguidos por el campo "tipo". Es mas simple
// de consultar de una sola vez (un match multi-tipo) que mantener un indice
// por cada uno, y el volumen de esta app no lo justifica.
export async function asegurarIndice() {
  const existe = await es.indices.exists({ index: INDICE })
  if (existe) return

  await es.indices.create({
    index: INDICE,
    mappings: {
      properties: {
        tipo: { type: 'keyword' },
        entidadId: { type: 'keyword' },
        titulo: { type: 'text' },
        subtitulo: { type: 'text' },
        texto: { type: 'text' },
        estado: { type: 'keyword' },
        ownerId: { type: 'integer' },
        asignadoA: { type: 'keyword' },
        ruta: { type: 'keyword' },
      },
    },
  })
}
