import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'
import { useSolicitudes } from '../context/SolicitudesContext.jsx'
import { useReservas } from '../context/ReservasContext.jsx'
import { usePqrs } from '../context/PqrsContext.jsx'
import { useEventos } from '../context/EventosContext.jsx'
import { useUsers } from '../context/UsersContext.jsx'
import { estadosSolicitud, estadosReserva, tiposSolicitud, tiposPqrs, estadosPqrs } from '../data/mockData.js'
import { BrandSpinner } from '../components/BrandSpinner.jsx'
import { IconoDocumento, IconoCalendario, IconoChat, IconoHerramientas, IconoUsuarios, IconoGorro } from '../components/icons.jsx'

const COLORES = ['#013467', '#0261bd', '#5fa8f0', '#2e8b57', '#b87e00', '#c0392b']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function contarPorCategoria(items, categorias, campo) {
  return categorias.map((cat) => ({ categoria: cat, total: items.filter((i) => i[campo] === cat).length }))
}

function claveMes(fecha) {
  const d = new Date(fecha)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function actividadMensual(solicitudes, reservas, pqrs) {
  const mapa = new Map()
  const registrar = (items, campo) => {
    items.forEach((it) => {
      if (!it.fecha) return
      const clave = claveMes(it.fecha)
      if (!mapa.has(clave)) mapa.set(clave, { clave, solicitudes: 0, reservas: 0, pqrs: 0 })
      mapa.get(clave)[campo] += 1
    })
  }
  registrar(solicitudes, 'solicitudes')
  registrar(reservas, 'reservas')
  registrar(pqrs, 'pqrs')
  return Array.from(mapa.values())
    .sort((a, b) => a.clave.localeCompare(b.clave))
    .map((d) => {
      const [anio, mes] = d.clave.split('-')
      return { ...d, mes: `${MESES[Number(mes) - 1]} ${anio}` }
    })
}

function tasaColor(porcentaje) {
  if (porcentaje >= 70) return 'status-badge--ok'
  if (porcentaje >= 40) return 'status-badge--warn'
  return 'status-badge--bad'
}

function GraficoVacio({ mensaje }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: 13 }}>
      {mensaje}
    </div>
  )
}

