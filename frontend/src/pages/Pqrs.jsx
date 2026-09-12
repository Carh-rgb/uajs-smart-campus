import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { usePqrs } from '../context/PqrsContext.jsx'
import { useUsers } from '../context/UsersContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { tiposPqrs, dependencias, estadosPqrs } from '../data/mockData.js'
import { useHighlightRow } from '../hooks/useHighlightRow.js'

function VistaEstudiante({ highlightId }) {
  const { pqrs, cargando, radicar, eliminarPqrs } = usePqrs()
  const [radicado, setRadicado] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [form, setForm] = useState({ tipo: tiposPqrs[0], dirigidoA: dependencias[0], asunto: '', descripcion: '', adjunto: null })
  const [pqrsAEliminar, setPqrsAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const confirmarEliminar = async () => {
    setEliminando(true)
    try {
      await eliminarPqrs(pqrsAEliminar.id)
      setPqrsAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  // El backend ya devuelve solo las PQRS del usuario autenticado.
  const misPqrs = pqrs

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      const nueva = await radicar({ ...form, adjunto: form.adjunto?.name || '' })
      setRadicado(nueva.id)
      setForm({ tipo: tiposPqrs[0], dirigidoA: dependencias[0], asunto: '', descripcion: '', adjunto: null })
      setError('')
      setTimeout(() => setRadicado(null), 4000)
    } catch (err) {
      setError(err.message || 'No se pudo radicar la PQRS.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <form className="panel" onSubmit={handleSubmit}>
        <h3 className="panel__title">Nuevo registro</h3>
        {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
        <div className="field-grid">
          <div className="field">
            <label className="field__label">Tipo de solicitud</label>
            <select className="field__input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {tiposPqrs.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Dirigido a</label>
            <select className="field__input" value={form.dirigidoA} onChange={(e) => setForm({ ...form, dirigidoA: e.target.value })}>
              {dependencias.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="field__label">Asunto</label>
          <input className="field__input" required value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} placeholder="Resumen breve del caso" />
        </div>
        <div className="field">
          <label className="field__label">Descripción detallada</label>
          <textarea className="field__input" rows={4} required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe tu petición, queja, reclamo o sugerencia..." />
        </div>
        <div className="field">
          <label className="field__label">Adjuntar evidencia (opcional)</label>
          <input className="field__input" type="file" onChange={(e) => setForm({ ...form, adjunto: e.target.files?.[0] || null })} />
        </div>
        <LoadingButton
          type="submit"
          className="btn btn--primary"
          style={{ width: 'auto' }}
          loading={enviando}
          loadingText="Enviando..."
        >
          Enviar {form.tipo.toLowerCase()}
        </LoadingButton>
        {radicado && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-success)' }}>
            Registro enviado. Código de radicado: <strong>{radicado}</strong>
          </p>
        )}
      </form>

      <div className="panel">
        <h3 className="panel__title">Mis PQRS</h3>
        {cargando ? (
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando tus PQRS..." />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Estado</th><th>Respuesta</th><th>Adjunto</th><th></th></tr>
            </thead>
            <tbody>
              {misPqrs.map((p) => (
                <tr key={p.id} data-row-id={p.id} className={highlightId === p.id ? 'row--highlight' : undefined}>
                  <td>{p.id}</td>
                  <td>{p.tipo}</td>
                  <td>{p.asunto}</td>
                  <td><StatusBadge estado={p.estado} /></td>
                  <td>{p.respuesta || '—'}</td>
                  <td>{p.adjuntoRespuesta ? `📎 ${p.adjuntoRespuesta}` : '—'}</td>
                  <td>
                    {p.estado === 'Registrada' && (
                      <button
                        className="btn btn--sm"
                        style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                        onClick={() => setPqrsAEliminar(p)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {misPqrs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Aún no has radicado ninguna PQRS.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {pqrsAEliminar && (
        <ConfirmDialog
          title="Eliminar PQRS"
          text={`¿Seguro que deseas eliminar ${pqrsAEliminar.id}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={confirmarEliminar}
          onCancel={() => setPqrsAEliminar(null)}
        />
      )}
    </>
  )
}

function ResponderPqrsModal({ item, onClose, onSubmit }) {
  const [respuesta, setRespuesta] = useState(item.respuesta || '')
  const [estado, setEstado] = useState(item.estado === 'Registrada' ? 'En gestión' : item.estado)
  const [adjunto, setAdjunto] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await onSubmit({ respuesta, estado, adjunto: adjunto?.name || '' })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la respuesta.')
      setEnviando(false)
    }
  }

  return (
    <Modal title={`Responder ${item.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
        <div className="field">
          <label className="field__label">Asunto</label>
          <p style={{ margin: 0, fontSize: 13 }}>{item.asunto}</p>
        </div>
        <div className="field">
          <label className="field__label">Descripción del solicitante</label>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.descripcion}</p>
        </div>
        {item.adjunto && (
          <div className="field">
            <label className="field__label">Adjunto del solicitante</label>
            <p style={{ margin: 0, fontSize: 13 }}>📎 {item.adjunto}</p>
          </div>
        )}

        <div className="field-grid">
          <div className="field">
            <label className="field__label">Estado</label>
            <select className="field__input" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {estadosPqrs.filter((e) => e !== 'Registrada').map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Adjuntar respuesta (opcional)</label>
            <input className="field__input" type="file" onChange={(e) => setAdjunto(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="field">
          <label className="field__label">Respuesta para el solicitante</label>
          <textarea
            className="field__input"
            rows={4}
            required
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Escribe la respuesta formal a esta PQRS..."
          />
        </div>

        <LoadingButton
          type="submit"
          className="btn btn--primary"
          style={{ width: 'auto' }}
          loading={enviando}
          loadingText="Guardando..."
        >
          Guardar respuesta
        </LoadingButton>
      </form>
    </Modal>
  )
}

function VistaDocente({ highlightId }) {
  const { pqrs, cargando, responder } = usePqrs()
  const [respondiendoId, setRespondiendoId] = useState(null)

  // El backend ya devuelve solo las PQRS asignadas a este docente.
  const asignadas = pqrs

  if (cargando) {
    return (
      <div className="panel">
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando PQRS asignadas..." />
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <h3 className="panel__title">PQRS asignadas a ti</h3>
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Solicitante</th><th>Estado</th><th>Descripción</th><th></th></tr>
        </thead>
        <tbody>
          {asignadas.map((p) => (
            <tr key={p.id} data-row-id={p.id} className={highlightId === p.id ? 'row--highlight' : undefined}>
              <td>{p.id}</td>
              <td>{p.tipo}</td>
              <td>{p.asunto}</td>
              <td>{p.solicitante}</td>
              <td><StatusBadge estado={p.estado} /></td>
              <td>{p.descripcion}</td>
              <td>
                <button
                  className="btn btn--sm btn--primary"
                  style={{ width: 'auto' }}
                  onClick={() => setRespondiendoId(p.id)}
                >
                  {p.estado === 'Resuelta' ? 'Ver / editar' : 'Responder'}
                </button>
              </td>
            </tr>
          ))}
          {asignadas.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No tienes PQRS asignadas por el momento.</td></tr>
          )}
        </tbody>
      </table>

      {respondiendoId && (
        <ResponderPqrsModal
          item={pqrs.find((p) => p.id === respondiendoId)}
          onClose={() => setRespondiendoId(null)}
          onSubmit={(payload) => responder(respondiendoId, payload)}
        />
      )}
    </div>
  )
}

function VistaAdministrativo({ highlightId }) {
  const { pqrs, cargando, responder, asignar, obtenerHistorial, eliminarPqrs } = usePqrs()
  const { responsables } = useUsers()
  const [respondiendoId, setRespondiendoId] = useState(null)
  const [historialId, setHistorialId] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargandoHistorialId, setCargandoHistorialId] = useState(null)
  const [pqrsAEliminar, setPqrsAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const verHistorial = async (id) => {
    setCargandoHistorialId(id)
    try {
      setHistorial(await obtenerHistorial(id))
      setHistorialId(id)
    } finally {
      setCargandoHistorialId(null)
    }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    try {
      await eliminarPqrs(pqrsAEliminar.id)
      setPqrsAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  if (cargando) {
    return (
      <div className="panel">
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando PQRS..." />
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <h3 className="panel__title">Gestión de PQRS</h3>
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Solicitante</th><th>Asignado a</th><th>Estado</th><th>Respuesta</th><th></th></tr>
        </thead>
        <tbody>
          {pqrs.map((p) => (
            <tr key={p.id} data-row-id={p.id} className={highlightId === p.id ? 'row--highlight' : undefined}>
              <td>{p.id}</td>
              <td>{p.tipo}</td>
              <td>{p.asunto}</td>
              <td>{p.solicitante}</td>
              <td>
                <select
                  className="toolbar__select"
                  value={p.asignadoA}
                  onChange={(e) => asignar(p.id, e.target.value)}
                >
                  <option>Sin asignar</option>
                  {responsables.map((r) => (
                    <option key={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </td>
              <td><StatusBadge estado={p.estado} /></td>
              <td style={{ minWidth: 200 }}>
                {p.respuesta ? (
                  <>
                    {p.respuesta}
                    {p.adjuntoRespuesta && (
                      <div style={{ fontSize: 11.5, color: 'var(--color-navy)', marginTop: 4 }}>
                        📎 {p.adjuntoRespuesta}
                      </div>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn--sm btn--primary" style={{ width: 'auto' }} onClick={() => setRespondiendoId(p.id)}>
                  {p.respuesta ? 'Editar' : 'Responder'}
                </button>
                <button
                  className="btn btn--sm"
                  style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  disabled={cargandoHistorialId === p.id}
                  onClick={() => verHistorial(p.id)}
                >
                  {cargandoHistorialId === p.id && <ButtonSpinner />}
                  Historial
                </button>
                <button
                  className="btn btn--sm"
                  style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                  onClick={() => setPqrsAEliminar(p)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {respondiendoId && (
        <ResponderPqrsModal
          item={pqrs.find((p) => p.id === respondiendoId)}
          onClose={() => setRespondiendoId(null)}
          onSubmit={(payload) => responder(respondiendoId, payload)}
        />
      )}

      {historialId && (
        <Modal title={`Historial — ${historialId}`} onClose={() => setHistorialId(null)}>
          <div className="inscritos-list">
            {historial.map((h, idx) => (
              <div className="inscritos-list__item" key={idx}>
                <span>{h.estado}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{h.fecha} · {h.por}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {pqrsAEliminar && (
        <ConfirmDialog
          title="Eliminar PQRS"
          text={`¿Seguro que deseas eliminar ${pqrsAEliminar.id}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={confirmarEliminar}
          onCancel={() => setPqrsAEliminar(null)}
        />
      )}
    </div>
  )
}

export default function Pqrs() {
  const { user } = useAuth()
  const highlightId = useHighlightRow()

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">PQRS</h1>
        <p className="view-header__subtitle">
          Peticiones, quejas, reclamos y sugerencias
        </p>
      </div>

      {user?.rol === 'Estudiante' && <VistaEstudiante highlightId={highlightId} />}
      {user?.rol === 'Docente' && <VistaDocente highlightId={highlightId} />}
      {(user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema') && (
        <VistaAdministrativo highlightId={highlightId} />
      )}
    </div>
  )
}
