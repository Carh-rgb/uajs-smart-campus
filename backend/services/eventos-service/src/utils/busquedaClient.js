import jwt from 'jsonwebtoken'

const URL_BUSQUEDA = process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007'

function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'eventos-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

export async function indexarEvento(evento) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenServicio()}` },
      body: JSON.stringify({
        tipo: 'evento',
        entidadId: evento.id,
        titulo: evento.titulo,
        subtitulo: `${evento.fecha} · ${evento.lugar}`,
        texto: [evento.descripcion, evento.ponente, evento.facultad].filter(Boolean).join(' '),
        estado: evento.estado,
        ruta: '/app/eventos',
      }),
    })
  } catch (err) {
    console.error('[eventos-service] no se pudo indexar en busqueda-service:', err.message)
  }
}

export async function eliminarEventoDelIndice(id) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento/evento/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenServicio()}` },
    })
  } catch (err) {
    console.error('[eventos-service] no se pudo eliminar del indice de busqueda:', err.message)
  }
}
