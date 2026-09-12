import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const ReservasContext = createContext(null)

const CATALOGO_VACIO = { pabellones: [], salasEspeciales: [], salasBiblioteca: [], equipos: [] }

export function ReservasProvider({ children }) {
  const [reservas, setReservas] = useState([])
  const [catalogo, setCatalogo] = useState(CATALOGO_VACIO)
  const [cargando, setCargando] = useState(true)
  const { user } = useAuth()
  const { agregarNotificacion } = useNotifications()

  const cargar = useCallback(async () => {
    if (!user) {
      setReservas([])
      setCargando(false)
      return
    }
    setCargando(true)
    try {
      const data = await api.get('/reservas')
      setReservas(data)
    } catch {
      setReservas([])
    } finally {
      setCargando(false)
    }
  }, [user])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cargarCatalogo = useCallback(() => {
    if (!user) {
      setCatalogo(CATALOGO_VACIO)
      return
    }
    return api
      .get('/reservas/catalogo')
      .then(setCatalogo)
      .catch(() => setCatalogo(CATALOGO_VACIO))
  }, [user])

  useEffect(() => {
    cargarCatalogo()
  }, [cargarCatalogo])

  const crearReserva = async ({ tipoEspacio, espacio, fecha, horaInicio, horaFin, motivo }) => {
    const nueva = await api.post('/reservas', { tipoEspacio, espacio, fecha, horaInicio, horaFin, motivo })
    setReservas((prev) => [nueva, ...prev])
    agregarNotificacion('Reservas', `Se registró la reserva ${nueva.id} para ${espacio}.`, nueva.solicitanteId)
    return nueva
  }

  const actualizarEstado = async (id, nuevoEstado) => {
    const actualizada = await api.patch(`/reservas/${id}/estado`, { estado: nuevoEstado })
    setReservas((prev) => prev.map((r) => (r.id === id ? actualizada : r)))
    agregarNotificacion('Reservas', `Tu reserva ${id} cambió a estado ${nuevoEstado}.`, actualizada.solicitanteId)
    // Confirmar/descartar una reserva de equipo cambia su stock disponible.
    if (actualizada.tipoEspacio === 'equipo') cargarCatalogo()
    return actualizada
  }

  const obtenerHistorial = async (id) => api.get(`/reservas/${id}/historial`)

  const eliminarReserva = async (id) => {
    const reserva = reservas.find((r) => r.id === id)
    await api.delete(`/reservas/${id}`)
    setReservas((prev) => prev.filter((r) => r.id !== id))
    if (reserva?.tipoEspacio === 'equipo' && reserva.estado === 'Confirmada') cargarCatalogo()
  }

  return (
    <ReservasContext.Provider
      value={{
        reservas,
        catalogo,
        cargando,
        actualizarEstado,
        crearReserva,
        obtenerHistorial,
        eliminarReserva,
        recargar: cargar,
        recargarCatalogo: cargarCatalogo,
      }}
    >
      {children}
    </ReservasContext.Provider>
  )
}

export function useReservas() {
  const ctx = useContext(ReservasContext)
  if (!ctx) throw new Error('useReservas debe usarse dentro de ReservasProvider')
  return ctx
}
