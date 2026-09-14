// Controlador encargado de gestionar la logica de busqueda mediante Elasticsearch
import { es, INDICE } from '../config/elastic.js'

function esStaff(user) {
  return user.rol === 'Administrativo' || user.rol === 'Administrador del sistema'
}

// Cada tipo de documento respeta la misma regla de visibilidad que ya
// aplica su propio microservicio (ver listar() en cada controller): un
// estudiante/docente solo ve lo suyo, el personal ve todo, recursos y
// usuarios quedan restringidos a quien ya podia verlos en su modulo.
const REGLAS_VISIBILIDAD = {
  solicitud: (doc, user) => esStaff(user) || doc.ownerId === user.id,
  pqrs: (doc, user) => esStaff(user) || doc.ownerId === user.id || doc.asignadoA === user.nombre,
  reserva: (doc, user) => esStaff(user) || doc.ownerId === user.id,
  // Un evento Inactivo es un borrador aun no publicado: solo el personal
  // administrativo lo ve en la busqueda (igual que en eventos.controller.js).
  evento: (doc, user) => doc.estado !== 'Inactivo' || esStaff(user),
  recurso: (doc, user) => esStaff(user),
  usuario: (doc, user) => user.rol === 'Administrador del sistema',
}

export async function buscar(req, res) {
  const q = (req.query.q || '').trim()
  if (!q) return res.json([])

  let resultado
  try {
    resultado = await es.search({
      index: INDICE,
      size: 80,
      query: {
        multi_match: {
          query: q,
          fields: ['titulo^3', 'subtitulo^2', 'texto', 'entidadId^2'],
          fuzziness: 'AUTO',
        },
      },
    })
  } catch (err) {
    console.error('[busqueda-service] fallo la busqueda en Elasticsearch:', err.message)
    return res.json([])
  }

  const visibles = resultado.hits.hits
    .map((hit) => hit._source)
    .filter((doc) => (REGLAS_VISIBILIDAD[doc.tipo] || (() => false))(doc, req.user))
    .slice(0, 24)

  res.json(visibles)
}

export async function indexar(req, res) {
  const { tipo, entidadId, titulo, subtitulo, texto, estado, ownerId, asignadoA, ruta } = req.body
  if (!tipo || !entidadId || !titulo) {
    return res.status(400).json({ error: 'tipo, entidadId y titulo son obligatorios.' })
  }

  await es.index({
    index: INDICE,
    id: `${tipo}-${entidadId}`,
    document: { tipo, entidadId: String(entidadId), titulo, subtitulo, texto, estado, ownerId, asignadoA, ruta },
    refresh: true,
  })

  res.status(204).send()
}

export async function eliminarDocumento(req, res) {
  const { tipo, entidadId } = req.params
  try {
    await es.delete({ index: INDICE, id: `${tipo}-${entidadId}`, refresh: true })
  } catch (err) {
    if (err.meta?.statusCode !== 404) {
      return res.status(500).json({ error: 'No se pudo eliminar el documento del indice.' })
    }
  }
  res.status(204).send()
}
