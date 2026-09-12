import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { rutaDeNotificacion } from '../utils/notificaciones.js'
import TopbarSearch from './TopbarSearch.jsx'
import { IconoCampana, IconoUsuario } from './icons.jsx'

function getIniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function Avatar({ user, className }) {
  if (user?.fotoPerfil) {
    return <img src={user.fotoPerfil} alt="" className={className} />
  }
  return <div className={className}>{getIniciales(user?.nombre || 'US')}</div>
}

export default function Topbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth()
  const { tema, toggleTema } = useTheme()
  const { notificaciones, marcarLeida, marcarTodasLeidas, noLeidasCount } = useNotifications()
  const navigate = useNavigate()
  const [previewAbierto, setPreviewAbierto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const bellRef = useRef(null)
  const menuRef = useRef(null)

  const preview = notificaciones.slice(0, 4)

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setPreviewAbierto(false)
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const handleClickNotificacion = (n) => {
    if (!n.leida) marcarLeida(n.id)
    setPreviewAbierto(false)
    const ruta = rutaDeNotificacion(n.categoria)
    if (ruta) navigate(ruta)
  }

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
            <IconoCampana />
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
                    onClick={() => handleClickNotificacion(n)}
                    title={rutaDeNotificacion(n.categoria) ? 'Ir al módulo' : undefined}
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

        <div className="topbar__user-wrap" ref={menuRef}>
          <button className="topbar__user" onClick={() => setMenuAbierto((v) => !v)}>
            <Avatar user={user} className="topbar__avatar" />
            <div>
              <p className="topbar__user-name">{user?.nombre || 'Usuario'}</p>
              <p className="topbar__user-role">{user?.rol || ''}</p>
            </div>
            <span className={`topbar__user-caret ${menuAbierto ? 'topbar__user-caret--up' : ''}`}>▾</span>
          </button>

          {menuAbierto && (
            <div className="user-menu">
              <div className="user-menu__header">
                <Avatar user={user} className="user-menu__avatar" />
                <div>
                  <p className="user-menu__name">{user?.nombre}</p>
                  <p className="user-menu__email">{user?.correo}</p>
                </div>
              </div>

              <Link to="/app/perfil" className="user-menu__item" onClick={() => setMenuAbierto(false)}>
                <span className="user-menu__item-icon">
                  <IconoUsuario />
                </span>
                Ver perfil
              </Link>

              <button className="user-menu__item" onClick={toggleTema}>
                <span className="user-menu__item-icon">{tema === 'dark' ? '☀️' : '🌙'}</span>
                {tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </button>

              <div className="user-menu__divider" />

              <button className="user-menu__item user-menu__item--danger" onClick={logout}>
                <span className="user-menu__item-icon">⏻</span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
