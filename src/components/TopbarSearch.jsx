import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usePermissions, MODULOS } from '../context/PermissionsContext.jsx'
import { INFO_POR_MODULO } from './Sidebar.jsx'

export default function TopbarSearch() {
  const { user } = useAuth()
  const { modulosActivos } = usePermissions()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef(null)

  const esAdmin = user?.rol === 'Administrador del sistema'
  const activos = modulosActivos(user?.rol)

  const catalogo = useMemo(() => {
    const base = MODULOS.filter((m) => activos.includes(m.id)).map((m) => ({
      id: m.id,
      label: m.label,
      to: INFO_POR_MODULO[m.id]?.to || '/app',
      icono: INFO_POR_MODULO[m.id]?.icono || '🔎',
    }))
    if (esAdmin) {
      base.push({ id: 'usuarios', label: 'Usuarios', to: '/app/usuarios', icono: '👥' })
    }
    return base
  }, [activos, esAdmin])

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return catalogo.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 6)
  }, [query, catalogo])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const irA = (servicio) => {
    if (!servicio) return
    navigate(servicio.to)
    setQuery('')
    setAbierto(false)
  }

  const handleKeyDown = (e) => {
    if (!resultados.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % resultados.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + resultados.length) % resultados.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      irA(resultados[activeIndex])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  return (
    <div className="topbar__search" ref={wrapRef}>
      <span className="topbar__search-icon" aria-hidden="true">
        🔍
      </span>
      <input
        className="topbar__search-input"
        type="text"
        placeholder="Buscar un servicio (Solicitudes, Reservas, PQRS...)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={handleKeyDown}
        aria-label="Buscar servicios en la plataforma"
      />

      {abierto && query.trim() && (
        <div className="topbar__search-results">
          {resultados.length === 0 && (
            <p className="topbar__search-empty">Sin resultados para “{query}”.</p>
          )}
          {resultados.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`topbar__search-result${i === activeIndex ? ' topbar__search-result--active' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => irA(s)}
            >
              <span className="topbar__search-result-icon">{s.icono}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
