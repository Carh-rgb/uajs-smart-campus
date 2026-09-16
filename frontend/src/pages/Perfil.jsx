import React, { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingButton from '../components/LoadingButton.jsx'
import { redimensionarImagen } from '../utils/image.js'

const SIN_DATO = 'No registrado por la institución'

// Registro academico/laboral: lo fija el Administrador del sistema al
// crear la cuenta (ver Usuarios.jsx). Aqui solo se muestra en solo
// lectura, tomando los datos reales del usuario.
function registroInstitucionalDe(user) {
  if (!user) return null
  if (user.rol === 'Estudiante') {
    return {
      titulo: 'Información académica',
      campos: [
        { label: 'Programa académico', valor: user.programa || SIN_DATO },
        { label: 'Código estudiantil', valor: user.codigoEstudiantil || SIN_DATO },
        { label: 'Semestre actual', valor: user.semestre || SIN_DATO },
      ],
    }
  }
  if (user.rol === 'Docente') {
    return {
      titulo: 'Información laboral',
      campos: [
        { label: 'Facultad / Área', valor: user.area || SIN_DATO },
        { label: 'Asignaturas a cargo', valor: user.asignaturas || SIN_DATO },
        { label: 'Extensión telefónica', valor: user.extension || SIN_DATO },
      ],
    }
  }
  if (user.rol === 'Administrativo' || user.rol === 'Administrador del sistema') {
    return {
      titulo: 'Información laboral',
      campos: [
        { label: 'Cargo', valor: user.cargo || SIN_DATO },
        { label: 'Oficina / Dependencia', valor: user.oficina || SIN_DATO },
        { label: 'Extensión telefónica', valor: user.extension || SIN_DATO },
      ],
    }
  }
  return null
}

const estiloSoloLectura = { background: 'var(--color-bg)', cursor: 'not-allowed' }

export default function Perfil() {
  const { user, actualizarPerfil, actualizarCorreoRecuperacion } = useAuth()
  const rol = user?.rol
  const iniciales = (user?.nombre || 'US')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  // Solo estos campos son de contacto personal, sin implicaciones de
  // seguridad ni de registro institucional: se editan y se guardan de
  // verdad contra el backend. Nombre, correo, rol, genero, documento de
  // identidad y la informacion academica/laboral quedan bloqueados (ver
  // mas abajo) — los fija el Administrador del sistema al crear la cuenta.
  const [telefono, setTelefono] = useState(user?.telefono || '')
  const [direccion, setDireccion] = useState(user?.direccion || '')
  const [fechaNacimiento, setFechaNacimiento] = useState(user?.fechaNacimiento || '')
  const [contactoNombre, setContactoNombre] = useState(user?.contactoEmergenciaNombre || '')
  const [contactoRelacion, setContactoRelacion] = useState(user?.contactoEmergenciaRelacion || '')
  const [contactoTelefono, setContactoTelefono] = useState(user?.contactoEmergenciaTelefono || '')

  const [errorPerfil, setErrorPerfil] = useState('')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [guardadoPerfil, setGuardadoPerfil] = useState(false)

  const inputFotoRef = useRef(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')

  const handleSeleccionarFoto = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    if (!archivo.type.startsWith('image/')) {
      setErrorFoto('Selecciona un archivo de imagen.')
      return
    }

    setErrorFoto('')
    setSubiendoFoto(true)
    try {
      const fotoPerfil = await redimensionarImagen(archivo)
      await actualizarPerfil({ fotoPerfil })
    } catch (err) {
      setErrorFoto(err.message || 'No se pudo actualizar la foto de perfil.')
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleGuardarPerfil = async (e) => {
    e.preventDefault()
    setErrorPerfil('')
    setGuardandoPerfil(true)
    try {
      await actualizarPerfil({
        telefono,
        direccion,
        fechaNacimiento,
        contactoEmergenciaNombre: contactoNombre,
        contactoEmergenciaRelacion: contactoRelacion,
        contactoEmergenciaTelefono: contactoTelefono,
      })
      setGuardadoPerfil(true)
      setTimeout(() => setGuardadoPerfil(false), 3000)
    } catch (err) {
      setErrorPerfil(err.message || 'No se pudieron guardar los cambios.')
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const [correoRecuperacion, setCorreoRecuperacion] = useState(user?.correoRecuperacion || '')
  const [errorRecuperacion, setErrorRecuperacion] = useState('')
  const [guardandoRecuperacion, setGuardandoRecuperacion] = useState(false)
  const [guardadoRecuperacion, setGuardadoRecuperacion] = useState(false)

  const handleGuardarRecuperacion = async (e) => {
    e.preventDefault()
    setErrorRecuperacion('')
    setGuardandoRecuperacion(true)
    try {
      await actualizarCorreoRecuperacion(correoRecuperacion)
      setGuardadoRecuperacion(true)
      setTimeout(() => setGuardadoRecuperacion(false), 3000)
    } catch (err) {
      setErrorRecuperacion(err.message || 'No se pudo guardar el correo de recuperación.')
    } finally {
      setGuardandoRecuperacion(false)
    }
  }

  const registroInstitucional = registroInstitucionalDe(user)

  return (
    <div>
      <div className="view-header">
        <h1 className="view-header__title">Perfil</h1>
        <p className="view-header__subtitle">Tu información dentro de la plataforma</p>
      </div>

      <div className="profile-card">
        <div className="profile-card__avatar-wrap">
          {user?.fotoPerfil ? (
            <img src={user.fotoPerfil} alt="" className="profile-card__avatar profile-card__avatar--img" />
          ) : (
            <div className="profile-card__avatar">{iniciales}</div>
          )}
          <button
            type="button"
            className="profile-card__avatar-edit"
            onClick={() => inputFotoRef.current?.click()}
            disabled={subiendoFoto}
            aria-label="Cambiar foto de perfil"
            title="Cambiar foto de perfil"
          >
            {subiendoFoto ? '…' : '✎'}
          </button>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleSeleccionarFoto}
          />
        </div>
        <div className="profile-card__info">
          <h3 style={{ marginBottom: 4 }}>{user?.nombre}</h3>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {rol} · Estado de cuenta activo
          </p>
          {errorFoto && (
            <p style={{ margin: '6px 0 0', color: 'var(--color-danger)', fontSize: 12.5 }}>{errorFoto}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleGuardarPerfil}>
        {/* Datos personales */}
        <div className="panel">
          <h3 className="panel__title">Datos personales</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 16 }}>
            El nombre, correo institucional, rol, género y documento de identidad los fija la
            institución al crear tu cuenta y no se pueden editar desde aquí.
          </p>
          <div className="field-grid">
            <div className="field">
              <label className="field__label">Nombre completo</label>
              <input className="field__input" style={estiloSoloLectura} value={user?.nombre || ''} readOnly />
            </div>
            <div className="field">
              <label className="field__label">Correo institucional</label>
              <input className="field__input" style={estiloSoloLectura} value={user?.correo || ''} readOnly />
            </div>
            <div className="field">
              <label className="field__label">Tipo de usuario</label>
              <input className="field__input" style={estiloSoloLectura} value={rol || ''} readOnly />
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
              <input className="field__input" style={estiloSoloLectura} value={user?.genero || SIN_DATO} readOnly />
            </div>
            <div className="field">
              <label className="field__label">Tipo de documento</label>
              <input className="field__input" style={estiloSoloLectura} value={user?.tipoDocumento || SIN_DATO} readOnly />
            </div>
            <div className="field">
              <label className="field__label">Número de documento</label>
              <input className="field__input" style={estiloSoloLectura} value={user?.numeroDocumento || SIN_DATO} readOnly />
            </div>
          </div>
        </div>

        {/* Información académica / laboral: registro institucional, solo lectura */}
        {registroInstitucional && (
          <div className="panel">
            <h3 className="panel__title">{registroInstitucional.titulo}</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 16 }}>
              Este registro lo gestiona la institución. Si necesitas corregirlo, contacta a un Administrativo.
            </p>
            <div className="field-grid">
              {registroInstitucional.campos.map((campo) => (
                <div className="field" key={campo.label}>
                  <label className="field__label">{campo.label}</label>
                  <input className="field__input" style={estiloSoloLectura} value={campo.valor} readOnly />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datos de contacto */}
        <div className="panel">
          <h3 className="panel__title">Datos de contacto</h3>
          <div className="field-grid">
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

          {errorPerfil && (
            <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginTop: 10 }}>{errorPerfil}</p>
          )}
          <LoadingButton
            type="submit"
            className="btn btn--primary"
            style={{ width: 'auto', marginTop: 8 }}
            loading={guardandoPerfil}
            loadingText="Guardando..."
          >
            Guardar cambios
          </LoadingButton>
          {guardadoPerfil && (
            <p style={{ fontSize: 12.5, color: 'var(--color-success)', marginTop: 10 }}>
              ✓ Cambios guardados correctamente.
            </p>
          )}
        </div>
      </form>

      {/* Correo de recuperación */}
      <div className="panel">
        <h3 className="panel__title">Correo de recuperación</h3>
        <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: -8, marginBottom: 16 }}>
          A este correo (puede ser personal, no tiene que ser institucional) se enviará el enlace
          si alguna vez usas "¿Olvidaste tu contraseña?" en el inicio de sesión.
        </p>

        {!user?.correoRecuperacion && (
          <div
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 12.5,
              color: 'var(--color-danger)',
            }}
          >
            ⚠ No has configurado un correo de recuperación. Si olvidas tu contraseña, no será
            posible restablecerla hasta que agregues uno aquí.
          </div>
        )}

        <form onSubmit={handleGuardarRecuperacion}>
          {errorRecuperacion && (
            <p style={{ fontSize: 12.5, color: 'var(--color-danger)', marginBottom: 14 }}>{errorRecuperacion}</p>
          )}
          <div className="field">
            <label className="field__label">Correo de recuperación</label>
            <input
              className="field__input"
              type="email"
              placeholder="tu.correo.personal@gmail.com"
              value={correoRecuperacion}
              onChange={(e) => setCorreoRecuperacion(e.target.value)}
            />
          </div>
          <LoadingButton
            type="submit"
            className="btn btn--primary"
            style={{ width: 'auto' }}
            loading={guardandoRecuperacion}
            loadingText="Guardando..."
          >
            Guardar correo de recuperación
          </LoadingButton>
          {guardadoRecuperacion && (
            <p style={{ fontSize: 12.5, color: 'var(--color-success)', marginTop: 10 }}>
              ✓ Correo de recuperación guardado.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
