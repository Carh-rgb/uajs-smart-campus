import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const SolicitudesContext = createContext(null)

export function SolicitudesProvider({ children }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const { user } = useAuth()
  const { recargarNotificaciones } = useNotifications()
  // Las notificaciones las genera el backend (E2-32); aqui solo se refresca
  // la campana un momento despues para mostrar las del propio usuario.
  const refrescarAvisos = () => setTimeout(recargarNotificaciones, 800)

  const cargar = useCallback(async () => {
    if (!user) {
      setSolicitudes([])
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      const data = await api.get('/solicitudes')
      setSolicitudes(data)
    } catch {
      setSolicitudes([])
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crearSolicitud = async ({ tipo, dependencia, prioridad, descripcion }) => {
    const nueva = await api.post('/solicitudes', { tipo, dependencia, prioridad, descripcion })
    setSolicitudes((prev) => [nueva, ...prev])
    refrescarAvisos()
    return nueva
  }

  const responderSolicitud = async (id, { respuesta, adjunto, nuevoEstado, asignadoA }) => {
    const actualizada = await api.patch(`/solicitudes/${id}/responder`, { respuesta, adjunto, nuevoEstado, asignadoA })
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)))
    return actualizada
  }

  const obtenerSolicitud = async (id) => api.get(`/solicitudes/${id}`)

  const eliminarSolicitud = async (id) => {
    await api.delete(`/solicitudes/${id}`)
    setSolicitudes((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <SolicitudesContext.Provider
      value={{
        solicitudes,
        cargando,
        crearSolicitud,
        responderSolicitud,
        obtenerSolicitud,
        eliminarSolicitud,
        recargar: cargar,
      }}
    >
      {children}
    </SolicitudesContext.Provider>
  )
}

export function useSolicitudes() {
  const ctx = useContext(SolicitudesContext)
  if (!ctx) throw new Error('useSolicitudes debe usarse dentro de SolicitudesProvider')
  return ctx
}
