import React, { useState, useEffect, useCallback, useMemo } from 'react'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { tiposRecurso, estadosRecurso } from '../data/mockData.js'
import { useHighlightRow } from '../hooks/useHighlightRow.js'

// Fila de botones-filtro (Todos + un botón por estado) con contador, mismo
// patrón que ya se usa en el módulo de PQRS.
function FiltrosEstado({ valor, onChange, items }) {
  const opciones = ['Todos', ...estadosRecurso]
  return (
    <div className="filtro-pills">
      {opciones.map((op) => {
        const total = op === 'Todos' ? items.length : items.filter((r) => r.estado === op).length
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

function EditarRecursoModal({ recurso, onClose, onGuardarDatos, onCambiarEstado, onVerHistorial, cargandoHistorial, onEliminar }) {
  const [form, setForm] = useState({ nombre: recurso.nombre, tipo: recurso.tipo, ubicacion: recurso.ubicacion })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const handleGuardarDatos = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardarDatos(recurso.codigo, form)
      setGuardado(true)
      setError('')
      setTimeout(() => setGuardado(false), 2500)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el recurso.')
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarEstado = async (e) => {
    const nuevoEstado = e.target.value
    setCambiandoEstado(true)
    try {
      await onCambiarEstado(recurso.codigo, nuevoEstado)
    } finally {
      setCambiandoEstado(false)
    }
  }

  return (
    <Modal title={`Editar recurso — ${recurso.codigo}`} onClose={onClose}>
      <form onSubmit={handleGuardarDatos}>
        {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
        <div className="field">
          <label className="field__label">Nombre</label>
          <input
            className="field__input"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>
        <div className="field-grid">
          <div className="field">
            <label className="field__label">Tipo</label>
            <select className="field__input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {tiposRecurso.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Ubicación</label>
            <input
              className="field__input"
              required
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            />
          </div>
        </div>
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
          {guardado && <span style={{ fontSize: 12.5, color: 'var(--color-success)' }}>Recurso actualizado.</span>}
        </div>
      </form>

      <div className="asignacion-box" style={{ marginTop: 18 }}>
        <label className="field__label">Estado del recurso</label>
        <select className="field__input" value={recurso.estado} disabled={cambiandoEstado} onChange={handleCambiarEstado}>
          {estadosRecurso.map((estado) => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
          Un recurso en mantenimiento o fuera de servicio se descuenta automáticamente del stock reservable.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          className="btn btn--sm"
          style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          disabled={cargandoHistorial}
          onClick={() => onVerHistorial(recurso.codigo)}
        >
          {cargandoHistorial && <ButtonSpinner />}
          Ver historial
        </button>
        <button
          type="button"
          className="btn btn--sm"
          style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
          onClick={() => onEliminar(recurso)}
        >
          Eliminar recurso
        </button>
      </div>
    </Modal>
  )
}

export default function Recursos() {
  const { user } = useAuth()
  const puedeAdministrar = user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema'
  const highlightId = useHighlightRow()

  const [recursos, setRecursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({ nombre: '', tipo: tiposRecurso[0], ubicacion: '' })
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)
  const [recursoEditar, setRecursoEditar] = useState(null)
  const [recursoAEliminar, setRecursoAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [historialCodigo, setHistorialCodigo] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = await api.get(filtroTipo === 'Todos' ? '/recursos' : `/recursos?tipo=${encodeURIComponent(filtroTipo)}`)
      setRecursos(data)
    } catch {
      setRecursos([])
    } finally {
      setCargando(false)
    }
  }, [filtroTipo])

  useEffect(() => {
    cargar()
  }, [cargar])

  const tipos = ['Todos', ...new Set(recursos.map((r) => r.tipo))]

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return recursos
      .filter((r) => filtroEstado === 'Todos' || r.estado === filtroEstado)
      .filter((r) => {
        if (!texto) return true
        return [r.codigo, r.nombre, r.ubicacion].some((v) => v?.toLowerCase().includes(texto))
      })
  }, [recursos, filtroEstado, busqueda])

  const actualizarEnLista = (actualizado) => {
    setRecursos((prev) => prev.map((r) => (r.codigo === actualizado.codigo ? actualizado : r)))
    setRecursoEditar((prev) => (prev && prev.codigo === actualizado.codigo ? actualizado : prev))
  }

  const guardarDatos = async (codigo, datos) => {
    const actualizado = await api.patch(`/recursos/${codigo}`, datos)
    actualizarEnLista(actualizado)
  }

  const cambiarEstado = async (codigo, estado) => {
    const actualizado = await api.patch(`/recursos/${codigo}/estado`, { estado })
    actualizarEnLista(actualizado)
  }

  const verHistorial = async (codigo) => {
    setCargandoHistorial(true)
    try {
      setHistorial(await api.get(`/recursos/${codigo}/historial`))
      setHistorialCodigo(codigo)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const handleCrear = async (e) => {
    e.preventDefault()
    setCreando(true)
    try {
      const nuevo = await api.post('/recursos', form)
      setRecursos((prev) => [nuevo, ...prev])
      setForm({ nombre: '', tipo: tiposRecurso[0], ubicacion: '' })
      setModalAbierto(false)
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo registrar el recurso.')
    } finally {
      setCreando(false)
    }
  }

  const confirmarEliminar = async () => {
    setEliminando(true)
    try {
      await api.delete(`/recursos/${recursoAEliminar.codigo}`)
      setRecursos((prev) => prev.filter((r) => r.codigo !== recursoAEliminar.codigo))
      setRecursoAEliminar(null)
      setRecursoEditar(null)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Recursos</h1>
        <p className="view-header__subtitle">
          {puedeAdministrar
            ? 'Administra el catálogo de recursos físicos y tecnológicos'
            : 'Catálogo de recursos físicos y tecnológicos disponibles'}
        </p>
      </div>

      <div className="panel">
        <FiltrosEstado valor={filtroEstado} onChange={setFiltroEstado} items={recursos} />

        <div className="toolbar">
          <select
            className="toolbar__select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            {tipos.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            className="toolbar__input"
            placeholder="Buscar por código, nombre o ubicación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ minWidth: 240 }}
          />
          {puedeAdministrar && (
            <button className="btn btn--primary btn--sm" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => setModalAbierto(true)}>
              + Nuevo recurso
            </button>
          )}
        </div>

        {cargando ? (
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando recursos..." />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Ubicación</th>
                <th>Estado</th>
                {puedeAdministrar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => (
                <tr key={r.codigo} data-row-id={r.codigo} className={highlightId === r.codigo ? 'row--highlight' : undefined}>
                  <td>{r.codigo}</td>
                  <td>{r.nombre}</td>
                  <td>{r.tipo}</td>
                  <td>{r.ubicacion}</td>
                  <td><StatusBadge estado={r.estado} /></td>
                  {puedeAdministrar && (
                    <td>
                      <button
                        className="btn btn--sm"
                        style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', marginRight: 6 }}
                        onClick={() => setRecursoEditar(r)}
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={puedeAdministrar ? 6 : 5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No hay recursos que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal title="Nuevo recurso" onClose={() => setModalAbierto(false)}>
          <form onSubmit={handleCrear}>
            {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}
            <div className="field">
              <label className="field__label">Nombre</label>
              <input className="field__input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="field__label">Tipo</label>
                <select className="field__input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {tiposRecurso.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Ubicación</label>
                <input className="field__input" required value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
              </div>
            </div>
            <LoadingButton
              type="submit"
              className="btn btn--primary"
              style={{ width: 'auto' }}
              loading={creando}
              loadingText="Registrando..."
            >
              Registrar recurso
            </LoadingButton>
          </form>
        </Modal>
      )}

      {recursoEditar && (
        <EditarRecursoModal
          recurso={recursoEditar}
          onClose={() => setRecursoEditar(null)}
          onGuardarDatos={guardarDatos}
          onCambiarEstado={cambiarEstado}
          onVerHistorial={verHistorial}
          cargandoHistorial={cargandoHistorial}
          onEliminar={setRecursoAEliminar}
        />
      )}

      {historialCodigo && (
        <Modal title={`Historial — ${historialCodigo}`} onClose={() => setHistorialCodigo(null)}>
          <div className="inscritos-list">
            {historial.map((h, idx) => (
              <div className="inscritos-list__item" key={idx}>
                <span>{h.estado}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{h.fecha} · {h.por}</span>
              </div>
            ))}
            {historial.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Sin cambios registrados todavía.</p>
            )}
          </div>
        </Modal>
      )}

      {recursoAEliminar && (
        <ConfirmDialog
          title="Eliminar recurso"
          text={`¿Seguro que deseas eliminar el recurso ${recursoAEliminar.codigo} — ${recursoAEliminar.nombre}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={confirmarEliminar}
          onCancel={() => setRecursoAEliminar(null)}
        />
      )}
    </div>
  )
}
