import jwt from 'jsonwebtoken'

const URL_BUSQUEDA = process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007'

function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'recursos-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

export async function indexarRecurso(recurso) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenServicio()}` },
      body: JSON.stringify({
        tipo: 'recurso',
        entidadId: recurso.codigo,
        titulo: `${recurso.codigo} · ${recurso.nombre}`,
        subtitulo: `${recurso.tipo} · ${recurso.ubicacion}`,
        texto: recurso.estado,
        estado: recurso.estado,
        ruta: '/app/recursos',
      }),
    })
  } catch (err) {
    console.error('[recursos-service] no se pudo indexar en busqueda-service:', err.message)
  }
}

export async function eliminarRecursoDelIndice(codigo) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento/recurso/${codigo}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenServicio()}` },
    })
  } catch (err) {
    console.error('[recursos-service] no se pudo eliminar del indice de busqueda:', err.message)
  }
}
