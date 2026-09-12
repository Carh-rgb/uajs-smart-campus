import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useEventos } from '../context/EventosContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { useHighlightRow } from '../hooks/useHighlightRow.js'

export default function Eventos() {
  const { user } = useAuth()
  const { eventos, cargando, agregarEvento, inscribir, estaInscrito, inscritosDe, eliminarEvento } = useEventos()
  const highlightId = useHighlightRow()

  const esAdministrativo = user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema'

  const [eventoAConfirmar, setEventoAConfirmar] = useState(null)
  const [eventoAEliminar, setEventoAEliminar] = useState(null)
  const [mensajeExito, setMensajeExito] = useState('')
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [eventoInscritosId, setEventoInscritosId] = useState(null)
  const [inscritos, setInscritos] = useState([])
  const [error, setError] = useState('')
  const [inscribiendo, setInscribiendo] = useState(false)
  const [cargandoInscritosId, setCargandoInscritosId] = useState(null)
  const [guardandoEvento, setGuardandoEvento] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const [form, setForm] = useState({
    titulo: '', fecha: '', hora: '', lugar: '', ponente: '', descripcion: '',
  })

  const handleConfirmarInscripcion = async () => {
    setInscribiendo(true)
    try {
      await inscribir(eventoAConfirmar.id, eventoAConfirmar.titulo)
      setMensajeExito(`Quedaste inscrito en "${eventoAConfirmar.titulo}".`)
      setTimeout(() => setMensajeExito(''), 4000)
      setEventoAConfirmar(null)
    } catch (err) {
      setError(err.message || 'No se pudo completar la inscripción.')
      setEventoAConfirmar(null)
    } finally {
      setInscribiendo(false)
    }
  }

  const verInscritos = async (eventoId) => {
    setCargandoInscritosId(eventoId)
    try {
      setInscritos(await inscritosDe(eventoId))
      setEventoInscritosId(eventoId)
    } finally {
      setCargandoInscritosId(null)
    }
  }

  const handleCrearEvento = async (e) => {
    e.preventDefault()
    setGuardandoEvento(true)
    try {
      await agregarEvento(form)
      setForm({ titulo: '', fecha: '', hora: '', lugar: '', ponente: '', descripcion: '' })
      setModalNuevoAbierto(false)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el evento.')
    } finally {
      setGuardandoEvento(false)
    }
  }

  const confirmarEliminarEvento = async () => {
    setEliminando(true)
    try {
      await eliminarEvento(eventoAEliminar.id)
      setEventoAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Eventos y actividades</h1>
        <p className="view-header__subtitle">
          Actividades académicas e institucionales disponibles
        </p>
      </div>

      {mensajeExito && (
        <div className="panel" style={{ background: 'var(--color-success-bg)', border: 'none' }}>
          <p style={{ margin: 0, color: 'var(--color-success)', fontSize: 13, fontWeight: 600 }}>
            ✓ {mensajeExito}
          </p>
        </div>
      )}

      {error && (
        <div className="panel" style={{ background: 'var(--color-danger-bg)', border: 'none' }}>
          <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: 13, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {esAdministrativo && (
        <div className="toolbar">
          <button className="btn btn--primary btn--sm" style={{ width: 'auto' }} onClick={() => setModalNuevoAbierto(true)}>
            + Agregar evento
          </button>
        </div>
      )}

      {cargando ? (
        <div className="panel">
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando eventos..." />
          </div>
        </div>
      ) : (
      <div className="card-grid">
        {eventos.map((e) => {
          const inscrito = estaInscrito(e.id)
          return (
            <div
              className={`event-card${highlightId === e.id ? ' row--highlight' : ''}`}
              key={e.id}
              data-row-id={e.id}
            >
              <p className="event-card__date">{e.fecha} · {e.hora}</p>
              <h3 className="event-card__title">{e.titulo}</h3>
              <p className="event-card__meta">Lugar: {e.lugar}</p>
              <p className="event-card__meta">Ponente: {e.ponente}</p>

              {esAdministrativo ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn--sm"
                    style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-navy)' }}
                    disabled={cargandoInscritosId === e.id}
                    onClick={() => verInscritos(e.id)}
                  >
                    {cargandoInscritosId === e.id && <ButtonSpinner />}
                    Ver inscritos
                  </button>
                  <button
                    className="btn btn--sm"
                    style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                    onClick={() => setEventoAEliminar(e)}
                  >
                    Eliminar
                  </button>
                </div>
              ) : user?.rol === 'Estudiante' || user?.rol === 'Docente' ? (
                inscrito ? (
                  <span className="status-badge status-badge--ok" style={{ display: 'inline-block', marginTop: 12 }}>
                    Ya estás inscrito
                  </span>
                ) : (
                  <button
                    className="btn btn--primary btn--sm"
                    style={{ width: 'auto', marginTop: 12 }}
                    onClick={() => setEventoAConfirmar(e)}
                  >
                    Inscribirse
                  </button>
                )
              ) : null}
            </div>
          )
        })}
      </div>
      )}

      {eventoAConfirmar && (
        <ConfirmDialog
          title="Confirmar inscripción"
          text={`¿Deseas inscribirte en "${eventoAConfirmar.titulo}"?`}
          onConfirm={handleConfirmarInscripcion}
          onCancel={() => setEventoAConfirmar(null)}
          loading={inscribiendo}
        />
      )}

      {eventoAEliminar && (
        <ConfirmDialog
          title="Eliminar evento"
          text={`¿Seguro que deseas eliminar "${eventoAEliminar.titulo}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={confirmarEliminarEvento}
          onCancel={() => setEventoAEliminar(null)}
        />
      )}

      {eventoInscritosId && (
        <Modal title="Inscritos" onClose={() => setEventoInscritosId(null)}>
          <div className="inscritos-list">
            {inscritos.map((i, idx) => (
              <div className="inscritos-list__item" key={idx}>
                <span>{i.nombre}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{i.rol}</span>
              </div>
            ))}
            {inscritos.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Nadie se ha inscrito todavía.
              </p>
            )}
          </div>
        </Modal>
      )}

      {modalNuevoAbierto && (
        <Modal title="Nuevo evento" onClose={() => setModalNuevoAbierto(false)}>
          <form onSubmit={handleCrearEvento}>
            <div className="field">
              <label className="field__label">Título</label>
              <input className="field__input" required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="field__label">Fecha</label>
                <input className="field__input" type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label">Hora</label>
                <input className="field__input" type="time" required value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label">Lugar</label>
                <input className="field__input" required value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label">Ponente</label>
                <input className="field__input" required value={form.ponente} onChange={(e) => setForm({ ...form, ponente: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Descripción</label>
              <textarea className="field__input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <LoadingButton
              type="submit"
              className="btn btn--primary"
              style={{ width: 'auto' }}
              loading={guardandoEvento}
              loadingText="Guardando..."
            >
              Guardar evento
            </LoadingButton>
          </form>
        </Modal>
      )}
    </div>
  )
}
