import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { usePermissions } from '../context/PermissionsContext.jsx'

export default function ModuleRoute({ moduleId, children }) {
  const { user } = useAuth()
  const { tieneModulo } = usePermissions()

  if (!tieneModulo(user?.rol, moduleId)) {
    return (
      <div>
        <div className="view-header">
          <h1 className="view-header__title">Acceso no disponible</h1>
          <p className="view-header__subtitle">
            Tu perfil actual no tiene habilitado este módulo.
          </p>
        </div>
      </div>
    )
  }

  return children
}
