import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { solicitudesService } from '../services/solicitudesService.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const SolicitudesContext = createContext(null)

export function SolicitudesProvider({ children }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { agregarNotificacion } = useNotifications()

  const cargar = useCallback(async () => {
    if (!user) {
      setSolicitudes([])
      setError(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setSolicitudes(await solicitudesService.listar())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crearSolicitud = async ({ tipo, dependencia, prioridad, descripcion }) => {
    const nueva = await solicitudesService.crear({ tipo, dependencia, prioridad, descripcion })
    setSolicitudes((prev) => [nueva, ...prev])
    agregarNotificacion('Solicitudes', `Se registró la solicitud ${nueva.id} (${tipo}).`, nueva.solicitanteId)
    return nueva
  }

  const responderSolicitud = async (id, { respuesta, adjunto, nuevoEstado }) => {
    const actualizada = await solicitudesService.responder(id, { respuesta, adjunto, nuevoEstado })
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)))
    agregarNotificacion(
      'Solicitudes',
      `Tu solicitud ${id} está en estado ${actualizada.estado}.`,
      actualizada.solicitanteId,
    )
    return actualizada
  }

  const obtenerSolicitud = async (id) => solicitudesService.obtener(id)

  const eliminarSolicitud = async (id) => {
    await solicitudesService.eliminar(id)
    setSolicitudes((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <SolicitudesContext.Provider
      value={{
        solicitudes,
        cargando,
        error,
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
