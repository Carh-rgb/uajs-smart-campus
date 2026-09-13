import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useEventos } from '../context/EventosContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Modal from '../components/Modal.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { facultadesEventos, estadosEvento } from '../data/mockData.js'
import { useHighlightRow } from '../hooks/useHighlightRow.js'

const FORM_VACIO = { titulo: '', fecha: '', hora: '', lugar: '', ponente: '', descripcion: '', facultad: facultadesEventos[0], cupoMaximo: '' }

// Fila de botones-filtro (Todos + un botón por estado) con contador, mismo
// patrón que ya se usa en PQRS y Recursos.
function FiltrosEstado({ valor, onChange, items, opciones }) {
  const lista = ['Todos', ...opciones]
  return (
    <div className="filtro-pills">
      {lista.map((op) => {
        const total = op === 'Todos' ? items.length : items.filter((e) => e.estado === op).length
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

function CamposEvento({ form, setForm }) {
  return (
    <>
      <div className="field">
        <label className="field__label">Título</label>
        <input className="field__input" required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
      </div>
      <div className="field">
        <label className="field__label">Facultad / dependencia</label>
        <select className="field__input" value={form.facultad} onChange={(e) => setForm({ ...form, facultad: e.target.value })}>
          {facultadesEventos.map((f) => <option key={f}>{f}</option>)}
        </select>
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
        <label className="field__label">Cupo máximo (opcional)</label>
        <input
          className="field__input"
          type="number"
          min="1"
          placeholder="Sin límite de cupo"
          value={form.cupoMaximo}
          onChange={(e) => setForm({ ...form, cupoMaximo: e.target.value })}
        />
      </div>
      <div className="field">
        <label className="field__label">Descripción</label>
        <textarea className="field__input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </div>
    </>
  )
}

function EditarEventoModal({ evento, onClose, onGuardarDatos, onCambiarEstado, onVerInscritos, cargandoInscritos, onEliminar }) {
  const [form, setForm] = useState({
    titulo: evento.titulo,
    fecha: evento.fecha,
    hora: evento.hora,
    lugar: evento.lugar,
    ponente: evento.ponente,
    descripcion: evento.descripcion || '',
    facultad: evento.facultad,
    cupoMaximo: evento.cupoMaximo ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const handleGuardarDatos = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardarDatos(evento.id, { ...form, cupoMaximo: form.cupoMaximo === '' ? null : Number(form.cupoMaximo) })
      setGuardado(true)
      setError('')
      setTimeout(() => setGuardado(false), 2500)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el evento.')
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarEstado = async (e) => {
    const nuevoEstado = e.target.value
    setCambiandoEstado(true)
    try {
      await onCambiarEstado(evento.id, nuevoEstado)
    } finally {
      setCambiandoEstado(false)
    }
  }

  return (
    <Modal title={`Editar evento — ${evento.titulo}`} onClose={onClose}>
      <form onSubmit={handleGuardarDatos}>
        {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
        <CamposEvento form={form} setForm={setForm} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LoadingButton
            type="submit"
            className="btn btn--primary"
            style={{ width: 'auto' }}
            loading={guardando}
            loadingText="Guardando..."
          >
            Guardar cambios
          </LoadingButton>
          {guardado && <span style={{ fontSize: 12.5, color: 'var(--color-success)' }}>Evento actualizado.</span>}
        </div>
      </form>

      <div className="asignacion-box" style={{ marginTop: 18 }}>
        <label className="field__label">Estado del evento</label>
        <select className="field__input" value={evento.estado} disabled={cambiandoEstado} onChange={handleCambiarEstado}>
          {estadosEvento.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
          Inactivo = borrador, no visible para estudiantes ni docentes. Cancelado sigue visible para que quienes ya estaban inscritos lo sepan, pero no admite nuevas inscripciones.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          className="btn btn--sm"
          style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          disabled={cargandoInscritos}
          onClick={() => onVerInscritos(evento.id)}
        >
          {cargandoInscritos && <ButtonSpinner />}
          Ver inscritos
        </button>
        <button
          type="button"
          className="btn btn--sm"
          style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
          onClick={() => onEliminar(evento)}
        >
          Eliminar evento
        </button>
      </div>
    </Modal>
  )
}

export default function Eventos() {
  const { user } = useAuth()
  const {
    eventos, cargando, agregarEvento, actualizarEvento, actualizarEstadoEvento,
    inscribir, estaInscrito, inscritosDe, eliminarEvento,
  } = useEventos()
  const highlightId = useHighlightRow()

  const esAdministrativo = user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema'
  const opcionesEstado = esAdministrativo ? estadosEvento : ['Activo', 'Cancelado']

  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroFacultad, setFiltroFacultad] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')

  const [eventoAConfirmar, setEventoAConfirmar] = useState(null)
  const [eventoEditar, setEventoEditar] = useState(null)
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

  const [form, setForm] = useState(FORM_VACIO)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return eventos
      .filter((e) => filtroEstado === 'Todos' || e.estado === filtroEstado)
      .filter((e) => filtroFacultad === 'Todas' || e.facultad === filtroFacultad)
      .filter((e) => {
        if (!texto) return true
        return [e.titulo, e.lugar, e.ponente].some((v) => v?.toLowerCase().includes(texto))
      })
  }, [eventos, filtroEstado, filtroFacultad, busqueda])

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
      await agregarEvento({ ...form, cupoMaximo: form.cupoMaximo === '' ? null : Number(form.cupoMaximo) })
      setForm(FORM_VACIO)
      setModalNuevoAbierto(false)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo guardar el evento.')
    } finally {
      setGuardandoEvento(false)
    }
  }

  // El modal de edicion recibe un snapshot del evento via props: hay que
  // mantenerlo sincronizado a mano tras cada guardado (el context solo
  // actualiza la lista `eventos`, no este snapshot local).
  const handleGuardarDatosEditar = async (id, datos) => {
    await actualizarEvento(id, datos)
    setEventoEditar((prev) => (prev && prev.id === id ? { ...prev, ...datos } : prev))
  }

  const handleCambiarEstadoEditar = async (id, estado) => {
    await actualizarEstadoEvento(id, estado)
    setEventoEditar((prev) => (prev && prev.id === id ? { ...prev, estado } : prev))
  }

  const confirmarEliminarEvento = async () => {
    setEliminando(true)
    try {
      await eliminarEvento(eventoAEliminar.id)
      setEventoAEliminar(null)
      setEventoEditar(null)
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

      <FiltrosEstado valor={filtroEstado} onChange={setFiltroEstado} items={eventos} opciones={opcionesEstado} />

      <div className="toolbar">
        <select className="toolbar__select" value={filtroFacultad} onChange={(e) => setFiltroFacultad(e.target.value)}>
          <option value="Todas">Todas las facultades</option>
          {facultadesEventos.map((f) => <option key={f}>{f}</option>)}
        </select>
        <input
          className="toolbar__input"
          placeholder="Buscar por título, lugar o ponente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ minWidth: 220 }}
        />
        {esAdministrativo && (
          <button className="btn btn--primary btn--sm" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => setModalNuevoAbierto(true)}>
            + Agregar evento
          </button>
        )}
      </div>

      {cargando ? (
        <div className="panel">
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando eventos..." />
          </div>
        </div>
      ) : (
      <div className="card-grid">
        {visibles.map((e) => {
          const inscrito = estaInscrito(e.id)
          const cupoLleno = e.cupoMaximo != null && e.inscritosCount >= e.cupoMaximo
          return (
            <div
              className={`event-card${highlightId === e.id ? ' row--highlight' : ''}`}
              key={e.id}
              data-row-id={e.id}
            >
              <div className="event-card__header">
                <p className="event-card__date">{e.fecha} · {e.hora}</p>
                <div className="event-card__badges">
                  {(esAdministrativo || e.estado !== 'Activo') && <StatusBadge estado={e.estado} />}
                </div>
              </div>
              <h3 className="event-card__title">{e.titulo}</h3>
              <span className="event-card__tag">{e.facultad}</span>
              <p className="event-card__meta" style={{ marginTop: 10 }}>Lugar: {e.lugar}</p>
              <p className="event-card__meta">Ponente: {e.ponente}</p>
              <p className="event-card__meta">
                {e.cupoMaximo != null
                  ? `Cupo: ${e.inscritosCount}/${e.cupoMaximo} inscritos${cupoLleno ? ' — lleno' : ''}`
                  : `${e.inscritosCount} inscrito${e.inscritosCount === 1 ? '' : 's'}`}
              </p>

              {esAdministrativo ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn--sm"
                    style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-accent)' }}
                    disabled={cargandoInscritosId === e.id}
                    onClick={() => verInscritos(e.id)}
                  >
                    {cargandoInscritosId === e.id && <ButtonSpinner />}
                    Ver inscritos
                  </button>
                  <button
                    className="btn btn--sm"
                    style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                    onClick={() => setEventoEditar(e)}
                  >
                    Editar
                  </button>
                </div>
              ) : user?.rol === 'Estudiante' || user?.rol === 'Docente' ? (
                inscrito ? (
                  <span className="status-badge status-badge--ok" style={{ display: 'inline-block', marginTop: 12 }}>
                    Ya estás inscrito
                  </span>
                ) : e.estado === 'Cancelado' ? (
                  <span className="status-badge status-badge--bad" style={{ display: 'inline-block', marginTop: 12 }}>
                    Evento cancelado
                  </span>
                ) : cupoLleno ? (
                  <span className="status-badge status-badge--warn" style={{ display: 'inline-block', marginTop: 12 }}>
                    Cupo lleno
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
        {visibles.length === 0 && (
          <p style={{ gridColumn: '1 / -1', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            No hay eventos que coincidan con el filtro.
          </p>
        )}
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
            {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
            <CamposEvento form={form} setForm={setForm} />
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

      {eventoEditar && (
        <EditarEventoModal
          evento={eventoEditar}
          onClose={() => setEventoEditar(null)}
          onGuardarDatos={handleGuardarDatosEditar}
          onCambiarEstado={handleCambiarEstadoEditar}
          onVerInscritos={verInscritos}
          cargandoInscritos={cargandoInscritosId === eventoEditar.id}
          onEliminar={setEventoAEliminar}
        />
      )}
    </div>
  )
}
