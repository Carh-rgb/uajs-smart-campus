import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { eventosService } from '../services/eventosService.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const EventosContext = createContext(null)

export function EventosProvider({ children }) {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { agregarNotificacion } = useNotifications()

  const cargar = useCallback(async () => {
    if (!user) {
      setEventos([])
      setError(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setEventos(await eventosService.listar())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los eventos.')
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const agregarEvento = async ({ titulo, fecha, hora, horaFin, lugar, ponente, descripcion, facultad, cupoMaximo }) => {
    const nuevo = await eventosService.crear({ titulo, fecha, hora, horaFin, lugar, ponente, descripcion, facultad, cupoMaximo })
    setEventos((prev) => [{ ...nuevo, inscrito: false, inscritosCount: 0 }, ...prev])
    return nuevo
  }

  const actualizarEnLista = (actualizado) => {
    setEventos((prev) => prev.map((e) => (e.id === actualizado.id ? { ...e, ...actualizado } : e)))
  }

  const actualizarEvento = async (id, datos) => {
    actualizarEnLista(await eventosService.actualizar(id, datos))
  }

  const actualizarEstadoEvento = async (id, estado) => {
    actualizarEnLista(await eventosService.cambiarEstado(id, estado))
  }

  const inscribir = async (eventoId, tituloEvento) => {
    await eventosService.inscribir(eventoId)
    setEventos((prev) =>
      prev.map((e) => (e.id === eventoId ? { ...e, inscrito: true, inscritosCount: (e.inscritosCount || 0) + 1 } : e)),
    )
    if (tituloEvento) {
      agregarNotificacion('Eventos', `Quedaste inscrito en "${tituloEvento}".`)
    }
  }

  const cancelarInscripcion = async (eventoId) => {
    await eventosService.cancelarInscripcion(eventoId)
    setEventos((prev) =>
      prev.map((e) =>
        e.id === eventoId ? { ...e, inscrito: false, inscritosCount: Math.max(0, (e.inscritosCount || 1) - 1) } : e,
      ),
    )
  }

  const estaInscrito = (eventoId) => eventos.find((e) => e.id === eventoId)?.inscrito || false

  const inscritosDe = async (eventoId) => eventosService.inscritos(eventoId)

  const eliminarEvento = async (id) => {
    await eventosService.eliminar(id)
    setEventos((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <EventosContext.Provider
      value={{
        eventos,
        cargando,
        error,
        recargar: cargar,
        agregarEvento,
        actualizarEvento,
        actualizarEstadoEvento,
        inscribir,
        cancelarInscripcion,
        estaInscrito,
        inscritosDe,
        eliminarEvento,
      }}
    >
      {children}
    </EventosContext.Provider>
  )
}

export function useEventos() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventos debe usarse dentro de EventosProvider')
  return ctx
}
