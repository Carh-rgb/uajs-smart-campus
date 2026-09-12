import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { usePqrs } from '../context/PqrsContext.jsx'
import { useUsers } from '../context/UsersContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { tiposPqrs, dependencias, estadosPqrs } from '../data/mockData.js'
import { useHighlightRow } from '../hooks/useHighlightRow.js'

// Fila de botones-filtro (Todos + un botón por estado) con contador,
// reutilizada en las tres vistas del modulo.
function FiltrosEstado({ valor, onChange, items }) {
  const opciones = ['Todos', ...estadosPqrs]
  return (
    <div className="filtro-pills">
      {opciones.map((op) => {
        const total = op === 'Todos' ? items.length : items.filter((p) => p.estado === op).length
        return (
          <button
            key={op}
            type="button"
            className={`filtro-pill ${valor === op ? 'filtro-pill--activa' : ''}`}
            onClick={() => onChange(op)}
          >
            {op}
            <span className="filtro-pill__count">{total}</span>
          </button>
        )
      })}
    </div>
  )
}

function VistaEstudiante({ highlightId }) {
  const { pqrs, cargando, radicar } = usePqrs()
  const [radicado, setRadicado] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [form, setForm] = useState({ tipo: tiposPqrs[0], dirigidoA: dependencias[0], asunto: '', descripcion: '', adjunto: null })
  const [filtro, setFiltro] = useState('Todos')

  // El backend ya devuelve solo las PQRS del usuario autenticado.
  const misPqrs = pqrs
  const visibles = filtro === 'Todos' ? misPqrs : misPqrs.filter((p) => p.estado === filtro)

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
          <>
            <FiltrosEstado valor={filtro} onChange={setFiltro} items={misPqrs} />
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Estado</th><th>Respuesta</th><th>Adjunto</th></tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} data-row-id={p.id} className={highlightId === p.id ? 'row--highlight' : undefined}>
                    <td>{p.id}</td>
                    <td>{p.tipo}</td>
                    <td>{p.asunto}</td>
                    <td><StatusBadge estado={p.estado} /></td>
                    <td>{p.respuesta || '—'}</td>
                    <td>{p.adjuntoRespuesta ? `📎 ${p.adjuntoRespuesta}` : '—'}</td>
                  </tr>
                ))}
                {visibles.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    {misPqrs.length === 0 ? 'Aún no has radicado ninguna PQRS.' : 'No hay PQRS con este estado.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}

function ResponderPqrsModal({ item, onClose, onSubmit, responsables, onAsignar }) {
  const [respuesta, setRespuesta] = useState(item.respuesta || '')
  const [estado, setEstado] = useState(item.estado === 'Registrada' ? 'En gestión' : item.estado)
  const [adjunto, setAdjunto] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [asignadoA, setAsignadoA] = useState(item.asignadoA || 'Sin asignar')
  const [nota, setNota] = useState('')
  const [asignando, setAsignando] = useState(false)
  const [mensajeAsignacion, setMensajeAsignacion] = useState('')

  const handleGuardarAsignacion = async () => {
    setAsignando(true)
    setMensajeAsignacion('')
    try {
      await onAsignar(item.id, asignadoA, nota.trim())
      setMensajeAsignacion(
        asignadoA === 'Sin asignar' || !nota.trim()
          ? 'Asignación actualizada.'
          : `Asignación guardada. Se notificó a ${asignadoA}.`,
      )
      setNota('')
    } finally {
      setAsignando(false)
    }
  }

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

      {responsables && (
        <div className="asignacion-box">
          <p className="field-section-title" style={{ margin: '0 0 12px' }}>Asignación</p>
          <div className="field">
            <label className="field__label">Asignar a</label>
            <select className="field__input" value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}>
              <option>Sin asignar</option>
              {responsables.map((r) => (
                <option key={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Nota para quien la reciba (opcional)</label>
            <textarea
              className="field__input"
              rows={2}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: por favor prioriza este caso, el estudiante ya escaló dos veces."
            />
          </div>
          <LoadingButton
            type="button"
            className="btn btn--sm btn--primary"
            style={{ width: 'auto' }}
            loading={asignando}
            loadingText="Guardando..."
            onClick={handleGuardarAsignacion}
          >
            Guardar asignación
          </LoadingButton>
          {mensajeAsignacion && (
            <p style={{ fontSize: 12, color: 'var(--color-success)', margin: '10px 0 0' }}>{mensajeAsignacion}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
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
  const [filtro, setFiltro] = useState('Todos')

  // El backend ya devuelve solo las PQRS asignadas a este docente.
  const asignadas = pqrs
  const visibles = filtro === 'Todos' ? asignadas : asignadas.filter((p) => p.estado === filtro)

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
      <FiltrosEstado valor={filtro} onChange={setFiltro} items={asignadas} />
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Solicitante</th><th>Estado</th><th>Descripción</th><th></th></tr>
        </thead>
        <tbody>
          {visibles.map((p) => (
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
          {visibles.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              {asignadas.length === 0 ? 'No tienes PQRS asignadas por el momento.' : 'No hay PQRS con este estado.'}
            </td></tr>
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
  const { pqrs, cargando, responder, asignar, obtenerHistorial } = usePqrs()
  const { responsables } = useUsers()
  const { agregarNotificacion } = useNotifications()
  const [respondiendoId, setRespondiendoId] = useState(null)
  const [historialId, setHistorialId] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargandoHistorialId, setCargandoHistorialId] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const verHistorial = async (id) => {
    setCargandoHistorialId(id)
    try {
      setHistorial(await obtenerHistorial(id))
      setHistorialId(id)
    } finally {
      setCargandoHistorialId(null)
    }
  }

  // Asignar guarda el responsable como siempre; si ademas se escribio una
  // nota, se le notifica directamente al usuario asignado (el mensaje es
  // el texto que va a ver esa persona al abrir la notificacion).
  const asignarConNota = async (id, asignadoA, nota) => {
    const actualizada = await asignar(id, asignadoA)
    if (nota && asignadoA !== 'Sin asignar') {
      const responsable = responsables.find((r) => r.nombre === asignadoA)
      if (responsable) {
        await agregarNotificacion(
          'PQRS',
          `Te asignaron la PQRS ${id} (${actualizada.asunto}). Nota: ${nota}`,
          responsable.id,
        )
      }
    }
    return actualizada
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return pqrs
      .filter((p) => filtro === 'Todos' || p.estado === filtro)
      .filter((p) => {
        if (!texto) return true
        return [p.id, p.asunto, p.solicitante, p.tipo].some((v) => v?.toLowerCase().includes(texto))
      })
  }, [pqrs, filtro, busqueda])

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
      <FiltrosEstado valor={filtro} onChange={setFiltro} items={pqrs} />
      <div className="toolbar">
        <input
          className="toolbar__input"
          placeholder="Buscar por ID, asunto, solicitante o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ minWidth: 260 }}
        />
      </div>
      <table className="data-table" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '7%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '24%' }} />
        </colgroup>
        <thead>
          <tr><th>ID</th><th>Tipo</th><th>Asunto</th><th>Solicitante</th><th>Asignado a</th><th>Estado</th><th>Respuesta</th><th></th></tr>
        </thead>
        <tbody>
          {visibles.map((p) => (
            <tr key={p.id} data-row-id={p.id} className={highlightId === p.id ? 'row--highlight' : undefined}>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.id}>{p.id}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.tipo}>{p.tipo}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.asunto}>{p.asunto}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.solicitante}>{p.solicitante}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.asignadoA && p.asignadoA !== 'Sin asignar' ? p.asignadoA : <span style={{ color: 'var(--color-text-muted)' }}>Sin asignar</span>}
              </td>
              <td><StatusBadge estado={p.estado} /></td>
              <td
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={p.respuesta || ''}
              >
                {p.respuesta ? (
                  <>
                    {p.adjuntoRespuesta && '📎 '}
                    {p.respuesta}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
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
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No hay PQRS que coincidan con el filtro o la búsqueda.
            </td></tr>
          )}
        </tbody>
      </table>

      {respondiendoId && (
        <ResponderPqrsModal
          item={pqrs.find((p) => p.id === respondiendoId)}
          onClose={() => setRespondiendoId(null)}
          onSubmit={(payload) => responder(respondiendoId, payload)}
          responsables={responsables}
          onAsignar={asignarConNota}
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