export default function Reportes() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'Administrador del sistema'
  const { solicitudes, cargando: cargandoSolicitudes } = useSolicitudes()
  const { reservas, catalogo, cargando: cargandoReservas } = useReservas()
  const { pqrs, cargando: cargandoPqrs } = usePqrs()
  const { eventos, cargando: cargandoEventos } = useEventos()
  const { usuarios, cargando: cargandoUsuarios } = useUsers()
  const cargando = cargandoSolicitudes || cargandoReservas || cargandoPqrs || cargandoEventos

  const solicitudesPorEstado = contarPorCategoria(solicitudes, estadosSolicitud, 'estado')
  const solicitudesPorTipo = contarPorCategoria(solicitudes, tiposSolicitud, 'tipo').filter((d) => d.total > 0)
  const reservasPorEstado = contarPorCategoria(reservas, estadosReserva, 'estado')
  const reservasPorTipo = [
    { tipo: 'Espacios', total: reservas.filter((r) => r.tipoEspacio === 'espacio').length },
    { tipo: 'Equipos', total: reservas.filter((r) => r.tipoEspacio === 'equipo').length },
  ]
  const pqrsPorTipo = contarPorCategoria(pqrs, tiposPqrs, 'tipo').filter((d) => d.total > 0)
  const pqrsPorEstado = contarPorCategoria(pqrs, estadosPqrs, 'estado')

  const pqrsResueltas = pqrs.filter((p) => p.estado === 'Resuelta').length
  const pqrsPendientes = pqrs.length - pqrsResueltas
  const pqrsData = [
    { name: 'Resueltas', value: pqrsResueltas },
    { name: 'Pendientes / en gestión', value: pqrsPendientes },
  ]

  const solicitudesResueltas = solicitudes.filter((s) => s.estado === 'Resuelta' || s.estado === 'Cerrada').length
  const tasaResolucionSolicitudes = solicitudes.length ? Math.round((solicitudesResueltas / solicitudes.length) * 100) : null

  const reservasConfirmadas = reservas.filter((r) => r.estado === 'Confirmada').length
  const reservasGestionadas = reservas.filter((r) => r.estado !== 'Pendiente').length
  const tasaConfirmacionReservas = reservasGestionadas ? Math.round((reservasConfirmadas / reservasGestionadas) * 100) : null

  const tasaResolucionPqrs = pqrs.length ? Math.round((pqrsResueltas / pqrs.length) * 100) : null

  const actividad = actividadMensual(solicitudes, reservas, pqrs)

  const equiposConStock = catalogo.equipos.filter((e) => e.stock > 0).length
  const equiposSinStock = catalogo.equipos.length - equiposConStock
  const recursosData = [
    { name: 'Con disponibilidad', value: equiposConStock },
    { name: 'Sin unidades libres', value: equiposSinStock },
  ]

  const eventosPorMes = (() => {
    const mapa = new Map()
    eventos.forEach((e) => {
      if (!e.fecha) return
      const clave = claveMes(e.fecha)
      mapa.set(clave, (mapa.get(clave) || 0) + 1)
    })
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([clave, total]) => {
        const [anio, mes] = clave.split('-')
        return { mes: `${MESES[Number(mes) - 1]} ${anio}`, total }
      })
  })()

  const rolesUsuarios = ['Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema']
  const usuariosPorRol = contarPorCategoria(usuarios, rolesUsuarios, 'rol').filter((d) => d.total > 0)
  const usuariosActivos = usuarios.filter((u) => u.activo).length
  const usuariosData = [
    { name: 'Activos', value: usuariosActivos },
    { name: 'Inactivos', value: usuarios.length - usuariosActivos },
  ]

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Reportes</h1>
        <p className="view-header__subtitle">
          Indicadores y análisis de la actividad en la plataforma
        </p>
      </div>

      {cargando ? (
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando indicadores..." />
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card">
              <span className="kpi-card__icon"><IconoDocumento /></span>
              <p className="kpi-card__label">Solicitudes totales</p>
              <div className="kpi-card__value-row">
                <p className="kpi-card__value">{solicitudes.length}</p>
                {tasaResolucionSolicitudes !== null && (
                  <span className={`status-badge ${tasaColor(tasaResolucionSolicitudes)}`}>{tasaResolucionSolicitudes}% resueltas</span>
                )}
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__icon"><IconoCalendario /></span>
              <p className="kpi-card__label">Reservas totales</p>
              <div className="kpi-card__value-row">
                <p className="kpi-card__value">{reservas.length}</p>
                {tasaConfirmacionReservas !== null && (
                  <span className={`status-badge ${tasaColor(tasaConfirmacionReservas)}`}>{tasaConfirmacionReservas}% confirmadas</span>
                )}
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__icon"><IconoChat /></span>
              <p className="kpi-card__label">PQRS totales</p>
              <div className="kpi-card__value-row">
                <p className="kpi-card__value">{pqrs.length}</p>
                {tasaResolucionPqrs !== null && (
                  <span className={`status-badge ${tasaColor(tasaResolucionPqrs)}`}>{tasaResolucionPqrs}% resueltas</span>
                )}
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__icon"><IconoHerramientas /></span>
              <p className="kpi-card__label">Equipos con disponibilidad</p>
              <div className="kpi-card__value-row">
                <p className="kpi-card__value">{equiposConStock}<span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 500 }}> / {catalogo.equipos.length}</span></p>
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__icon"><IconoGorro /></span>
              <p className="kpi-card__label">Eventos programados</p>
              <div className="kpi-card__value-row">
                <p className="kpi-card__value">{eventos.length}</p>
              </div>
            </div>
            {esAdmin && (
              <div className="kpi-card">
                <span className="kpi-card__icon"><IconoUsuarios /></span>
                <p className="kpi-card__label">Usuarios activos</p>
                <div className="kpi-card__value-row">
                  <p className="kpi-card__value">{usuariosActivos}<span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 500 }}> / {usuarios.length}</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="content-row">
            <div className="panel">
              <h3 className="panel__title">Actividad mensual</h3>
              <div style={{ width: '100%', height: 280 }}>
                {actividad.length === 0 ? (
                  <GraficoVacio mensaje="Aún no hay suficiente actividad para mostrar una tendencia." />
                ) : (
                  <ResponsiveContainer>
                    <AreaChart data={actividad}>
                      <defs>
                        <linearGradient id="gradSolicitudes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#013467" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#013467" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradReservas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0261bd" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0261bd" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradPqrs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2e8b57" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#2e8b57" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="solicitudes" name="Solicitudes" stroke="#013467" fill="url(#gradSolicitudes)" strokeWidth={2} />
                      <Area type="monotone" dataKey="reservas" name="Reservas" stroke="#0261bd" fill="url(#gradReservas)" strokeWidth={2} />
                      <Area type="monotone" dataKey="pqrs" name="PQRS" stroke="#2e8b57" fill="url(#gradPqrs)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="panel">
              <h3 className="panel__title">PQRS resueltas vs pendientes</h3>
              <div style={{ width: '100%', height: 280 }}>
                {pqrs.length === 0 ? (
                  <GraficoVacio mensaje="Aún no se han radicado PQRS." />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pqrsData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {pqrsData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORES[index % COLORES.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <p className="field-section-title">Solicitudes</p>
          <div className="content-row">
            <div className="panel">
              <h3 className="panel__title">Solicitudes por tipo de servicio</h3>
              <div style={{ width: '100%', height: 260 }}>
                {solicitudesPorTipo.length === 0 ? (
                  <GraficoVacio mensaje="Sin solicitudes registradas." />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={solicitudesPorTipo} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="categoria" width={150} tick={{ fontSize: 10.5 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                      <Bar dataKey="total" fill="var(--color-navy)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="panel">
              <h3 className="panel__title">Solicitudes por estado</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={solicitudesPorEstado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="categoria" tick={{ fontSize: 10.5 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                    <Bar dataKey="total" fill="var(--color-navy)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <p className="field-section-title">PQRS</p>
          <div className="content-row">
            <div className="panel">
              <h3 className="panel__title">PQRS por tipo</h3>
              <div style={{ width: '100%', height: 240 }}>
                {pqrsPorTipo.length === 0 ? (
                  <GraficoVacio mensaje="Sin PQRS registradas." />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={pqrsPorTipo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                      <Bar dataKey="total" fill="#2e8b57" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="panel">
              <h3 className="panel__title">PQRS por estado</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={pqrsPorEstado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                    <Bar dataKey="total" fill="#2e8b57" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <p className="field-section-title">Reservas y recursos</p>
          <div className="content-row">
            <div className="panel">
              <h3 className="panel__title">Reservas por estado</h3>
              <div style={{ width: '100%', height: 240 }}>
                {reservas.length === 0 ? (
                  <GraficoVacio mensaje="Aún no hay reservas registradas." />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={reservasPorEstado}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                      <Bar dataKey="total" fill="var(--color-navy-light)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="panel">
              <h3 className="panel__title">Reservas por tipo</h3>
              <div style={{ width: '100%', height: 240 }}>
                {reservas.length === 0 ? (
                  <GraficoVacio mensaje="Aún no hay reservas registradas." />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={reservasPorTipo} dataKey="total" nameKey="tipo" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {reservasPorTipo.map((entry, index) => (
                          <Cell key={entry.tipo} fill={COLORES[index % COLORES.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="content-row">
            <div className="panel">
              <h3 className="panel__title">Disponibilidad de equipos</h3>
              <div style={{ width: '100%', height: 240 }}>
                {catalogo.equipos.length === 0 ? (
                  <GraficoVacio mensaje="Aún no hay equipos en el catálogo." />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={recursosData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        <Cell fill="#2e8b57" />
                        <Cell fill="#c0392b" />
                      </Pie>
                      <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="panel">
              <h3 className="panel__title">Eventos programados por mes</h3>
              <div style={{ width: '100%', height: 240 }}>
                {eventosPorMes.length === 0 ? (
                  <GraficoVacio mensaje="Aún no hay eventos programados." />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={eventosPorMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                      <Bar dataKey="total" fill="#b87e00" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {esAdmin && (
            <>
              <p className="field-section-title">Usuarios</p>
              <div className="content-row">
                <div className="panel">
                  <h3 className="panel__title">Usuarios por rol</h3>
                  <div style={{ width: '100%', height: 240 }}>
                    {cargandoUsuarios ? (
                      <GraficoVacio mensaje="Cargando usuarios..." />
                    ) : usuariosPorRol.length === 0 ? (
                      <GraficoVacio mensaje="Sin usuarios registrados." />
                    ) : (
                      <ResponsiveContainer>
                        <BarChart data={usuariosPorRol} layout="vertical" margin={{ left: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="categoria" width={140} tick={{ fontSize: 10.5 }} />
                          <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                          <Bar dataKey="total" fill="var(--color-navy)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <div className="panel">
                  <h3 className="panel__title">Usuarios activos vs inactivos</h3>
                  <div style={{ width: '100%', height: 240 }}>
                    {cargandoUsuarios || usuarios.length === 0 ? (
                      <GraficoVacio mensaje={cargandoUsuarios ? 'Cargando usuarios...' : 'Sin usuarios registrados.'} />
                    ) : (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={usuariosData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                            <Cell fill="#2e8b57" />
                            <Cell fill="#c0392b" />
                          </Pie>
                          <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} labelStyle={{ color: 'var(--color-text)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
