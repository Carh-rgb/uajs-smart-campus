import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch.js'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { BrandSpinner } from '../components/BrandSpinner.jsx'
import { rutaDeNotificacion } from '../utils/notificaciones.js'

const FILTROS = ['Todas', 'No leídas', 'Sistema']

export default function Notificaciones() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('Todas')
  const { notificaciones, cargando, marcarLeida, marcarTodasLeidas, eliminarNotificacion, noLeidasCount } = useNotifications()

  const handleClickNotificacion = (n) => {
    if (!n.leida) marcarLeida(n.id)
    const ruta = rutaDeNotificacion(n.categoria)
    if (ruta) navigate(ruta)
  }

  const { data } = useFetch(
    () => notificaciones,
    (n) => {
      if (filtro === 'Todas') return true
      if (filtro === 'No leídas') return !n.leida
      if (filtro === 'Sistema') return n.categoria === 'Institucional'
      return true
    },
    [filtro, notificaciones],
  )

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Notificaciones</h1>
        <p className="view-header__subtitle">
          Centro de mensajes e historial de notificaciones
        </p>
      </div>

      <div className="toolbar">
        {FILTROS.map((f) => (
          <button
            key={f}
            className="btn btn--sm"
            style={{
              width: 'auto',
              background: filtro === f ? 'var(--color-navy)' : 'transparent',
              color: filtro === f ? '#fff' : 'var(--color-navy)',
              border: '1px solid var(--color-border)',
            }}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}

        {noLeidasCount > 0 && (
          <button
            className="btn btn--sm"
            style={{ width: 'auto', marginLeft: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-navy)' }}
            onClick={marcarTodasLeidas}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {cargando ? (
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando notificaciones..." />
        </div>
      ) : (
      <div className="notif-list">
        {data.map((n) => (
          <div
            key={n.id}
            className={`notif-item ${!n.leida ? 'notif-item--unread' : ''}`}
            onClick={() => handleClickNotificacion(n)}
            style={{ cursor: !n.leida || rutaDeNotificacion(n.categoria) ? 'pointer' : 'default' }}
          >
            <div style={{ flex: 1 }} title={rutaDeNotificacion(n.categoria) ? 'Ir al módulo' : undefined}>
              <p className="notif-item__category">{n.categoria}</p>
              <p className="notif-item__text">{n.mensaje}</p>
              <p className="notif-item__date">{n.fecha}</p>
            </div>
            {!n.leida && <span className="notif-item__dot" title="No leída" />}
            <button
              className="btn btn--sm"
              style={{
                width: 'auto',
                background: 'transparent',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                marginLeft: 12,
                flexShrink: 0,
              }}
              onClick={(e) => {
                e.stopPropagation()
                eliminarNotificacion(n.id)
              }}
            >
              Eliminar
            </button>
          </div>
        ))}
        {data.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            No hay notificaciones para este filtro.
          </p>
        )}
      </div>
      )}
    </div>
  )
}
