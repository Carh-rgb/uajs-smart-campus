import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useSolicitudes } from '../context/SolicitudesContext.jsx'
import { useReservas } from '../context/ReservasContext.jsx'
import { usePqrs } from '../context/PqrsContext.jsx'
import { estadosSolicitud, estadosReserva } from '../data/mockData.js'
import { BrandSpinner } from '../components/BrandSpinner.jsx'

const COLORES = ['#013467', '#0261bd', '#5fa8f0', '#2e8b57', '#b87e00', '#c0392b']

function contarPorEstado(items, estados) {
  return estados.map((estado) => ({
    estado,
    total: items.filter((i) => i.estado === estado).length,
  }))
}

export default function Reportes() {
  const { solicitudes, cargando: cargandoSolicitudes } = useSolicitudes()
  const { reservas, cargando: cargandoReservas } = useReservas()
  const { pqrs, cargando: cargandoPqrs } = usePqrs()
  const cargando = cargandoSolicitudes || cargandoReservas || cargandoPqrs

  const solicitudesPorEstado = contarPorEstado(solicitudes, estadosSolicitud)
  const reservasPorEstado = contarPorEstado(reservas, estadosReserva)

  const reservasPorTipo = [
    { tipo: 'Espacios', total: reservas.filter((r) => r.tipoEspacio === 'espacio').length },
    { tipo: 'Equipos', total: reservas.filter((r) => r.tipoEspacio === 'equipo').length },
  ]

  const pqrsResueltas = pqrs.filter((p) => p.estado === 'Resuelta').length
  const pqrsPendientes = pqrs.length - pqrsResueltas
  const pqrsData = [
    { name: 'Resueltas', value: pqrsResueltas },
    { name: 'Pendientes / en gestión', value: pqrsPendientes },
  ]

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Reportes</h1>
        <p className="view-header__subtitle">
          Indicadores generales de la actividad en la plataforma
        </p>
      </div>

      {cargando ? (
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando indicadores..." />
        </div>
      ) : (
        <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <p className="kpi-card__label">Solicitudes totales</p>
          <p className="kpi-card__value">{solicitudes.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Reservas totales</p>
          <p className="kpi-card__value">{reservas.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">PQRS resueltas</p>
          <p className="kpi-card__value">{pqrsResueltas}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">PQRS pendientes</p>
          <p className="kpi-card__value">{pqrsPendientes}</p>
        </div>
      </div>

      <div className="content-row">
        <div className="panel">
          <h3 className="panel__title">Solicitudes por estado</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={solicitudesPorEstado}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="estado" tick={{ fontSize: 10.5 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-navy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel__title">PQRS resueltas vs pendientes</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pqrsData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pqrsData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="content-row">
        <div className="panel">
          <h3 className="panel__title">Reservas por estado</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={reservasPorEstado}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="estado" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-navy-light)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel__title">Reservas por tipo</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={reservasPorTipo} dataKey="total" nameKey="tipo" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {reservasPorTipo.map((entry, index) => (
                    <Cell key={entry.tipo} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
