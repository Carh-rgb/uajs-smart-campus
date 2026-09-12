import jwt from 'jsonwebtoken'

const URL_BUSQUEDA = process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007'

function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'usuarios-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

export async function indexarUsuario(usuario) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenServicio()}` },
      body: JSON.stringify({
        tipo: 'usuario',
        entidadId: usuario.id,
        titulo: usuario.nombre,
        subtitulo: `${usuario.correo} · ${usuario.rol}`,
        texto: usuario.programa || '',
        estado: usuario.activo ? 'Activo' : 'Inactivo',
        ownerId: usuario.id,
        ruta: '/app/usuarios',
      }),
    })
  } catch (err) {
    console.error('[usuarios-service] no se pudo indexar en busqueda-service:', err.message)
  }
}

export async function eliminarUsuarioDelIndice(id) {
  try {
    await fetch(`${URL_BUSQUEDA}/buscar/documento/usuario/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenServicio()}` },
    })
  } catch (err) {
    console.error('[usuarios-service] no se pudo eliminar del indice de busqueda:', err.message)
  }
}
