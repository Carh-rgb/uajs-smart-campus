import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { esCorreoInstitucional } from '../utils/validation.js'
import LoadingButton from '../components/LoadingButton.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
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
        <div className="login-side__text">
          <img src="/logo-blanco.png" alt="UAJS" className="login-side__logo" />
          <h2 className="login-side__title">
            Bienvenido de vuelta a tu campus
          </h2>
          <p className="login-side__text-body">
            Accede con tu correo institucional para continuar con tus
            solicitudes, reservas y actividades.
          </p>
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
            <input
              className={`field__input ${camposInvalidos.password ? 'field__input--error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (camposInvalidos.password) setCamposInvalidos({ ...camposInvalidos, password: false })
              }}
            />
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
