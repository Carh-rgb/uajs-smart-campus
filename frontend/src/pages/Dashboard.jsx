import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSolicitudes } from '../context/SolicitudesContext.jsx'
import { useReservas } from '../context/ReservasContext.jsx'
import { useEventos } from '../context/EventosContext.jsx'
import { usePqrs } from '../context/PqrsContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { useUsers } from '../context/UsersContext.jsx'
import { BrandSpinner } from '../components/BrandSpinner.jsx'
import { promocionesInstitucionales } from '../data/mockData.js'
import { IconoGorro, IconoMegafono, IconoAlerta, IconoChat, IconoHerramientas, IconoUsuarios } from '../components/icons.jsx'

function AccesosRapidos({ enlaces }) {
  return (
    <div className="panel">
      <h3 className="panel__title">Accesos rápidos</h3>
      <div className="quick-list">
        {enlaces.map((e) => (
          <Link key={e.to} className="quick-list__item" to={e.to}>
            {e.label} <span className="quick-list__arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TablaActividad({ actividad }) {
  return (
    <div className="panel">
      <h3 className="panel__title">Actividad reciente</h3>
      <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Servicio</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {actividad.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.servicio}</td>
              <td>{a.fecha}</td>
              <td>
                <StatusBadge estado={a.estado} />
              </td>
            </tr>
          ))}
          {actividad.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No hay actividad todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// Proximos eventos institucionales (fecha de hoy en adelante), usados en
// el dashboard de Estudiante y Docente. Datos reales de EventosContext,
// no inventados.
function ProximosEventos({ eventos }) {
  const hoy = new Date().toISOString().slice(0, 10)
  const proximos = eventos
    .filter((e) => e.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 3)

  return (
    <div className="panel">
      <h3 className="panel__title">
        <IconoGorro style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />
        Próximos eventos
      </h3>
      <div className="quick-list">
        {proximos.map((e) => (
          <div key={e.id} className="quick-list__item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: 600 }}>{e.titulo}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {e.fecha} · {e.hora} · {e.lugar}
              </p>
            </div>
            {e.inscrito && <span className="status-badge status-badge--ok">Inscrito</span>}
          </div>
        ))}
        {proximos.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            No hay eventos programados por ahora.
          </p>
        )}
      </div>
      <Link to="/app/eventos" className="quick-list__arrow" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 600 }}>
        Ver todos los eventos →
      </Link>
    </div>
  )
}

// Panel de contenido institucional (anuncios/beneficios). Es contenido
// de ejemplo (ver mockData.js) para que el panel no quede vacío; la
// universidad lo reemplazaria por sus propias promociones vigentes.
function AnunciosPromociones() {
  return (
    <div className="panel">
      <h3 className="panel__title">
        <IconoMegafono style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />
        Anuncios y beneficios
      </h3>
      <div className="quick-list">
        {promocionesInstitucionales.map((p) => (
          <div key={p.titulo} className="quick-list__item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: 600 }}>{p.titulo}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.descripcion}</p>
            </div>
            <span className="status-badge status-badge--info" style={{ whiteSpace: 'nowrap' }}>{p.vigencia}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// PQRS asignadas al Docente que aun no estan resueltas, con acceso
// directo a responderlas (reutiliza el highlight ya usado en Pqrs.jsx).
function PqrsPorAtender({ pqrs }) {
  const navigate = useNavigate()
  const pendientes = pqrs.filter((p) => p.estado !== 'Resuelta').slice(0, 4)

  return (
    <div className="panel">
      <h3 className="panel__title">
        <IconoChat style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />
        PQRS por atender
      </h3>
      <div className="quick-list">
        {pendientes.map((p) => (
          <button
            key={p.id}
            type="button"
            className="quick-list__item"
            style={{ width: '100%', textAlign: 'left', background: 'transparent', font: 'inherit', alignItems: 'flex-start' }}
            onClick={() => navigate('/app/pqrs', { state: { highlightId: p.id } })}
          >
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: 600 }}>{p.id} · {p.asunto || p.tipo}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.solicitante}</p>
            </div>
            <StatusBadge estado={p.estado} />
          </button>
        ))}
        {pendientes.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            No tienes PQRS pendientes por responder. 🎉
          </p>
        )}
      </div>
    </div>
  )
}

// Solicitudes de prioridad alta sin resolver, para que Administrativo
// las vea primero sin tener que filtrar la tabla completa.
function SolicitudesPrioritarias({ solicitudes }) {
  const navigate = useNavigate()
  const urgentes = solicitudes
    .filter((s) => s.prioridad === 'Alta' && !['Resuelta', 'Cerrada'].includes(s.estado))
    .slice(0, 4)

  return (
    <div className="panel">
      <h3 className="panel__title">
        <IconoAlerta style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6, color: 'var(--color-danger)' }} />
        Solicitudes de prioridad alta
      </h3>
      <div className="quick-list">
        {urgentes.map((s) => (
          <button
            key={s.id}
            type="button"
            className="quick-list__item"
            style={{ width: '100%', textAlign: 'left', background: 'transparent', font: 'inherit', alignItems: 'flex-start' }}
            onClick={() => navigate(`/app/solicitudes/${s.id}`)}
          >
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: 600 }}>{s.id} · {s.tipo}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.solicitanteNombre}</p>
            </div>
            <StatusBadge estado={s.estado} />
          </button>
        ))}
        {urgentes.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            No hay solicitudes urgentes pendientes.
          </p>
        )}
      </div>
    </div>
  )
}

