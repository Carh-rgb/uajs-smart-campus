import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    if (!user) {
      setNotificaciones([])
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      const data = await api.get('/notificaciones')
      setNotificaciones(data)
    } catch {
      setNotificaciones([])
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  // usuarioId es opcional: si se omite, la notificacion es para el usuario
  // autenticado; el personal (Administrativo/Docente/Admin) puede indicar
  // el id de otro usuario (p. ej. avisarle al dueno de una solicitud).
  const agregarNotificacion = async (categoria, mensaje, usuarioId) => {
    try {
      const nueva = await api.post('/notificaciones', { categoria, mensaje, usuarioId })
      if (!usuarioId || usuarioId === user?.id) {
        setNotificaciones((prev) => [nueva, ...prev])
      }
      return nueva
    } catch {
      // No bloquea la accion principal si la notificacion falla.
      return null
    }
  }

  const marcarLeida = async (id) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
    try {
      await api.patch(`/notificaciones/${id}/leida`)
    } catch {
      cargar()
    }
  }

  const marcarTodasLeidas = async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    try {
      await api.patch('/notificaciones/marcar-todas')
    } catch {
      cargar()
    }
  }

  const noLeidasCount = notificaciones.filter((n) => !n.leida).length

  return (
    <NotificationsContext.Provider
      value={{ notificaciones, cargando, agregarNotificacion, marcarLeida, marcarTodasLeidas, noLeidasCount }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider')
  return ctx
}
