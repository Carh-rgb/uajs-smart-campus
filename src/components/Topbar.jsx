import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'
import TopbarSearch from './TopbarSearch.jsx'

function getIniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function Topbar({ onToggleMobileMenu }) {
  const { user } = useAuth()
  const { notificaciones, marcarLeida, marcarTodasLeidas, noLeidasCount } = useNotifications()
  const [previewAbierto, setPreviewAbierto] = useState(false)
  const bellRef = useRef(null)

  const preview = notificaciones.slice(0, 4)

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setPreviewAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  return (
    <header className="topbar">
      <button className="topbar__hamburger" onClick={onToggleMobileMenu} aria-label="Abrir menú">
        ☰
      </button>

      <TopbarSearch />

      <div className="topbar__right">
        <div className="topbar__bell-wrap" ref={bellRef}>
          <button
            className="topbar__bell"
            onClick={() => setPreviewAbierto((v) => !v)}
            aria-label="Ver notificaciones"
          >
            🔔
            {noLeidasCount > 0 && <span className="topbar__bell-badge">{noLeidasCount}</span>}
          </button>

          {previewAbierto && (
            <div className="notif-preview">
              <div className="notif-preview__header">
                <span>Notificaciones</span>
                {noLeidasCount > 0 && (
                  <button className="notif-preview__markall" onClick={marcarTodasLeidas}>
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div className="notif-preview__list">
                {preview.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-preview__item ${!n.leida ? 'notif-preview__item--unread' : ''}`}
                    onClick={() => marcarLeida(n.id)}
                  >
                    <p className="notif-preview__category">{n.categoria}</p>
                    <p className="notif-preview__text">{n.mensaje}</p>
                    <p className="notif-preview__date">{n.fecha}</p>
                  </div>
                ))}
                {preview.length === 0 && (
                  <p className="notif-preview__empty">No tienes notificaciones.</p>
                )}
              </div>

              <Link
                to="/app/notificaciones"
                className="notif-preview__footer"
                onClick={() => setPreviewAbierto(false)}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          )}
        </div>

        <Link to="/app/perfil" className="topbar__user">
          <div className="topbar__avatar">{getIniciales(user?.nombre || 'US')}</div>
          <div>
            <p className="topbar__user-name">{user?.nombre || 'Usuario'}</p>
            <p className="topbar__user-role">{user?.rol || ''}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
