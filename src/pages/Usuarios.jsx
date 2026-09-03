import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useUsers } from '../context/UsersContext.jsx'
import { usePermissions, MODULOS, ROLES_GESTIONABLES } from '../context/PermissionsContext.jsx'
import Modal from '../components/Modal.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { BrandSpinner, ButtonSpinner } from '../components/BrandSpinner.jsx'
import { esCorreoInstitucional } from '../utils/validation.js'

const ROLES_DISPONIBLES = [...ROLES_GESTIONABLES, 'Administrador del sistema']

export default function Usuarios() {
  const { user } = useAuth()
  const { usuarios, cargando, crearUsuario, toggleActivo, actualizarRol } = useUsers()
  const { modulosActivos, toggleModulo } = usePermissions()

  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('Todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({ nombre: '', correo: '', rol: 'Estudiante', programa: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [creando, setCreando] = useState(false)
  const [cargandoEstadoId, setCargandoEstadoId] = useState(null)

  if (user?.rol !== 'Administrador del sistema') {
    return (
      <div>
        <div className="view-header">
          <h1 className="view-header__title">Usuarios</h1>
          <p className="view-header__subtitle">No tienes autorización para ver este módulo</p>
        </div>
        <div className="panel">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Solo el rol Administrador del sistema puede gestionar usuarios y permisos.
          </p>
        </div>
      </div>
    )
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = busqueda.trim().toLowerCase()
    const coincideTexto = !texto || u.nombre.toLowerCase().includes(texto) || u.correo.toLowerCase().includes(texto)
    const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol
    return coincideTexto && coincideRol
  })

  const handleCrear = async (e) => {
    e.preventDefault()
    const nuevosErrores = {}
    if (!form.nombre.trim()) nuevosErrores.nombre = true
    if (!esCorreoInstitucional(form.correo)) nuevosErrores.correo = true
    if (!form.password || form.password.length < 6) nuevosErrores.password = true

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setErrorGeneral(
        nuevosErrores.correo && !nuevosErrores.nombre
          ? 'El correo debe pertenecer al dominio @uajs.edu.co'
          : nuevosErrores.password
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : 'Completa los campos obligatorios.',
      )
      return
    }

    setErrores({})
    setErrorGeneral('')
    setCreando(true)
    try {
      await crearUsuario(form)
      setForm({ nombre: '', correo: '', rol: 'Estudiante', programa: '', password: '' })
      setModalAbierto(false)
    } catch (err) {
      setErrorGeneral(err.message || 'No se pudo crear el usuario.')
    } finally {
      setCreando(false)
    }
  }

  const handleToggleActivo = async (id) => {
    setCargandoEstadoId(id)
    try {
      await toggleActivo(id)
    } finally {
      setCargandoEstadoId(null)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Usuarios</h1>
        <p className="view-header__subtitle">
          Crea usuarios, gestiona su estado y administra los permisos de cada perfil
        </p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <p className="kpi-card__label">Usuarios totales</p>
          <p className="kpi-card__value">{usuarios.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Activos</p>
          <p className="kpi-card__value">{usuarios.filter((u) => u.activo).length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Inactivos</p>
          <p className="kpi-card__value">{usuarios.filter((u) => !u.activo).length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Roles distintos</p>
          <p className="kpi-card__value">{new Set(usuarios.map((u) => u.rol)).size}</p>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel__title">Usuarios registrados</h3>

        <div className="toolbar">
          <input
            className="toolbar__input"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <select className="toolbar__select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option>Todos</option>
            {ROLES_DISPONIBLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="btn btn--primary btn--sm" style={{ width: 'auto' }} onClick={() => setModalAbierto(true)}>
            + Nuevo usuario
          </button>
        </div>

        {cargando ? (
          <div className="brand-loading-panel">
            <BrandSpinner size="md" label="Cargando usuarios..." />
          </div>
        ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.correo}</td>
                <td>
                  <select
                    className="toolbar__select"
                    value={u.rol}
                    onChange={(e) => actualizarRol(u.id, e.target.value)}
                  >
                    {ROLES_DISPONIBLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <span className={`status-badge ${u.activo ? 'status-badge--ok' : 'status-badge--bad'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn--sm"
                    style={{ width: 'auto', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-navy)' }}
                    disabled={cargandoEstadoId === u.id}
                    onClick={() => handleToggleActivo(u.id)}
                  >
                    {cargandoEstadoId === u.id && <ButtonSpinner />}
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      <div className="panel">
        <h3 className="panel__title">Permisos por rol — módulos activos</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Módulo</th>
              {ROLES_GESTIONABLES.map((rol) => (
                <th key={rol} style={{ textAlign: 'center' }}>{rol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULOS.map((modulo) => (
              <tr key={modulo.id}>
                <td>{modulo.label}</td>
                {ROLES_GESTIONABLES.map((rol) => {
                  const activo = modulosActivos(rol).includes(modulo.id)
                  return (
                    <td key={rol} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={() => toggleModulo(rol, modulo.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 16 }}>
          El rol Administrador del sistema siempre mantiene acceso completo y no se muestra en esta tabla.
        </p>
      </div>

      {modalAbierto && (
        <Modal title="Nuevo usuario" onClose={() => setModalAbierto(false)}>
          <form onSubmit={handleCrear} noValidate>
            {errorGeneral && (
              <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{errorGeneral}</p>
            )}
            <div className="field">
              <label className="field__label">Nombre completo</label>
              <input
                className={`field__input ${errores.nombre ? 'field__input--error' : ''}`}
                value={form.nombre}
                onChange={(e) => {
                  setForm({ ...form, nombre: e.target.value })
                  if (errores.nombre) setErrores({ ...errores, nombre: false })
                }}
              />
            </div>
            <div className="field">
              <label className="field__label">Correo institucional</label>
              <input
                className={`field__input ${errores.correo ? 'field__input--error' : ''}`}
                type="email"
                value={form.correo}
                onChange={(e) => {
                  setForm({ ...form, correo: e.target.value })
                  if (errores.correo) setErrores({ ...errores, correo: false })
                }}
                placeholder="nombre.apellido@uajs.edu.co"
              />
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="field__label">Rol</label>
                <select className="field__input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  {ROLES_DISPONIBLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Programa / Dependencia</label>
                <input className="field__input" value={form.programa} onChange={(e) => setForm({ ...form, programa: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Contraseña temporal</label>
              <input
                className={`field__input ${errores.password ? 'field__input--error' : ''}`}
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value })
                  if (errores.password) setErrores({ ...errores, password: false })
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <LoadingButton
              type="submit"
              className="btn btn--primary"
              style={{ width: 'auto' }}
              loading={creando}
              loadingText="Creando..."
            >
              Crear usuario
            </LoadingButton>
          </form>
        </Modal>
      )}
    </div>
  )
}
