import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

const UsersContext = createContext(null)

export function UsersProvider({ children }) {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [responsables, setResponsables] = useState([])
  const [cargando, setCargando] = useState(true)

  // La lista completa solo la puede ver el Administrador del sistema
  // (el backend responde 403 para cualquier otro rol).
  const cargarUsuarios = useCallback(async () => {
    if (!user || user.rol !== 'Administrador del sistema') {
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      const data = await api.get('/usuarios')
      setUsuarios(data)
    } catch {
      setUsuarios([])
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  // Docentes/Administrativos activos: disponible para cualquier usuario
  // autenticado (lo usa, por ejemplo, el selector "Asignado a" de PQRS).
  useEffect(() => {
    if (!user) {
      setResponsables([])
      return
    }
    api
      .get('/usuarios/responsables')
      .then(setResponsables)
      .catch(() => setResponsables([]))
  }, [user])

  const crearUsuario = async ({ nombre, correo, rol, programa, password }) => {
    const { usuario } = await api.post('/auth/register', { nombre, correo, password, rol, programa })
    setUsuarios((prev) => [usuario, ...prev])
    return usuario
  }

  const toggleActivo = async (id) => {
    const actualizado = await api.patch(`/usuarios/${id}/estado`)
    setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)))
  }

  const actualizarRol = async (id, rol) => {
    const actualizado = await api.patch(`/usuarios/${id}/rol`, { rol })
    setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)))
  }

  return (
    <UsersContext.Provider
      value={{ usuarios, responsables, cargando, crearUsuario, toggleActivo, actualizarRol, cargarUsuarios }}
    >
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers debe usarse dentro de UsersProvider')
  return ctx
}
