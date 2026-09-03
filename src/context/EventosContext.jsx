import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const EventosContext = createContext(null)

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const { user } = useAuth()
  const { agregarNotificacion } = useNotifications()

  const cargar = useCallback(async () => {
    if (!user) {
      setEventos([])
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      const data = await api.get('/eventos')
      setEventos(data)
    } catch {
      setEventos([])
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const agregarEvento = async ({ titulo, fecha, hora, lugar, ponente, descripcion }) => {
    const nuevo = await api.post('/eventos', { titulo, fecha, hora, lugar, ponente, descripcion })
    setEventos((prev) => [{ ...nuevo, inscrito: false }, ...prev])
    return nuevo
  }

  const inscribir = async (eventoId, tituloEvento) => {
    await api.post(`/eventos/${eventoId}/inscribir`)
    setEventos((prev) => prev.map((e) => (e.id === eventoId ? { ...e, inscrito: true } : e)))
    if (tituloEvento) {
      agregarNotificacion('Eventos', `Quedaste inscrito en "${tituloEvento}".`)
    }
  }

  const estaInscrito = (eventoId) => eventos.find((e) => e.id === eventoId)?.inscrito || false

  const inscritosDe = async (eventoId) => api.get(`/eventos/${eventoId}/inscritos`)

  return (
    <EventosContext.Provider value={{ eventos, cargando, agregarEvento, inscribir, estaInscrito, inscritosDe }}>
      {children}
    </EventosContext.Provider>
  )
}

export function useEventos() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventos debe usarse dentro de EventosProvider')
  return ctx
}
