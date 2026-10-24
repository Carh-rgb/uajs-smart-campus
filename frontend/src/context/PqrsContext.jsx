import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { pqrsService } from '../services/pqrsService.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const PqrsContext = createContext(null)

export function PqrsProvider({ children }) {
  const [pqrs, setPqrs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { agregarNotificacion } = useNotifications()

  const cargar = useCallback(async () => {
    if (!user) {
      setPqrs([])
      setError(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setPqrs(await pqrsService.listar())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las PQRS.')
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const radicar = async ({ tipo, dirigidoA, asunto, descripcion, adjunto }) => {
    const nueva = await pqrsService.crear({ tipo, dirigidoA, asunto, descripcion, adjunto })
    setPqrs((prev) => [nueva, ...prev])
    agregarNotificacion('PQRS', `Se radicó ${nueva.id}: ${asunto}.`, nueva.solicitanteId)
    return nueva
  }

  const responder = async (id, { respuesta, adjunto, estado }) => {
    const actualizada = await pqrsService.responder(id, { respuesta, adjunto, estado })
    setPqrs((prev) => prev.map((p) => (p.id === id ? actualizada : p)))
    agregarNotificacion(
      'PQRS',
      `Tu PQRS ${id} fue marcada como ${actualizada.estado.toLowerCase()}.`,
      actualizada.solicitanteId,
    )
    return actualizada
  }

  const asignar = async (id, asignadoA) => {
    const actualizada = await pqrsService.asignar(id, asignadoA)
    setPqrs((prev) => prev.map((p) => (p.id === id ? actualizada : p)))
    return actualizada
  }

  const obtenerHistorial = async (id) => pqrsService.historial(id)

  return (
    <PqrsContext.Provider value={{ pqrs, cargando, error, recargar: cargar, radicar, responder, asignar, obtenerHistorial }}>
      {children}
    </PqrsContext.Provider>
  )
}

export function usePqrs() {
  const ctx = useContext(PqrsContext)
  if (!ctx) throw new Error('usePqrs debe usarse dentro de PqrsProvider')
  return ctx
}
