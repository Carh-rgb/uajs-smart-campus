import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usePermissions, MODULOS } from '../context/PermissionsContext.jsx'
import { api } from '../api/client.js'
import { INFO_POR_MODULO } from './Sidebar.jsx'
import { IconoLupa, IconoDocumento, IconoChat, IconoCalendario, IconoGorro, IconoHerramientas, IconoUsuarios } from './icons.jsx'

const incluye = (valor, q) => typeof valor === 'string' && valor.toLowerCase().includes(q)

const ICONO_POR_TIPO = {
  solicitud: IconoDocumento,
  pqrs: IconoChat,
  reserva: IconoCalendario,
  evento: IconoGorro,
  recurso: IconoHerramientas,
  usuario: IconoUsuarios,
}

const CATEGORIA_POR_TIPO = {
  solicitud: 'Solicitudes',
  pqrs: 'PQRS',
  reserva: 'Reservas',
  evento: 'Eventos',
  recurso: 'Recursos',
  usuario: 'Usuarios',
}

export default function TopbarSearch() {
  const { user } = useAuth()
  const { modulosActivos } = usePermissions()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [buscando, setBuscando] = useState(false)
  const wrapRef = useRef(null)

  const esAdmin = user?.rol === 'Administrador del sistema'
  const activos = modulosActivos(user?.rol)

  const catalogoModulos = useMemo(() => {
    const base = MODULOS.filter((m) => activos.includes(m.id)).map((m) => ({
      id: `modulo-${m.id}`,
      titulo: m.label,
      to: INFO_POR_MODULO[m.id]?.to || '/app',
      Icono: INFO_POR_MODULO[m.id]?.Icono || IconoLupa,
    }))
    if (esAdmin) {
      base.push({ id: 'modulo-usuarios', titulo: 'Usuarios', to: '/app/usuarios', Icono: IconoUsuarios })
    }
    return base
  }, [activos, esAdmin])

  // Busqueda de texto completo (Elasticsearch, vía /api/buscar) para todo
  // lo que no sean modulos. Pequeno debounce para no disparar una peticion
  // por cada tecla; el backend ya filtra los resultados segun lo que el
  // rol del usuario puede ver (ver busqueda-service/controllers/buscar).
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResultadosBusqueda([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    const timer = setTimeout(() => {
      api
        .get(`/buscar?q=${encodeURIComponent(q)}`)
        .then(setResultadosBusqueda)
        .catch(() => setResultadosBusqueda([]))
        .finally(() => setBuscando(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const grupos = []

    const modulos = catalogoModulos.filter((m) => incluye(m.titulo, q))
    if (modulos.length) {
      grupos.push({
        categoria: 'Módulos',
        items: modulos.slice(0, 5).map((m) => ({ id: m.id, titulo: m.titulo, subtitulo: null, Icono: m.Icono, to: m.to })),
      })
    }

    const porCategoria = new Map()
    for (const doc of resultadosBusqueda) {
      const categoria = CATEGORIA_POR_TIPO[doc.tipo]
      if (!categoria) continue
      if (!porCategoria.has(categoria)) porCategoria.set(categoria, [])
      porCategoria.get(categoria).push({
        id: `${doc.tipo}-${doc.entidadId}`,
        titulo: doc.titulo,
        subtitulo: doc.subtitulo,
        Icono: ICONO_POR_TIPO[doc.tipo] || IconoLupa,
        to: doc.ruta,
        // Solicitudes tiene pagina de detalle propia; el resto navega al
        // modulo y resalta la fila/tarjeta exacta (useHighlightRow).
        state: doc.tipo === 'solicitud' ? undefined : { highlightId: doc.entidadId },
      })
    }
    for (const [categoria, items] of porCategoria) {
      grupos.push({ categoria, items: items.slice(0, 6) })
    }

    return grupos
  }, [query, catalogoModulos, resultadosBusqueda])

  const planos = useMemo(() => resultados.flatMap((g) => g.items), [resultados])

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

  const irA = (item) => {
    if (!item) return
    navigate(item.to, item.state ? { state: item.state } : undefined)
    setQuery('')
    setAbierto(false)
  }

  const handleKeyDown = (e) => {
    if (!planos.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % planos.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + planos.length) % planos.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      irA(planos[activeIndex])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  let indiceGlobal = -1

  return (
    <div className="topbar__search" ref={wrapRef}>
      <span className="topbar__search-icon" aria-hidden="true">
        <IconoLupa />
      </span>
      <input
        className="topbar__search-input"
        type="text"
        placeholder="Buscar solicitudes, PQRS, reservas, eventos..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={handleKeyDown}
        aria-label="Buscar en la plataforma"
      />

      {abierto && query.trim() && (
        <div className="topbar__search-results">
          {!buscando && planos.length === 0 && (
            <p className="topbar__search-empty">Sin resultados para “{query}”.</p>
          )}
          {resultados.map((grupo) => (
            <div key={grupo.categoria} className="topbar__search-group">
              <p className="topbar__search-group-title">{grupo.categoria}</p>
              {grupo.items.map((item) => {
                indiceGlobal += 1
                const i = indiceGlobal
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`topbar__search-result${i === activeIndex ? ' topbar__search-result--active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => irA(item)}
                  >
                    <span className="topbar__search-result-icon">
                      <item.Icono />
                    </span>
                    <span className="topbar__search-result-text">
                      <span className="topbar__search-result-titulo">{item.titulo}</span>
                      {item.subtitulo && (
                        <span className="topbar__search-result-subtitulo">{item.subtitulo}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
