import jwt from 'jsonwebtoken'

const URL_BUSQUEDA = process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007'

function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'reservas-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

export async function indexarReserva(reserva) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenServicio()}` },
      body: JSON.stringify({
        tipo: 'reserva',
        entidadId: reserva.id,
        titulo: `${reserva.id} · ${reserva.espacio}`,
        subtitulo: `${reserva.fecha} · ${reserva.estado}`,
        texto: reserva.motivo || '',
        estado: reserva.estado,
        ownerId: reserva.solicitanteId,
        ruta: '/app/reservas',
      }),
    })
  } catch (err) {
    console.error('[reservas-service] no se pudo indexar en busqueda-service:', err.message)
  }
}

export async function eliminarReservaDelIndice(id) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento/reserva/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenServicio()}` },
    })
  } catch (err) {
    console.error('[reservas-service] no se pudo eliminar del indice de busqueda:', err.message)
  }
}
