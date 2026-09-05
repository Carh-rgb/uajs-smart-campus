import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { esCorreoInstitucional } from '../utils/validation.js'
import LoadingButton from '../components/LoadingButton.jsx'

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

  return (
    <div className="login-wrap">
      <div className="login-side">
        <div className="login-side__main">
          <div className="login-side__brand">
            <img src="/logo-blanco.png" alt="UAJS" className="login-side__logo" />
            <p className="login-side__brand-tagline">
              Corporación Universitaria Antonio José de Sucre
            </p>
          </div>

          <div className="login-side__text">
            <h2 className="login-side__title">
              Bienvenido de vuelta a tu
              <br />
              Campus UAJS
            </h2>
            <p className="login-side__text-body">
              Accede con tu correo institucional para unirte a tus clases,
              gestionar solicitudes y conectar con tu comunidad.
            </p>
          </div>
        </div>

        <div className="login-side__footer">
          <span className="login-side__footer-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 3 2 8l10 5 8-4.36V15h1.5V8L12 3Z"
                fill="currentColor"
              />
              <path
                d="M6 11.18V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-3.82l-6 3-6-3Z"
                fill="currentColor"
                opacity="0.75"
              />
            </svg>
          </span>
          <span>Comprometidos con tu futuro.</span>
        </div>
      </div>

      <div className="login-form-col">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__eyebrow">Acceso institucional</div>
          <h1 className="login-card__title">Iniciar sesión</h1>
          <p className="login-card__subtitle">
            Ingresa tus credenciales de UAJS Smart Campus.
          </p>

          {error && <div className="login-card__error">{error}</div>}

          <div className="field">
            <label className="field__label">Correo institucional</label>
            <input
              className={`field__input ${camposInvalidos.correo ? 'field__input--error' : ''}`}
              type="email"
              placeholder="nombre.apellido@uajs.edu.co"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value)
                if (camposInvalidos.correo) setCamposInvalidos({ ...camposInvalidos, correo: false })
              }}
            />
          </div>

          <div className="field">
            <label className="field__label">Contraseña</label>
            <div className="field__input-wrap">
              <input
                className={`field__input ${camposInvalidos.password ? 'field__input--error' : ''}`}
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
            <Link
              to="/forgot-password"
              style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, color: 'var(--color-navy)' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <LoadingButton
            type="submit"
            className="btn btn--primary"
            loading={enviando}
            loadingText="Ingresando..."
          >
            Iniciar sesión
          </LoadingButton>
        </form>
      </div>
    </div>
  )
}
