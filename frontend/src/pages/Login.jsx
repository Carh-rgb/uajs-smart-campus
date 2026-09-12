import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { esCorreoInstitucional } from '../utils/validation.js'
import LoadingButton from '../components/LoadingButton.jsx'
import { IconoDocumento, IconoCalendario, IconoCampana } from '../components/icons.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [camposInvalidos, setCamposInvalidos] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const invalidos = {}
    if (!correo) invalidos.correo = true
    if (!password) invalidos.password = true
    if (correo && !esCorreoInstitucional(correo)) invalidos.correo = true

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos(invalidos)
      if (!correo || !password) {
        setError('Ingresa tu correo institucional y contraseña.')
      } else {
        setError('El correo debe pertenecer al dominio @uajs.edu.co')
      }
      return
    }

    setCamposInvalidos({})
    setError('')
    setEnviando(true)
    try {
      await login({ correo, password })
      navigate('/app')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  const destacados = [
    { Icono: IconoDocumento, texto: 'Solicitudes y trámites en línea' },
    { Icono: IconoCalendario, texto: 'Reservas de espacios y equipos' },
    { Icono: IconoCampana, texto: 'Notificaciones en tiempo real' },
  ]

  return (
    <div className="login-wrap">
      <div className="login-side">
        <div className="login-side__orb login-side__orb--a" aria-hidden="true" />
        <div className="login-side__orb login-side__orb--b" aria-hidden="true" />
        <div className="login-side__mark-bg" aria-hidden="true" />
        <div className="login-side__grid" aria-hidden="true" />

        <div className="login-side__main">
          <div className="login-side__brand">
            <img src="/logo-blanco.png" alt="UAJS" className="login-side__logo" />
            <p className="login-side__brand-tagline">
              Corporación Universitaria Antonio José de Sucre
            </p>
          </div>

          <div className="login-side__text">
            <span className="login-side__kicker">Plataforma institucional</span>
            <h2 className="login-side__title">Todo tu campus, en un solo lugar.</h2>
            <p className="login-side__text-body">
              Un único acceso para tus trámites, reservas y comunicación con
              la comunidad UAJS.
            </p>

            <ul className="login-side__features">
              {destacados.map((d) => (
                <li key={d.texto} className="login-side__feature">
                  <span className="login-side__feature-icon">
                    <d.Icono />
                  </span>
                  {d.texto}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="login-side__footer">
          Sitio oficial de la Corporación Universitaria Antonio José de Sucre.
        </div>
      </div>

      <div className="login-form-col">
        <div className="login-form-col__mark" aria-hidden="true" />
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__mobile-brand">
            <img src="/logo.png" alt="UAJS" />
            <span>UAJS Smart Campus</span>
          </div>

          <div className="login-card__eyebrow">Acceso institucional</div>
          <h1 className="login-card__title">Iniciar sesión</h1>
          <p className="login-card__subtitle">
            Ingresa tus credenciales de UAJS Smart Campus.
          </p>

          {error && <div className="login-card__error">{error}</div>}

          <div className="field">
            <label className="field__label">Correo institucional</label>
            <div className="field__input-wrap">
              <span className="field__input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3.5 6.5h17a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m3 7 9 6.2L21 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className={`field__input field__input--icon ${camposInvalidos.correo ? 'field__input--error' : ''}`}
                type="email"
                placeholder="nombre.apellido@uajs.edu.co"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  if (camposInvalidos.correo) setCamposInvalidos({ ...camposInvalidos, correo: false })
                }}
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label">Contraseña</label>
            <div className="field__input-wrap">
              <span className="field__input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="4.5"
                    y="10.5"
                    width="15"
                    height="9.5"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                className={`field__input field__input--icon ${camposInvalidos.password ? 'field__input--error' : ''}`}
                type={verPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (camposInvalidos.password) setCamposInvalidos({ ...camposInvalidos, password: false })
                }}
              />
              <button
                type="button"
                className="field__input-toggle"
                onClick={() => setVerPassword(!verPassword)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {verPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.5 5.4A10.4 10.4 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.3 3.5M6.2 6.6C4.2 8 2.9 9.9 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
            </div>
            <Link to="/forgot-password" className="login-card__forgot">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <LoadingButton
            type="submit"
            className="btn btn--primary login-card__submit"
            loading={enviando}
            loadingText="Ingresando..."
          >
            <span>Iniciar sesión</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </LoadingButton>
        </form>

        <p className="login-form-col__footnote">
          © {new Date().getFullYear()} Corporación Universitaria Antonio José de Sucre
        </p>
      </div>
    </div>
  )
}
