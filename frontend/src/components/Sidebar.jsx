import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usePermissions, MODULOS } from '../context/PermissionsContext.jsx'
import {
  IconoCasa,
  IconoUsuario,
  IconoUsuarios,
  IconoDocumento,
  IconoCalendario,
  IconoHerramientas,
  IconoGorro,
  IconoCampana,
  IconoChat,
  IconoGrafico,
} from './icons.jsx'

export const INFO_POR_MODULO = {
  inicio: { to: '/app', end: true, Icono: IconoCasa },
  perfil: { to: '/app/perfil', Icono: IconoUsuario },
  solicitudes: { to: '/app/solicitudes', Icono: IconoDocumento },
  reservas: { to: '/app/reservas', Icono: IconoCalendario },
  recursos: { to: '/app/recursos', Icono: IconoHerramientas },
  eventos: { to: '/app/eventos', Icono: IconoGorro },
  notificaciones: { to: '/app/notificaciones', Icono: IconoCampana },
  pqrs: { to: '/app/pqrs', Icono: IconoChat },
  reportes: { to: '/app/reportes', Icono: IconoGrafico },
}

function ChevronIcon() {
  return (
    <svg className="sidebar__toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth()
  const { modulosActivos } = usePermissions()
  const [colapsado, setColapsado] = useState(false)

  const activos = modulosActivos(user?.rol)
  const esAdmin = user?.rol === 'Administrador del sistema'

  const items = MODULOS.filter((m) => activos.includes(m.id)).map((m) => ({
    ...m,
    ...INFO_POR_MODULO[m.id],
  }))

  const handleClickLink = () => {
    onCloseMobile?.()
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onCloseMobile}
      />
      <aside
        className={`sidebar ${colapsado ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
      >
        <div className="sidebar__brand">
          <div className="sidebar__badge">
            <img src="/logo-192.png" alt="UAJS" className="sidebar__badge-img" />
          </div>
          <div className="sidebar__wordmark">
            <strong className="sidebar__wordmark-title">UAJS</strong>
            <span className="sidebar__wordmark-subtitle">Smart Campus</span>
          </div>
          <button className="sidebar__mobile-close" onClick={onCloseMobile} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <button
          className="sidebar__collapse-btn"
          onClick={() => setColapsado((c) => !c)}
          aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'}
          title={colapsado ? 'Expandir menú' : 'Contraer menú'}
        >
          <ChevronIcon />
          <span className="sidebar__collapse-label">Contraer menú</span>
        </button>

        <nav className="sidebar__nav">
          {items.map((m) => (
            <NavLink
              key={m.id}
              to={m.to}
              end={m.end}
              data-tooltip={m.label}
              onClick={handleClickLink}
              className={({ isActive }) =>
                `sidebar__item${isActive ? ' sidebar__item--active' : ''}`
              }
            >
              <span className="sidebar__item-icon">
                <m.Icono />
              </span>
              <span className="sidebar__label">{m.label}</span>
            </NavLink>
          ))}

          {esAdmin && (
            <NavLink
              to="/app/usuarios"
              data-tooltip="Usuarios"
              onClick={handleClickLink}
              className={({ isActive }) =>
                `sidebar__item${isActive ? ' sidebar__item--active' : ''}`
              }
            >
              <span className="sidebar__item-icon">
                <IconoUsuarios />
              </span>
              <span className="sidebar__label">Usuarios</span>
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  )
}
