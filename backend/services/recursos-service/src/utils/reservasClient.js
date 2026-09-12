import jwt from 'jsonwebtoken'

const RESERVAS_SERVICE_URL = process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003'

// Token de corta duracion para la llamada de servicio a servicio, firmado
// con el mismo JWT_SECRET que comparten todos los microservicios (el
// unico acoplamiento entre ellos, ya usado para validar sesiones de
// usuario). No representa a ningun usuario real.
function firmarTokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'recursos-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' },
  )
}

// Mantiene sincronizado el catalogo de equipos reservables de
// reservas-service con los recursos de tipo Audiovisual/Equipo de
// computo. Si reservas-service no responde, se registra el error pero
// no se interrumpe la operacion sobre el recurso (crear/eliminar debe
// funcionar aunque el otro servicio este caido).
export async function sincronizarEquipoEnReservas({ codigo, nombre, tipo, delta, eliminarSiVacio }) {
  try {
    await fetch(`${RESERVAS_SERVICE_URL}/reservas/equipos/sync`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firmarTokenServicio()}`,
      },
      body: JSON.stringify({ codigo, nombre, tipo, delta, eliminarSiVacio }),
    })
  } catch (err) {
    console.error('[recursos-service] no se pudo sincronizar con reservas-service:', err.message)
  }
}
