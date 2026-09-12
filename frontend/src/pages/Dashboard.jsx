import React from 'react'
import { Link } from 'react-router-dom'
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
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { solicitudes, cargando: cargandoSolicitudes } = useSolicitudes()
  const { reservas, cargando: cargandoReservas } = useReservas()
  const { eventos } = useEventos()
  const { pqrs, cargando: cargandoPqrs } = usePqrs()
  const { noLeidasCount } = useNotifications()
  const { usuarios } = useUsers()

  const cargando = cargandoSolicitudes || cargandoReservas || cargandoPqrs

  const rol = user?.rol
  const esAdministrativo = rol === 'Administrativo'
  const esAdmin = rol === 'Administrador del sistema'
  const esPersonal = rol === 'Estudiante' || rol === 'Docente'

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
      rol === 'Docente'
        ? { label: 'PQRS asignadas a mí', value: misPqrsAsignadas.length }
        : { label: 'Notificaciones no leídas', value: noLeidasCount },
      { label: 'Próximos eventos', value: eventos.length },
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
        </>
      )}
    </div>
  )
}
