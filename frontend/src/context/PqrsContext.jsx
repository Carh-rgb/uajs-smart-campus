import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const PqrsContext = createContext(null)

export function PqrsProvider({ children }) {
  const [pqrs, setPqrs] = useState([])
  const [cargando, setCargando] = useState(true)
  const { user } = useAuth()
  const { recargarNotificaciones } = useNotifications()
  // Las notificaciones las genera el backend (E2-32); aqui solo se refresca
  // la campana un momento despues para mostrar las del propio usuario.
  const refrescarAvisos = () => setTimeout(recargarNotificaciones, 800)

  const cargar = useCallback(async () => {
    if (!user) {
      setPqrs([])
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      const data = await api.get('/pqrs')
      setPqrs(data)
    } catch {
      setPqrs([])
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const radicar = async ({ tipo, dirigidoA, asunto, descripcion, adjunto }) => {
    const nueva = await api.post('/pqrs', { tipo, dirigidoA, asunto, descripcion, adjunto })
    setPqrs((prev) => [nueva, ...prev])
    refrescarAvisos()
    return nueva
  }

  const responder = async (id, { respuesta, adjunto, estado }) => {
    const actualizada = await api.patch(`/pqrs/${id}/responder`, { respuesta, adjunto, estado })
    setPqrs((prev) => prev.map((p) => (p.id === id ? actualizada : p)))
    return actualizada
  }

  const asignar = async (id, asignadoA) => {
    const actualizada = await api.patch(`/pqrs/${id}/asignar`, { asignadoA })
    setPqrs((prev) => prev.map((p) => (p.id === id ? actualizada : p)))
    return actualizada
  }

  const obtenerHistorial = async (id) => api.get(`/pqrs/${id}/historial`)

  return (
    <PqrsContext.Provider
      value={{ pqrs, cargando, radicar, responder, asignar, obtenerHistorial }}
    >
      {children}
    </PqrsContext.Provider>
  )
}

export function usePqrs() {
  const ctx = useContext(PqrsContext)
  if (!ctx) throw new Error('usePqrs debe usarse dentro de PqrsProvider')
  return ctx
}
