import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usuariosService } from '../services/usuariosService.js'
import { useAuth } from './AuthContext.jsx'

const UsersContext = createContext(null)

export function UsersProvider({ children }) {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [responsables, setResponsables] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // La lista completa solo la puede ver el Administrador del sistema
  // (el backend responde 403 para cualquier otro rol).
  const cargarUsuarios = useCallback(async () => {
    if (!user || user.rol !== 'Administrador del sistema') {
      setError(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setUsuarios(await usuariosService.listar())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.')
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
    usuariosService
      .responsables()
      .then(setResponsables)
      .catch(() => setResponsables([]))
  }, [user])

  const crearUsuario = async (datos) => {
    const { usuario } = await usuariosService.crear(datos)
    setUsuarios((prev) => [usuario, ...prev])
    return usuario
  }

  const toggleActivo = async (id) => {
    const actualizado = await usuariosService.alternarActivo(id)
    setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)))
  }

  const actualizarRol = async (id, rol) => {
    const actualizado = await usuariosService.cambiarRol(id, rol)
    setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)))
  }

  const eliminarUsuario = async (id) => {
    await usuariosService.eliminar(id)
    setUsuarios((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <UsersContext.Provider
      value={{
        usuarios,
        responsables,
        cargando,
        error,
        crearUsuario,
        toggleActivo,
        actualizarRol,
        eliminarUsuario,
        cargarUsuarios,
      }}
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
