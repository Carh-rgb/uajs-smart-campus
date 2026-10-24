import React, { useEffect, useState } from 'react'
import { estadoBackend } from '../api/client.js'

const ESTILO = {
  background: 'var(--color-danger-bg)',
  color: 'var(--color-danger)',
  padding: '10px 24px',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
}

// Aviso global cuando el backend no esta completamente disponible. Distingue
// entre "el Gateway no responde" y "el Gateway responde pero algun
// microservicio esta caido" (solo fallan los modulos que dependen de el).
export default function BackendStatusBanner() {
  const [estado, setEstado] = useState({ estado: 'ok', caidos: [] })

  useEffect(() => {
    let activo = true
    const verificar = async () => {
      const resultado = await estadoBackend()
      if (activo) setEstado(resultado)
    }
    verificar()
    const intervalo = setInterval(verificar, 10000)
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [])

  if (estado.estado === 'ok') return null

  if (estado.estado === 'degradado') {
    return (
      <div style={ESTILO} role="alert">
        Algunos servicios no están respondiendo{estado.caidos.length > 0 ? ` (${estado.caidos.join(', ')})` : ''}. Los módulos que
        dependen de ellos pueden fallar; el resto de la aplicación sigue funcionando.
      </div>
    )
  }

  return (
    <div style={ESTILO} role="alert">
      No se pudo conectar con el servidor. Verifica que el backend esté corriendo (Docker + <code>npm run dev</code> en la
      carpeta <code>backend</code>) — los datos no se han perdido, solo no se pueden cargar en este momento.
    </div>
  )
}
