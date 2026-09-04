import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { esCorreoInstitucional } from '../utils/validation.js'
import LoadingButton from '../components/LoadingButton.jsx'

export default function ForgotPassword() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!esCorreoInstitucional(correo)) {
      setError('El correo debe pertenecer al dominio @uajs.edu.co')
      return
    }

    setError('')
    setEnviando(true)
    try {
      await api.post('/auth/forgot-password', { correo })
      setEnviado(true)
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-side">
        <div className="login-side__text">
          <img src="/logo-blanco.png" alt="UAJS" className="login-side__logo" />
          <h2 className="login-side__title">¿Olvidaste tu contraseña?</h2>
          <p className="login-side__text-body">
            Escribe tu correo institucional de acceso. Si tienes un correo de
            recuperación configurado en tu perfil, ahí te enviaremos el enlace.
          </p>
        </div>
      </div>

      <div className="login-form-col">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__eyebrow">Acceso institucional</div>
          <h1 className="login-card__title">Recuperar contraseña</h1>
          <p className="login-card__subtitle">
            Ingresa tu correo institucional para continuar.
          </p>

          {error && <div className="login-card__error">{error}</div>}

          {enviado ? (
            <>
              <p style={{ fontSize: 13.5, color: 'var(--color-success)', marginBottom: 20 }}>
                Si el correo está registrado, recibirás un enlace para restablecer tu
                contraseña en los próximos minutos. Revisa también la carpeta de spam.
              </p>
              <Link to="/login" className="btn btn--primary" style={{ display: 'block', textAlign: 'center' }}>
                Volver a iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <div className="field">
                <label className="field__label">Correo institucional</label>
                <input
                  className="field__input"
                  type="email"
                  placeholder="nombre.apellido@uajs.edu.co"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>

              <LoadingButton
                type="submit"
                className="btn btn--primary"
                loading={enviando}
                loadingText="Enviando..."
              >
                Enviar enlace de recuperación
              </LoadingButton>

              <Link
                to="/login"
                style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}
              >
                Volver a iniciar sesión
              </Link>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
