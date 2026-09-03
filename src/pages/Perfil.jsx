import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const TIPOS_DOCUMENTO = ['Cédula de ciudadanía', 'Tarjeta de identidad', 'Cédula de extranjería', 'Pasaporte']
const GENEROS = ['Femenino', 'Masculino', 'Prefiero no decirlo', 'Otro']

const VALORES_INICIALES_POR_ROL = {
  Estudiante: {
    programa: 'Ingeniería de Sistemas',
    codigo: 'EST-2023-0145',
    semestre: '6to semestre',
  },
  Docente: {
    area: 'Facultad de Ingeniería',
    asignaturas: 'Bases de Datos, Sistemas Distribuidos',
    extension: '2201',
  },
  Administrativo: {
    cargo: 'Coordinador de Bienestar Universitario',
    oficina: 'Edificio administrativo, piso 2',
    extension: '1105',
  },
  'Administrador del sistema': {
    cargo: 'Administrador de la plataforma',
    oficina: 'Oficina de Tecnología',
    extension: '1000',
  },
}

export default function Perfil() {
  const { user } = useAuth()
  const rol = user?.rol
  const iniciales = (user?.nombre || 'US')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  const [correoContacto, setCorreoContacto] = useState(user?.correo || '')
  const [telefono, setTelefono] = useState('300 123 4567')
  const [direccion, setDireccion] = useState('Cra. 20 #15-30, Sincelejo, Sucre')
  const [fechaNacimiento, setFechaNacimiento] = useState('2003-04-12')
  const [genero, setGenero] = useState(GENEROS[0])
  const [tipoDocumento, setTipoDocumento] = useState(TIPOS_DOCUMENTO[0])
  const [numeroDocumento, setNumeroDocumento] = useState('1005 987 654')

  const [contactoNombre, setContactoNombre] = useState('María Ramírez')
  const [contactoRelacion, setContactoRelacion] = useState('Madre')
  const [contactoTelefono, setContactoTelefono] = useState('300 765 4321')

  const [datosRol, setDatosRol] = useState(VALORES_INICIALES_POR_ROL[rol] || {})
  const actualizarDatoRol = (campo, valor) => setDatosRol({ ...datosRol, [campo]: valor })

  const [guardado, setGuardado] = useState(false)
  const handleGuardar = () => {
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Perfil</h1>
        <p className="view-header__subtitle">Tu información dentro de la plataforma</p>
      </div>

      <div className="profile-card">
        <div className="profile-card__avatar">{iniciales}</div>
        <div>
          <h3 style={{ marginBottom: 4 }}>{user?.nombre}</h3>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {rol} · Estado de cuenta activo
          </p>
        </div>
      </div>

      {/* Datos personales */}
      <div className="panel">
        <h3 className="panel__title">Datos personales</h3>
        <div className="field-grid">
          <div className="field">
            <label className="field__label">Nombre completo</label>
            <input className="field__input" value={user?.nombre || ''} readOnly />
          </div>
          <div className="field">
            <label className="field__label">Tipo de usuario</label>
            <input className="field__input" value={rol || ''} readOnly />
          </div>
          <div className="field">
            <label className="field__label">Fecha de nacimiento</label>
            <input
              className="field__input"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label">Género</label>
            <select className="field__input" value={genero} onChange={(e) => setGenero(e.target.value)}>
              {GENEROS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Tipo de documento</label>
            <select className="field__input" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Número de documento</label>
            <input className="field__input" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Información academica / laboral segun el rol */}
      {rol === 'Estudiante' && (
        <div className="panel">
          <h3 className="panel__title">Información académica</h3>
          <div className="field-grid">
            <div className="field">
              <label className="field__label">Programa académico</label>
              <input className="field__input" value={datosRol.programa || ''} onChange={(e) => actualizarDatoRol('programa', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Código estudiantil</label>
              <input className="field__input" value={datosRol.codigo || ''} onChange={(e) => actualizarDatoRol('codigo', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Semestre actual</label>
              <input className="field__input" value={datosRol.semestre || ''} onChange={(e) => actualizarDatoRol('semestre', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {rol === 'Docente' && (
        <div className="panel">
          <h3 className="panel__title">Información laboral</h3>
          <div className="field-grid">
            <div className="field">
              <label className="field__label">Facultad / Área</label>
              <input className="field__input" value={datosRol.area || ''} onChange={(e) => actualizarDatoRol('area', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Asignaturas a cargo</label>
              <input className="field__input" value={datosRol.asignaturas || ''} onChange={(e) => actualizarDatoRol('asignaturas', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Extensión telefónica</label>
              <input className="field__input" value={datosRol.extension || ''} onChange={(e) => actualizarDatoRol('extension', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {(rol === 'Administrativo' || rol === 'Administrador del sistema') && (
        <div className="panel">
          <h3 className="panel__title">Información laboral</h3>
          <div className="field-grid">
            <div className="field">
              <label className="field__label">Cargo</label>
              <input className="field__input" value={datosRol.cargo || ''} onChange={(e) => actualizarDatoRol('cargo', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Oficina / Dependencia</label>
              <input className="field__input" value={datosRol.oficina || ''} onChange={(e) => actualizarDatoRol('oficina', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Extensión telefónica</label>
              <input className="field__input" value={datosRol.extension || ''} onChange={(e) => actualizarDatoRol('extension', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Datos de contacto */}
      <div className="panel">
        <h3 className="panel__title">Datos de contacto</h3>
        <div className="field-grid">
          <div className="field">
            <label className="field__label">Correo institucional</label>
            <input className="field__input" value={correoContacto} onChange={(e) => setCorreoContacto(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Teléfono / celular</label>
            <input className="field__input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field__label">Dirección de residencia</label>
            <input className="field__input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contacto de emergencia */}
      <div className="panel">
        <h3 className="panel__title">Contacto de emergencia</h3>
        <div className="field-grid">
          <div className="field">
            <label className="field__label">Nombre completo</label>
            <input className="field__input" value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Parentesco</label>
            <input className="field__input" value={contactoRelacion} onChange={(e) => setContactoRelacion(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Teléfono</label>
            <input className="field__input" value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} />
          </div>
        </div>

        <button className="btn btn--primary" style={{ width: 'auto', marginTop: 8 }} onClick={handleGuardar}>
          Guardar cambios
        </button>
        {guardado && (
          <p style={{ fontSize: 12.5, color: 'var(--color-success)', marginTop: 10 }}>
            ✓ Cambios guardados correctamente.
          </p>
        )}
      </div>
    </div>
  )
}
