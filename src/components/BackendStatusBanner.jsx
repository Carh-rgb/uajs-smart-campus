import React, { useEffect, useState } from 'react'
import { backendDisponible } from '../api/client.js'

export default function BackendStatusBanner() {
  const [caido, setCaido] = useState(false)

  useEffect(() => {
    let activo = true
    const verificar = async () => {
      const ok = await backendDisponible()
      if (activo) setCaido(!ok)
    }
    verificar()
    const intervalo = setInterval(verificar, 10000)
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [])

  if (!caido) return null

  return (
    <div
      style={{
        background: 'var(--color-danger-bg)',
        color: 'var(--color-danger)',
        padding: '10px 24px',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      No se pudo conectar con el servidor. Verifica que el backend esté corriendo (Docker + <code>npm run dev</code> en la carpeta <code>server</code>) — los datos no se han perdido, solo no se pueden cargar en este momento.
    </div>
  )
}
