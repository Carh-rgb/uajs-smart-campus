import React, { useState, useEffect, useCallback } from 'react'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner } from '../components/BrandSpinner.jsx'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { tiposRecurso, estadosRecurso } from '../data/mockData.js'

export default function Recursos() {
  const { user } = useAuth()
  const puedeAdministrar = user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema'

  const [recursos, setRecursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({ nombre: '', tipo: tiposRecurso[0], ubicacion: '' })
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)
  const [recursoAEliminar, setRecursoAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

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

  const cambiarEstado = async (codigo, estado) => {
    const actualizado = await api.patch(`/recursos/${codigo}/estado`, { estado })
    setRecursos((prev) => prev.map((r) => (r.codigo === codigo ? actualizado : r)))
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
        {puedeAdministrar && (
          <button className="btn btn--primary btn--sm" style={{ width: 'auto' }} onClick={() => setModalAbierto(true)}>
            + Nuevo recurso
          </button>
        )}
      </div>

      <div className="panel">
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
              {recursos.map((r) => (
                <tr key={r.codigo}>
                  <td>{r.codigo}</td>
                  <td>{r.nombre}</td>
                  <td>{r.tipo}</td>
                  <td>{r.ubicacion}</td>
                  <td>
                    {puedeAdministrar ? (
                      <select
                        className="toolbar__select"
                        value={r.estado}
                        onChange={(e) => cambiarEstado(r.codigo, e.target.value)}
                      >
                        {estadosRecurso.map((estado) => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge estado={r.estado} />
                    )}
                  </td>
                  {puedeAdministrar && (
                    <td>
                      <button
                        className="btn btn--sm"
                        style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                        onClick={() => setRecursoAEliminar(r)}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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
