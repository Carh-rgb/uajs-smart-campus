import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

// Catalogo de modulos disponibles en el sidebar (excluye "Permisos",
// que siempre es exclusivo del Administrador del sistema).
export const MODULOS = [
  { id: 'inicio', label: 'Inicio / Dashboard' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'eventos', label: 'Eventos y actividades' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'pqrs', label: 'PQRS' },
  { id: 'reportes', label: 'Reportes' },
]

export const ROLES_GESTIONABLES = ['Estudiante', 'Docente', 'Administrativo']

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { user } = useAuth()
  const [permisos, setPermisos] = useState({})

  const cargar = useCallback(async () => {
    if (!user) {
      setPermisos({})
      return
    }
    try {
      const data = await api.get('/permisos')
      setPermisos(data)
    } catch {
      setPermisos({})
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  // El backend no guarda un registro de permisos para "Administrador del
  // sistema" (siempre tiene acceso total), asi que se sintetiza aqui.
  const modulosActivos = (rol) =>
    rol === 'Administrador del sistema' ? MODULOS.map((m) => m.id) : permisos[rol] || []

  const tieneModulo = (rol, moduloId) =>
    rol === 'Administrador del sistema' ? true : modulosActivos(rol).includes(moduloId)

  const toggleModulo = async (rol, moduloId) => {
    if (rol === 'Administrador del sistema') return // no editable
    const actualizado = await api.patch(`/permisos/${rol}`, { moduloId })
    setPermisos((prev) => ({ ...prev, [rol]: actualizado.modulosActivos }))
  }

  return (
    <PermissionsContext.Provider value={{ permisos, modulosActivos, tieneModulo, toggleModulo }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissions debe usarse dentro de PermissionsProvider')
  return ctx
}
