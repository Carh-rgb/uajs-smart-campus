import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'uajs_smart_campus_user'

function leerUsuarioGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerUsuarioGuardado)
  const [cargando, setCargando] = useState(true)

  const guardarSesion = (token, usuario) => {
    setToken(token)
    setUser(usuario)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
    } catch {
      // almacenamiento no disponible; la sesion sigue funcionando en memoria
    }
  }

  const login = async ({ correo, password }) => {
    const { token, usuario } = await api.post('/auth/login', { correo, password })
    guardarSesion(token, usuario)
    return usuario
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignorar
    }
  }

  // Al cargar la app con un token guardado, se refresca el perfil contra el
  // backend (por si el rol o el estado activo cambiaron desde otra sesion).
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setCargando(false)
      return
    }
    api
      .get('/auth/me')
      .then((usuario) => {
        setUser(usuario)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
      })
      .catch(() => {
        logout()
      })
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
