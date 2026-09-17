import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { estadosSolicitud } from '../data/mockData.js'
import { useSolicitudes } from '../context/SolicitudesContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner } from '../components/BrandSpinner.jsx'

export default function SolicitudDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const { responderSolicitud, obtenerSolicitud } = useSolicitudes()
  const [solicitud, setSolicitud] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [estadoForm, setEstadoForm] = useState('')
  const [respuestaForm, setRespuestaForm] = useState('')
  const [adjuntoForm, setAdjuntoForm] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const detalle = await obtenerSolicitud(id)
      setSolicitud(detalle)
      setEstadoForm(detalle.estado)
      setRespuestaForm(detalle.respuesta || '')
    } catch {
      setSolicitud(null)
    } finally {
      setAdjuntoForm(null)
      setCargando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  const puedeGestionar = user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema'

  if (cargando) {
    return (
      <div className="brand-loading-panel">
        <BrandSpinner size="md" label="Cargando solicitud..." />
      </div>
    )
  }

  if (!solicitud) {
    return (
      <div>
        <p>No se encontró la solicitud {id}.</p>
        <Link to="/app/solicitudes">Volver a solicitudes</Link>
      </div>
    )
  }

  const indiceActual = estadosSolicitud.indexOf(solicitud.estado)

  const handleResponder = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await responderSolicitud(solicitud.id, {
        respuesta: respuestaForm,
        adjunto: adjuntoForm?.name || '',
        nuevoEstado: estadoForm,
      })
      await cargar()
      setMensaje('Respuesta enviada al solicitante.')
      setTimeout(() => setMensaje(''), 3000)
    } catch (err) {
      setMensaje(err.message || 'No se pudo guardar la respuesta.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Solicitud {solicitud.id}</h1>
        <p className="view-header__subtitle">{solicitud.tipo} · {solicitud.dependencia}</p>
      </div>

      <div className="panel">
        <h3 className="panel__title">Seguimiento</h3>
        <div className="stepper">
          {estadosSolicitud.map((estado, i) => (
            <div
              key={estado}
              className={`stepper__step ${
                i < indiceActual
                  ? 'stepper__step--done'
                  : i === indiceActual
                  ? 'stepper__step--current'
                  : ''
              }`}
            >
              {i > 0 && <div className="stepper__line" />}
              <div className="stepper__dot" />
              <div className="stepper__label">{estado}</div>
            </div>
          ))}
        </div>

        {!puedeGestionar && (
          <div className="field" style={{ maxWidth: 320, marginTop: 8 }}>
            <label className="field__label">Estado actual</label>
            <StatusBadge estado={solicitud.estado} />
          </div>
        )}
      </div>

      {puedeGestionar && (
        <form className="panel" onSubmit={handleResponder}>
          <h3 className="panel__title">Responder solicitud</h3>
          <div className="field-grid">
            <div className="field">
              <label className="field__label">Estado</label>
              <select className="field__input" value={estadoForm} onChange={(e) => setEstadoForm(e.target.value)}>
                {estadosSolicitud.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Adjunto (opcional)</label>
              <input
                className="field__input"
                type="file"
                onChange={(e) => setAdjuntoForm(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Respuesta para el solicitante</label>
            <textarea
              className="field__input"
              rows={4}
              required
              value={respuestaForm}
              onChange={(e) => setRespuestaForm(e.target.value)}
              placeholder="Escribe la respuesta o el resultado de la gestión..."
            />
          </div>
          <LoadingButton
            type="submit"
            className="btn btn--primary"
            style={{ width: 'auto' }}
            loading={guardando}
            loadingText="Guardando..."
          >
            Guardar y responder
          </LoadingButton>
          {mensaje && (
            <p style={{ fontSize: 12.5, color: 'var(--color-success)', marginTop: 10 }}>{mensaje}</p>
          )}
        </form>
      )}

      {!puedeGestionar && solicitud.respuesta && (
        <div className="panel">
          <h3 className="panel__title">Respuesta</h3>
          <p style={{ marginBottom: 8 }}>{solicitud.respuesta}</p>
          {solicitud.adjuntoRespuesta && (
            <p style={{ fontSize: 12.5, color: 'var(--color-text-accent)' }}>
              📎 Adjunto: {solicitud.adjuntoRespuesta}
            </p>
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {solicitud.respondidoPor} · {solicitud.fechaRespuesta}
          </p>
        </div>
      )}

      <div className="panel">
        <h3 className="panel__title">Detalle</h3>
        <div className="field-grid">
          <div className="field">
            <label className="field__label">Fecha de registro</label>
            <p>{solicitud.fecha}</p>
          </div>
          <div className="field">
            <label className="field__label">Prioridad</label>
            <p>{solicitud.prioridad}</p>
          </div>
          <div className="field">
            <label className="field__label">Asignado a</label>
            <p>{solicitud.asignadoA || 'Sin asignar'}</p>
          </div>
        </div>
        <div className="field">
          <label className="field__label">Descripción</label>
          <p>{solicitud.descripcion}</p>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel__title">Historial de cambios</h3>
        <div className="inscritos-list">
          {(solicitud.historial || []).map((h, idx) => (
            <div className="inscritos-list__item" key={idx}>
              <span>{h.estado}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{h.fecha} · {h.por}</span>
            </div>
          ))}
        </div>
      </div>

      <Link to="/app/solicitudes" style={{ fontSize: 13, color: 'var(--color-text-accent)' }}>
        ← Volver a solicitudes
      </Link>
    </div>
  )
}
