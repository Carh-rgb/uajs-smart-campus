import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { notificacionesService } from '../services/notificacionesService.js'
import { useAuth } from './AuthContext.jsx'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!user) {
      setNotificaciones([])
      setError(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setNotificaciones(await notificacionesService.listar())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las notificaciones.')
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
  // `entidad` y `entidadId` (opcionales) enlazan la notificacion con el
  // registro que la origino, ej. ('solicitud', 'SOL-0231').
  const agregarNotificacion = async (categoria, mensaje, usuarioId, entidad, entidadId) => {
    try {
      const nueva = await notificacionesService.crear({ categoria, mensaje, usuarioId, entidad, entidadId })
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
      await notificacionesService.marcarLeida(id)
    } catch {
      cargar()
    }
  }

  const marcarTodasLeidas = async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    try {
      await notificacionesService.marcarTodasLeidas()
    } catch {
      cargar()
    }
  }

  const eliminarNotificacion = async (id) => {
    const previas = notificaciones
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
    try {
      await notificacionesService.eliminar(id)
    } catch {
      setNotificaciones(previas)
    }
  }

  const noLeidasCount = notificaciones.filter((n) => !n.leida).length

  return (
    <NotificationsContext.Provider
      value={{
        notificaciones,
        cargando,
        error,
        recargar: cargar,
        agregarNotificacion,
        marcarLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
        noLeidasCount,
      }}
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
