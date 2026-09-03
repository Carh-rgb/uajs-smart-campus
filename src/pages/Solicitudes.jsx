import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { estadosSolicitud, tiposSolicitud, dependencias } from '../data/mockData.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSolicitudes } from '../context/SolicitudesContext.jsx'

export default function Solicitudes() {
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [historialId, setHistorialId] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [historial, setHistorial] = useState([])
  const { solicitudes, crearSolicitud, obtenerSolicitud } = useSolicitudes()
  const puedeCrear = user?.rol !== 'Administrativo'

  // El backend ya devuelve solo las solicitudes propias para
  // Estudiante/Docente, y todas para Administrativo/Admin.
  const { data, loading } = useFetch(
    () => solicitudes,
    (s) => {
      const coincideEstado = filtroEstado === 'Todos' || s.estado === filtroEstado
      const texto = busqueda.trim().toLowerCase()
      const coincideBusqueda =
        !texto ||
        s.id.toLowerCase().includes(texto) ||
        s.tipo.toLowerCase().includes(texto) ||
        s.descripcion.toLowerCase().includes(texto)
      return coincideEstado && coincideBusqueda
    },
    [filtroEstado, busqueda, solicitudes],
  )

  const [form, setForm] = useState({
    tipo: tiposSolicitud[0],
    dependencia: dependencias[0],
    prioridad: 'Media',
    descripcion: '',
  })

  const [errorCrear, setErrorCrear] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargandoHistorialId, setCargandoHistorialId] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      const nueva = await crearSolicitud(form)
      setModalAbierto(false)
      setForm({ tipo: tiposSolicitud[0], dependencia: dependencias[0], prioridad: 'Media', descripcion: '' })
      setErrorCrear('')
      navigate(`/app/solicitudes/${nueva.id}`)
    } catch (err) {
      setErrorCrear(err.message || 'No se pudo registrar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  const verHistorial = async (id) => {
    setCargandoHistorialId(id)
    try {
      const detalle = await obtenerSolicitud(id)
      setHistorial(detalle.historial || [])
      setHistorialId(id)
    } finally {
      setCargandoHistorialId(null)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Solicitudes</h1>
        <p className="view-header__subtitle">
          Gestión y seguimiento del estado de tus solicitudes
        </p>
      </div>

      <div className="toolbar">
        <input
          className="toolbar__input"
          placeholder="Buscar por ID, tipo o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select
          className="toolbar__select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option>Todos</option>
          {estadosSolicitud.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        {puedeCrear && (
          <button
            className="btn btn--primary btn--sm"
            style={{ width: 'auto' }}
            onClick={() => setModalAbierto(true)}
          >
            + Nueva solicitud
          </button>
        )}
      </div>

      <div className="panel">
        {loading ? (
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando solicitudes..." />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo de servicio</th>
                <th>Dependencia</th>
                <th>Asignado a</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.tipo}</td>
                  <td>{s.dependencia}</td>
                  <td>{s.asignadoA || 'Sin asignar'}</td>
                  <td>{s.fecha}</td>
                  <td>
                    <StatusBadge estado={s.estado} />
                  </td>
                  <td>
                    <button
                      className="btn btn--sm"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-navy)',
                        marginRight: 6,
                      }}
                      onClick={() => navigate(`/app/solicitudes/${s.id}`)}
                    >
                      Ver detalle
                    </button>
                    <button
                      className="btn btn--sm"
                      style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                      disabled={cargandoHistorialId === s.id}
                      onClick={() => verHistorial(s.id)}
                    >
                      {cargandoHistorialId === s.id && <ButtonSpinner />}
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                    No se encontraron solicitudes para "{busqueda}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal title="Nueva solicitud" onClose={() => setModalAbierto(false)}>
          <form onSubmit={handleSubmit}>
            {errorCrear && (
              <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{errorCrear}</p>
            )}
            <div className="field-grid">
              <div className="field">
                <label className="field__label">Tipo</label>
                <select
                  className="field__input"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {tiposSolicitud.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Dependencia</label>
                <select
                  className="field__input"
                  value={form.dependencia}
                  onChange={(e) => setForm({ ...form, dependencia: e.target.value })}
                >
                  {dependencias.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Prioridad</label>
                <select
                  className="field__input"
                  value={form.prioridad}
                  onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                >
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                </select>
              </div>
              <div className="field">
                <label className="field__label">Adjunto</label>
                <input className="field__input" type="file" />
              </div>
            </div>

            <div className="field">
              <label className="field__label">Descripción</label>
              <textarea
                className="field__input"
                rows={4}
                required
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe tu solicitud..."
              />
            </div>

            <LoadingButton
              type="submit"
              className="btn btn--primary"
              style={{ width: 'auto' }}
              loading={enviando}
              loadingText="Registrando..."
            >
              Registrar solicitud
            </LoadingButton>
          </form>
        </Modal>
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
