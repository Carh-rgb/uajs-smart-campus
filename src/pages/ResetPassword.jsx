import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import LoadingButton from '../components/LoadingButton.jsx'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError('El enlace no es válido. Solicita uno nuevo.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setError('')
    setEnviando(true)
    try {
      await api.post('/auth/reset-password', { token, nuevaPassword: password })
      setExito(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-side">
        <div className="login-side__text">
          <img src="/logo-blanco.png" alt="UAJS" className="login-side__logo" />
          <h2 className="login-side__title">Define tu nueva contraseña</h2>
          <p className="login-side__text-body">
            Elige una contraseña segura para volver a acceder a UAJS Smart Campus.
          </p>
        </div>
      </div>

      <div className="login-form-col">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__eyebrow">Acceso institucional</div>
          <h1 className="login-card__title">Restablecer contraseña</h1>
          <p className="login-card__subtitle">
            Ingresa y confirma tu nueva contraseña.
          </p>

          {error && <div className="login-card__error">{error}</div>}

          {exito ? (
            <p style={{ fontSize: 13.5, color: 'var(--color-success)' }}>
              Tu contraseña fue actualizada. Te llevaremos al inicio de sesión...
            </p>
          ) : (
            <>
              <div className="field">
                <label className="field__label">Nueva contraseña</label>
                <input
                  className="field__input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field__label">Confirmar contraseña</label>
                <input
                  className="field__input"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />
              </div>

              <LoadingButton
                type="submit"
                className="btn btn--primary"
                loading={enviando}
                loadingText="Guardando..."
              >
                Restablecer contraseña
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