// Disponibilidad de equipos reservables (Recursos<->Reservas ya
// sincronizados), visible para Administrativo y Admin.
function DisponibilidadEquipos({ equipos }) {
  const conStock = equipos.filter((e) => e.stock > 0).length
  return (
    <div className="panel">
      <h3 className="panel__title">
        <IconoHerramientas style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />
        Disponibilidad de equipos
      </h3>
      <div className="quick-list">
        {equipos.slice(0, 4).map((e) => (
          <div key={e.codigo} className="quick-list__item" style={{ cursor: 'default' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: 600 }}>{e.nombre}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{e.tipo}</p>
            </div>
            <span className={`status-badge ${e.stock > 0 ? 'status-badge--ok' : 'status-badge--bad'}`}>
              {e.stock} {e.stock === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>
        ))}
        {equipos.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            Aún no hay equipos en el catálogo.
          </p>
        )}
      </div>
      <Link to="/app/recursos" className="quick-list__arrow" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 600 }}>
        {conStock} de {equipos.length} con disponibilidad · Ver recursos →
      </Link>
    </div>
  )
}

// Distribucion de usuarios por rol, solo para Admin.
function UsuariosPorRolMini({ usuarios }) {
  const roles = ['Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema']
  return (
    <div className="panel">
      <h3 className="panel__title">
        <IconoUsuarios style={{ width: 15, height: 15, verticalAlign: -2, marginRight: 6 }} />
        Usuarios por rol
      </h3>
      <div className="quick-list">
        {roles.map((rol) => {
          const total = usuarios.filter((u) => u.rol === rol).length
          if (total === 0) return null
          return (
            <div key={rol} className="quick-list__item" style={{ cursor: 'default' }}>
              <span>{rol}</span>
              <span className="status-badge status-badge--info">{total}</span>
            </div>
          )
        })}
      </div>
      <Link to="/app/usuarios" className="quick-list__arrow" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 600 }}>
        Gestionar usuarios →
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { solicitudes, cargando: cargandoSolicitudes } = useSolicitudes()
  const { reservas, catalogo, cargando: cargandoReservas } = useReservas()
  const { eventos } = useEventos()
  const { pqrs, cargando: cargandoPqrs } = usePqrs()
  const { noLeidasCount } = useNotifications()
  const { usuarios } = useUsers()

  const cargando = cargandoSolicitudes || cargandoReservas || cargandoPqrs

  const rol = user?.rol
  const esAdministrativo = rol === 'Administrativo'
  const esAdmin = rol === 'Administrador del sistema'
  const esEstudiante = rol === 'Estudiante'
  const esDocente = rol === 'Docente'
  const esPersonal = esEstudiante || esDocente

  // El backend ya devuelve solo lo propio para Estudiante/Docente.
  const misSolicitudes = solicitudes
  const misReservas = reservas
  const misPqrsAsignadas = pqrs.filter((p) => p.estado !== 'Resuelta')

  let kpis = []
  let actividad = []
  let enlaces = []

  if (esAdmin) {
    kpis = [
      { label: 'Usuarios activos', value: usuarios.filter((u) => u.activo).length },
      { label: 'Usuarios inactivos', value: usuarios.filter((u) => !u.activo).length },
      { label: 'Solicitudes totales', value: solicitudes.length },
      { label: 'Notificaciones no leídas', value: noLeidasCount },
    ]
    actividad = [
      ...solicitudes.slice(0, 2).map((s) => ({ id: s.id, servicio: `Solicitud · ${s.tipo}`, fecha: s.fecha, estado: s.estado })),
      ...reservas.slice(0, 2).map((r) => ({ id: r.id, servicio: `Reserva · ${r.espacio}`, fecha: r.fecha, estado: r.estado })),
    ]
    enlaces = [
      { to: '/app/usuarios', label: 'Gestionar usuarios y permisos' },
      { to: '/app/reportes', label: 'Ver reportes' },
      { to: '/app/notificaciones', label: 'Ver notificaciones' },
    ]
  } else if (esAdministrativo) {
    kpis = [
      { label: 'Solicitudes por gestionar', value: solicitudes.filter((s) => !['Resuelta', 'Cerrada'].includes(s.estado)).length },
      { label: 'Reservas pendientes', value: reservas.filter((r) => r.estado === 'Pendiente').length },
      { label: 'PQRS sin responder', value: pqrs.filter((p) => p.estado !== 'Resuelta').length },
      { label: 'Eventos programados', value: eventos.length },
    ]
    actividad = [
      ...solicitudes.slice(0, 2).map((s) => ({ id: s.id, servicio: `Solicitud · ${s.tipo}`, fecha: s.fecha, estado: s.estado })),
      ...reservas.slice(0, 2).map((r) => ({ id: r.id, servicio: `Reserva · ${r.espacio}`, fecha: r.fecha, estado: r.estado })),
    ]
    enlaces = [
      { to: '/app/solicitudes', label: 'Gestionar solicitudes' },
      { to: '/app/reservas', label: 'Gestionar reservas' },
      { to: '/app/pqrs', label: 'Gestionar PQRS' },
      { to: '/app/reportes', label: 'Ver reportes' },
    ]
  } else if (esPersonal) {
    kpis = [
      { label: 'Mis solicitudes pendientes', value: misSolicitudes.filter((s) => !['Resuelta', 'Cerrada'].includes(s.estado)).length },
      { label: 'Mis reservas activas', value: misReservas.filter((r) => r.estado !== 'Cancelada').length },
      esDocente
        ? { label: 'PQRS asignadas a mí', value: misPqrsAsignadas.length }
        : { label: 'Notificaciones no leídas', value: noLeidasCount },
      { label: 'Próximos eventos', value: eventos.filter((e) => e.fecha >= new Date().toISOString().slice(0, 10)).length },
    ]
    actividad = [
      ...misSolicitudes.slice(0, 2).map((s) => ({ id: s.id, servicio: `Solicitud · ${s.tipo}`, fecha: s.fecha, estado: s.estado })),
      ...misReservas.slice(0, 2).map((r) => ({ id: r.id, servicio: `Reserva · ${r.espacio}`, fecha: r.fecha, estado: r.estado })),
    ]
    enlaces = [
      { to: '/app/solicitudes', label: 'Nueva solicitud' },
      { to: '/app/reservas', label: 'Hacer una reserva' },
      { to: '/app/notificaciones', label: 'Ver notificaciones' },
      { to: '/app/eventos', label: 'Consultar eventos' },
    ]
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Inicio</h1>
        <p className="view-header__subtitle">
          Resumen de tu actividad en UAJS Smart Campus
        </p>
      </div>

      {cargando ? (
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando tu panorama..." />
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            {kpis.map((k) => (
              <KpiCard key={k.label} label={k.label} value={k.value} />
            ))}
          </div>

          <div className="content-row">
            <TablaActividad actividad={actividad} />
            <AccesosRapidos enlaces={enlaces} />
          </div>

          {esEstudiante && (
            <div className="content-row">
              <ProximosEventos eventos={eventos} />
              <AnunciosPromociones />
            </div>
          )}

          {esDocente && (
            <div className="content-row">
              <PqrsPorAtender pqrs={pqrs} />
              <ProximosEventos eventos={eventos} />
            </div>
          )}

          {esAdministrativo && (
            <div className="content-row">
              <SolicitudesPrioritarias solicitudes={solicitudes} />
              <DisponibilidadEquipos equipos={catalogo.equipos} />
            </div>
          )}

          {esAdmin && (
            <div className="content-row">
              <UsuariosPorRolMini usuarios={usuarios} />
              <DisponibilidadEquipos equipos={catalogo.equipos} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
