import jwt from 'jsonwebtoken'

const URL_BUSQUEDA = process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007'

// Mismo patron que recursos-service -> reservas-service: token de corta
// duracion firmado con el JWT_SECRET compartido, no representa a ningun
// usuario real. Si busqueda-service esta caido no debe tumbar la operacion
// principal (crear/responder una solicitud o PQRS), por eso todo va en
// try/catch sin relanzar el error.
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'solicitudes-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

export async function indexarDocumento(documento) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenServicio()}` },
      body: JSON.stringify(documento),
    })
  } catch (err) {
    console.error('[solicitudes-service] no se pudo indexar en busqueda-service:', err.message)
  }
}

export async function indexarSolicitud(solicitud) {
  return indexarDocumento({
    tipo: 'solicitud',
    entidadId: solicitud.id,
    titulo: `${solicitud.id} · ${solicitud.tipo}`,
    subtitulo: solicitud.descripcion || solicitud.dependencia,
    texto: [solicitud.descripcion, solicitud.respuesta].filter(Boolean).join(' '),
    estado: solicitud.estado,
    ownerId: solicitud.solicitanteId,
    ruta: `/app/solicitudes/${solicitud.id}`,
  })
}

export async function indexarPqrs(pqrs) {
  return indexarDocumento({
    tipo: 'pqrs',
    entidadId: pqrs.id,
    titulo: `${pqrs.id} · ${pqrs.asunto || pqrs.tipo}`,
    subtitulo: pqrs.tipo,
    texto: [pqrs.descripcion, pqrs.respuesta].filter(Boolean).join(' '),
    estado: pqrs.estado,
    ownerId: pqrs.solicitanteId,
    asignadoA: pqrs.asignadoA,
    ruta: '/app/pqrs',
  })
}

export async function eliminarDelIndice(tipo, entidadId) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento/${tipo}/${entidadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenServicio()}` },
    })
  } catch (err) {
    console.error('[solicitudes-service] no se pudo eliminar del indice de busqueda:', err.message)
  }
}
