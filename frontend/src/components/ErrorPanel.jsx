import React from 'react'

// Estado de error de una lista o pantalla: explica que paso y permite
// reintentar. Se usa cuando falla la carga desde la API (servidor caido,
// sin conexion, error del backend) para no mostrar una lista vacia que
// parezca "no hay datos".
export default function ErrorPanel({ mensaje, onReintentar }) {
  return (
    <div className="panel" role="alert" style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--color-danger)', fontWeight: 600, margin: '0 0 6px' }}>No se pudo cargar la información</p>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: '0 0 14px' }}>{mensaje}</p>
      {onReintentar && (
        <button className="btn btn--primary btn--sm" style={{ width: 'auto' }} onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}
