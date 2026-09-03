import React, { useState } from 'react'
import { useFetch } from '../hooks/useFetch.js'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { BrandSpinner } from '../components/BrandSpinner.jsx'

const FILTROS = ['Todas', 'No leídas', 'Sistema']

export default function Notificaciones() {
  const [filtro, setFiltro] = useState('Todas')
  const { notificaciones, cargando, marcarLeida, marcarTodasLeidas, noLeidasCount } = useNotifications()

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
            onClick={() => !n.leida && marcarLeida(n.id)}
            style={{ cursor: n.leida ? 'default' : 'pointer' }}
          >
            <div style={{ flex: 1 }}>
              <p className="notif-item__category">{n.categoria}</p>
              <p className="notif-item__text">{n.mensaje}</p>
              <p className="notif-item__date">{n.fecha}</p>
            </div>
            {!n.leida && <span className="notif-item__dot" title="No leída" />}
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
