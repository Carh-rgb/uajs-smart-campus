import React, { useState, useEffect } from 'react'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useReservas } from '../context/ReservasContext.jsx'
import { estadosReserva } from '../data/mockData.js'
import { useHighlightRow } from '../hooks/useHighlightRow.js'

const PESTANAS_DOCENTE = ['Pabellones / Salones', 'Salas especiales', 'Salas de biblioteca', 'Laboratorios y equipos']
const PESTANAS_ESTUDIANTE = ['Laboratorios y equipos', 'Salas de biblioteca']

function FormularioReserva({ user, catalogo, onCrear }) {
  const { pabellones, salasEspeciales, salasBiblioteca, equipos } = catalogo
  const pestanas = user.rol === 'Estudiante' ? PESTANAS_ESTUDIANTE : PESTANAS_DOCENTE
  const [pestana, setPestana] = useState(pestanas[0])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [pabellonId, setPabellonId] = useState('')
  const pabellonActual = pabellones.find((p) => p.id === pabellonId) || pabellones[0]
  const [salonId, setSalonId] = useState('')
  const [salaEspecialId, setSalaEspecialId] = useState('')
  const [salaBibliotecaId, setSalaBibliotecaId] = useState('')
  const [equipoCodigo, setEquipoCodigo] = useState('')

  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    if (pabellones.length && !pabellonId) setPabellonId(pabellones[0].id)
    if (salasEspeciales.length && !salaEspecialId) setSalaEspecialId(salasEspeciales[0].id)
    if (salasBiblioteca.length && !salaBibliotecaId) setSalaBibliotecaId(salasBiblioteca[0].id)
    if (equipos.length && !equipoCodigo) {
      // Preferir un equipo con stock disponible como valor inicial, para
      // que el estudiante no arranque el formulario con algo que no puede pedir.
      const conStock = equipos.find((eq) => eq.stock > 0)
      setEquipoCodigo((conStock || equipos[0]).codigo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pabellones, salasEspeciales, salasBiblioteca, equipos])

  useEffect(() => {
    if (pabellonActual?.salones?.length) setSalonId(pabellonActual.salones[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pabellonId, pabellones])

  if (!pabellonActual || !pabellonActual.salones) {
    return (
      <div className="panel">
        <div className="brand-loading-panel">
          <BrandSpinner size="md" label="Cargando catálogo de espacios..." />
        </div>
      </div>
    )
  }

  const espacioSeleccionado =
    pestana === 'Pabellones / Salones'
      ? pabellonActual.salones.find((s) => s.id === salonId)?.nombre
      : pestana === 'Salas especiales'
      ? salasEspeciales.find((s) => s.id === salaEspecialId)?.nombre
      : pestana === 'Salas de biblioteca'
      ? salasBiblioteca.find((s) => s.id === salaBibliotecaId)?.nombre
      : equipos.find((e) => e.codigo === equipoCodigo)?.nombre

  const tipoEspacio = pestana === 'Laboratorios y equipos' ? 'equipo' : 'espacio'
  const equipoSeleccionado = equipos.find((e) => e.codigo === equipoCodigo)
  const sinStock = tipoEspacio === 'equipo' && (!equipoSeleccionado || equipoSeleccionado.stock === 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fecha || !horaInicio || !horaFin || !motivo) return
    setEnviando(true)
    try {
      await onCrear({
        tipoEspacio,
        espacio: espacioSeleccionado,
        fecha,
        horaInicio,
        horaFin,
        motivo,
      })
      setFecha('')
      setHoraInicio('')
      setHoraFin('')
      setMotivo('')
      setError('')
    } catch (err) {
      setError(err.message || 'No se pudo registrar la reserva.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="panel">
      <h3 className="panel__title">Formulario de reserva</h3>
      {error && <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{error}</p>}

      {pestanas.length > 1 && (
        <div className="toolbar">
          {pestanas.map((p) => (
            <button
              key={p}
              type="button"
              className="btn btn--sm"
              style={{
                width: 'auto',
                background: pestana === p ? 'var(--color-navy)' : 'transparent',
                color: pestana === p ? '#fff' : 'var(--color-navy)',
                border: '1px solid var(--color-border)',
              }}
              onClick={() => setPestana(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {pestana === 'Pabellones / Salones' && (
          <div className="field-grid">
            <div className="field">
              <label className="field__label">Pabellón</label>
              <select className="field__input" value={pabellonId} onChange={(e) => setPabellonId(e.target.value)}>
                {pabellones.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Salón</label>
              <select className="field__input" value={salonId} onChange={(e) => setSalonId(e.target.value)}>
                {pabellonActual.salones.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre} (capacidad {s.capacidad})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {pestana === 'Salas especiales' && (
          <div className="field">
            <label className="field__label">Sala especial</label>
            <div className="toolbar">
              {salasEspeciales.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="btn btn--sm"
                  style={{
                    width: 'auto',
                    background: salaEspecialId === s.id ? 'var(--color-navy)' : 'transparent',
                    color: salaEspecialId === s.id ? '#fff' : 'var(--color-navy)',
                    border: '1px solid var(--color-border)',
                  }}
                  onClick={() => setSalaEspecialId(s.id)}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {pestana === 'Salas de biblioteca' && (
          <div className="field">
            <label className="field__label">Sala de biblioteca</label>
            <div className="toolbar">
              {salasBiblioteca.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="btn btn--sm"
                  style={{
                    width: 'auto',
                    background: salaBibliotecaId === s.id ? 'var(--color-navy)' : 'transparent',
                    color: salaBibliotecaId === s.id ? '#fff' : 'var(--color-navy)',
                    border: '1px solid var(--color-border)',
                  }}
                  onClick={() => setSalaBibliotecaId(s.id)}
                >
                  {s.nombre} ({s.capacidad})
                </button>
              ))}
            </div>
          </div>
        )}

        {pestana === 'Laboratorios y equipos' && (
          <div className="field">
            <label className="field__label">Equipo</label>
            <select className="field__input" value={equipoCodigo} onChange={(e) => setEquipoCodigo(e.target.value)}>
              {equipos.map((eq) => (
                <option key={eq.codigo} value={eq.codigo} disabled={eq.stock === 0}>
                  {eq.nombre} ({eq.tipo}) — {eq.stock > 0 ? `${eq.stock} disponible${eq.stock === 1 ? '' : 's'}` : 'sin stock'}
                </option>
              ))}
            </select>
            {equipoSeleccionado?.stock === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 6 }}>
                No hay unidades disponibles de este equipo por ahora.
              </p>
            )}
          </div>
        )}

        <div className="field-grid">
          <div className="field">
            <label className="field__label">Fecha</label>
            <input className="field__input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field__label">Hora de inicio</label>
            <input className="field__input" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field__label">Hora de fin</label>
            <input className="field__input" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label className="field__label">Motivo / asignatura / actividad</label>
          <input
            className="field__input"
            placeholder="Ej: Clase de Bases de Datos"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />
        </div>

        <LoadingButton
          type="submit"
          className="btn btn--primary"
          style={{ width: 'auto' }}
          loading={enviando}
          loadingText="Reservando..."
          disabled={sinStock}
        >
          Reservar {espacioSeleccionado}
        </LoadingButton>
      </form>
    </div>
  )
}

function StockEquipos({ equipos, subtitulo }) {
  return (
    <div className="panel">
      <h3 className="panel__title">Stock de equipos</h3>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 16 }}>
        {subtitulo || 'Unidades totales disponibles por equipo. Solo lo ve el personal administrativo.'}
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Equipo</th>
            <th>Tipo</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((eq) => (
            <tr key={eq.codigo}>
              <td>{eq.codigo}</td>
              <td>{eq.nombre}</td>
              <td>{eq.tipo}</td>
              <td>
                <span
                  className={`status-badge ${eq.stock > 0 ? 'status-badge--ok' : 'status-badge--bad'}`}
                >
                  {eq.stock} {eq.stock === 1 ? 'unidad' : 'unidades'}
                </span>
              </td>
            </tr>
          ))}
          {equipos.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No hay equipos registrados en el catálogo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function GestionReservas({ reservas, actualizarEstado, onVerHistorial, cargandoHistorialId, onEliminar, highlightId }) {
  const [errorEstado, setErrorEstado] = useState('')

  const handleCambiarEstado = async (id, estado) => {
    setErrorEstado('')
    try {
      await actualizarEstado(id, estado)
    } catch (err) {
      setErrorEstado(err.message || 'No se pudo actualizar el estado de la reserva.')
    }
  }

  return (
    <div className="panel">
      <h3 className="panel__title">Reservas de estudiantes y docentes</h3>
      {errorEstado && (
        <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginTop: -8, marginBottom: 14 }}>{errorEstado}</p>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Solicitante</th>
            <th>Rol</th>
            <th>Espacio / equipo</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Estado</th>
            <th>Gestión</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r.id} data-row-id={r.id} className={highlightId === r.id ? 'row--highlight' : undefined}>
              <td>{r.id}</td>
              <td>{r.solicitanteNombre}</td>
              <td>{r.rolSolicitante}</td>
              <td>{r.espacio}</td>
              <td>{r.fecha}</td>
              <td>{r.horaInicio} - {r.horaFin}</td>
              <td><StatusBadge estado={r.estado} /></td>
              <td>
                <select
                  className="toolbar__select"
                  value={r.estado}
                  onChange={(e) => handleCambiarEstado(r.id, e.target.value)}
                >
                  {estadosReserva.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="btn btn--sm"
                  style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', marginRight: 6 }}
                  disabled={cargandoHistorialId === r.id}
                  onClick={() => onVerHistorial(r.id)}
                >
                  {cargandoHistorialId === r.id && <ButtonSpinner />}
                  Historial
                </button>
                <button
                  className="btn btn--sm"
                  style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                  onClick={() => onEliminar(r)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {reservas.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No hay reservas registradas todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function Reservas() {
  const { user } = useAuth()
  const {
    reservas,
    catalogo,
    cargando,
    actualizarEstado,
    crearReserva,
    obtenerHistorial,
    eliminarReserva,
    recargar,
    recargarCatalogo,
  } = useReservas()
  const [historialId, setHistorialId] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargandoHistorialId, setCargandoHistorialId] = useState(null)
  const [reservaAEliminar, setReservaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const highlightId = useHighlightRow()

  // El catalogo de equipos (y su stock) vive en un contexto que se monta
  // una sola vez al iniciar sesion, asi que sin esto quedaba desfasado
  // hasta refrescar el navegador cada vez que algo cambiaba en Recursos.
  useEffect(() => {
    recargar()
    recargarCatalogo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const esAdministrativo = user?.rol === 'Administrativo' || user?.rol === 'Administrador del sistema'

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
      await eliminarReserva(reservaAEliminar.id)
      setReservaAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Reservas</h1>
        <p className="view-header__subtitle">
          {esAdministrativo
            ? 'Gestiona las reservas realizadas por estudiantes y docentes'
            : 'Solicita y consulta la disponibilidad de espacios y equipos'}
        </p>
      </div>

      {cargando ? (
        <div className="panel">
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando reservas..." />
          </div>
        </div>
      ) : esAdministrativo ? (
        <>
          <StockEquipos equipos={catalogo.equipos} />
          <GestionReservas
            reservas={reservas}
            actualizarEstado={actualizarEstado}
            onVerHistorial={verHistorial}
            cargandoHistorialId={cargandoHistorialId}
            onEliminar={setReservaAEliminar}
            highlightId={highlightId}
          />
        </>
      ) : (
        <>
          {catalogo.equipos.length > 0 && (
            <StockEquipos
              equipos={catalogo.equipos}
              subtitulo="Unidades disponibles de cada equipo. Si un equipo está en 0, no podrás reservarlo por ahora."
            />
          )}
          <FormularioReserva user={user} catalogo={catalogo} onCrear={crearReserva} />

          <div className="panel">
            <h3 className="panel__title">Mis reservas</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Espacio / equipo</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.id} data-row-id={r.id} className={highlightId === r.id ? 'row--highlight' : undefined}>
                    <td>{r.id}</td>
                    <td>{r.espacio}</td>
                    <td>{r.fecha}</td>
                    <td>{r.horaInicio} - {r.horaFin}</td>
                    <td>{r.motivo}</td>
                    <td><StatusBadge estado={r.estado} /></td>
                    <td>
                      <button
                        className="btn btn--sm"
                        style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', marginRight: 6 }}
                        disabled={cargandoHistorialId === r.id}
                        onClick={() => verHistorial(r.id)}
                      >
                        {cargandoHistorialId === r.id && <ButtonSpinner />}
                        Historial
                      </button>
                      {r.estado === 'Pendiente' && (
                        <button
                          className="btn btn--sm"
                          style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                          onClick={() => setReservaAEliminar(r)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      Aún no tienes reservas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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

      {reservaAEliminar && (
        <ConfirmDialog
          title="Eliminar reserva"
          text={`¿Seguro que deseas eliminar la reserva ${reservaAEliminar.id}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={confirmarEliminar}
          onCancel={() => setReservaAEliminar(null)}
        />
      )}
    </div>
  )
}
