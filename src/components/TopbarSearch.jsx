import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usePermissions, MODULOS } from '../context/PermissionsContext.jsx'
import { useSolicitudes } from '../context/SolicitudesContext.jsx'
import { usePqrs } from '../context/PqrsContext.jsx'
import { useReservas } from '../context/ReservasContext.jsx'
import { useEventos } from '../context/EventosContext.jsx'
import { useUsers } from '../context/UsersContext.jsx'
import { api } from '../api/client.js'
import { INFO_POR_MODULO } from './Sidebar.jsx'

const incluye = (valor, q) => typeof valor === 'string' && valor.toLowerCase().includes(q)
const coincideAlguno = (campos, q) => campos.some((c) => incluye(c, q))

export default function TopbarSearch() {
  const { user } = useAuth()
  const { modulosActivos } = usePermissions()
  const { solicitudes } = useSolicitudes()
  const { pqrs } = usePqrs()
  const { reservas } = useReservas()
  const { eventos } = useEventos()
  const { usuarios } = useUsers()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recursos, setRecursos] = useState([])
  const wrapRef = useRef(null)

  const esAdmin = user?.rol === 'Administrador del sistema'
  const esAdministrativo = user?.rol === 'Administrativo' || esAdmin
  const activos = modulosActivos(user?.rol)

  // El catalogo de recursos no vive en un context global (solo la pagina
  // Recursos lo consulta), asi que aqui se trae una copia liviana propia,
  // igual que hacen los demas modulos, solo para quien puede verlos.
  useEffect(() => {
    if (!esAdministrativo) {
      setRecursos([])
      return
    }
    api
      .get('/recursos')
      .then(setRecursos)
      .catch(() => setRecursos([]))
  }, [esAdministrativo])

  const catalogoModulos = useMemo(() => {
    const base = MODULOS.filter((m) => activos.includes(m.id)).map((m) => ({
      id: `modulo-${m.id}`,
      categoria: 'Módulos',
      titulo: m.label,
      subtitulo: null,
      to: INFO_POR_MODULO[m.id]?.to || '/app',
      icono: INFO_POR_MODULO[m.id]?.icono || '🔎',
    }))
    if (esAdmin) {
      base.push({ id: 'modulo-usuarios', categoria: 'Módulos', titulo: 'Usuarios', subtitulo: null, to: '/app/usuarios', icono: '👥' })
    }
    return base
  }, [activos, esAdmin])

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const grupos = []

    const modulos = catalogoModulos.filter((m) => incluye(m.titulo, q))
    if (modulos.length) grupos.push({ categoria: 'Módulos', items: modulos.slice(0, 5) })

    const solicitudesMatch = solicitudes
      .filter((s) => coincideAlguno([s.id, s.tipo, s.dependencia, s.descripcion, s.estado, s.asignadoA], q))
      .slice(0, 4)
      .map((s) => ({
        id: `solicitud-${s.id}`,
        categoria: 'Solicitudes',
        titulo: `${s.id} · ${s.tipo}`,
        subtitulo: s.descripcion || s.dependencia,
        icono: '📄',
        to: `/app/solicitudes/${s.id}`,
      }))
    if (solicitudesMatch.length) grupos.push({ categoria: 'Solicitudes', items: solicitudesMatch })

    const pqrsMatch = pqrs
      .filter((p) => coincideAlguno([p.id, p.tipo, p.asunto, p.descripcion, p.estado, p.solicitante, p.asignadoA], q))
      .slice(0, 4)
      .map((p) => ({
        id: `pqrs-${p.id}`,
        categoria: 'PQRS',
        titulo: `${p.id} · ${p.asunto || p.tipo}`,
        subtitulo: p.descripcion,
        icono: '📝',
        to: '/app/pqrs',
        state: { highlightId: p.id },
      }))
    if (pqrsMatch.length) grupos.push({ categoria: 'PQRS', items: pqrsMatch })

    const reservasMatch = reservas
      .filter((r) => coincideAlguno([r.id, r.espacio, r.motivo, r.estado, r.solicitanteNombre, r.rolSolicitante, r.fecha], q))
      .slice(0, 4)
      .map((r) => ({
        id: `reserva-${r.id}`,
        categoria: 'Reservas',
        titulo: `${r.id} · ${r.espacio}`,
        subtitulo: `${r.fecha} · ${r.estado}`,
        icono: '📅',
        to: '/app/reservas',
        state: { highlightId: r.id },
      }))
    if (reservasMatch.length) grupos.push({ categoria: 'Reservas', items: reservasMatch })

    const eventosMatch = eventos
      .filter((e) => coincideAlguno([e.id, e.titulo, e.lugar, e.ponente, e.descripcion, e.fecha], q))
      .slice(0, 4)
      .map((e) => ({
        id: `evento-${e.id}`,
        categoria: 'Eventos',
        titulo: e.titulo,
        subtitulo: `${e.fecha} · ${e.lugar}`,
        icono: '🎓',
        to: '/app/eventos',
        state: { highlightId: e.id },
      }))
    if (eventosMatch.length) grupos.push({ categoria: 'Eventos', items: eventosMatch })

    if (esAdministrativo) {
      const recursosMatch = recursos
        .filter((r) => coincideAlguno([r.codigo, r.nombre, r.tipo, r.ubicacion, r.estado], q))
        .slice(0, 4)
        .map((r) => ({
          id: `recurso-${r.codigo}`,
          categoria: 'Recursos',
          titulo: `${r.codigo} · ${r.nombre}`,
          subtitulo: `${r.tipo} · ${r.ubicacion}`,
          icono: '🧰',
          to: '/app/recursos',
          state: { highlightId: r.codigo },
        }))
      if (recursosMatch.length) grupos.push({ categoria: 'Recursos', items: recursosMatch })
    }

    if (esAdmin) {
      const usuariosMatch = usuarios
        .filter((u) => coincideAlguno([u.nombre, u.correo, u.rol, u.programa], q))
        .slice(0, 4)
        .map((u) => ({
          id: `usuario-${u.id}`,
          categoria: 'Usuarios',
          titulo: u.nombre,
          subtitulo: `${u.correo} · ${u.rol}`,
          icono: '👥',
          to: '/app/usuarios',
          state: { highlightId: u.id },
        }))
      if (usuariosMatch.length) grupos.push({ categoria: 'Usuarios', items: usuariosMatch })
    }

    return grupos
  }, [query, catalogoModulos, solicitudes, pqrs, reservas, eventos, recursos, usuarios, esAdministrativo, esAdmin])

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
        🔍
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
          {planos.length === 0 && (
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
                    <span className="topbar__search-result-icon">{item.icono}</span>
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
