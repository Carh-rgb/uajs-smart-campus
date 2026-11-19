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
  // `silencioso`: vuelve a pedir la lista sin mostrar el spinner (se usa
  // despues de crear, editar o eliminar para que la tabla quede igual a la
  // base de datos sin que el usuario tenga que recargar la pagina).
  const cargarUsuarios = useCallback(async ({ silencioso = false } = {}) => {
    if (!user || user.rol !== 'Administrador del sistema') {
      setCargando(false)
      return
    }
    if (!silencioso) setCargando(true)
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

  const crearUsuario = async (datos) => {
    const usuario = await api.post('/usuarios', datos)
    setUsuarios((prev) => [usuario, ...prev.filter((u) => u.id !== usuario.id)])
    cargarUsuarios({ silencioso: true })
    return usuario
  }

  const toggleActivo = async (id) => {
    const actualizado = await api.patch(`/usuarios/${id}/estado`)
    setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)))
    cargarUsuarios({ silencioso: true })
  }

  const actualizarRol = async (id, rol) => {
    const actualizado = await api.patch(`/usuarios/${id}/rol`, { rol })
    setUsuarios((prev) => prev.map((u) => (u.id === id ? actualizado : u)))
    cargarUsuarios({ silencioso: true })
  }

  const eliminarUsuario = async (id) => {
    await api.delete(`/usuarios/${id}`)
    setUsuarios((prev) => prev.filter((u) => u.id !== id))
    cargarUsuarios({ silencioso: true })
  }

  return (
    <UsersContext.Provider
      value={{
        usuarios,
        responsables,
        cargando,
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
