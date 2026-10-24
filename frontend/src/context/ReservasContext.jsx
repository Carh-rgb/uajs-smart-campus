import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { reservasService } from '../services/reservasService.js'
import { useAuth } from './AuthContext.jsx'
import { useNotifications } from './NotificationsContext.jsx'

const ReservasContext = createContext(null)

const CATALOGO_VACIO = { pabellones: [], salasEspeciales: [], salasBiblioteca: [], equipos: [] }

export function ReservasProvider({ children }) {
  const [reservas, setReservas] = useState([])
  const [catalogo, setCatalogo] = useState(CATALOGO_VACIO)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { agregarNotificacion } = useNotifications()

  const cargar = useCallback(async () => {
    if (!user) {
      setReservas([])
      setError(null)
      setCargando(false)
      return
    }
    setCargando(true)
    setError(null)
    try {
      setReservas(await reservasService.listar())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las reservas.')
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
    return reservasService
      .catalogo()
      .then(setCatalogo)
      .catch(() => setCatalogo(CATALOGO_VACIO))
  }, [user])

  useEffect(() => {
    cargarCatalogo()
  }, [cargarCatalogo])

  const reemplazar = (actualizada) =>
    setReservas((prev) => prev.map((r) => (r.id === actualizada.id ? actualizada : r)))

  const crearReserva = async ({ tipoEspacio, espacio, fecha, horaInicio, horaFin, motivo }) => {
    const nueva = await reservasService.crear({ tipoEspacio, espacio, fecha, horaInicio, horaFin, motivo })
    setReservas((prev) => [nueva, ...prev])
    agregarNotificacion('Reservas', `Se registró la reserva ${nueva.id} para ${espacio}.`, nueva.solicitanteId)
    return nueva
  }

  const actualizarEstado = async (id, nuevoEstado) => {
    const actualizada = await reservasService.cambiarEstado(id, nuevoEstado)
    reemplazar(actualizada)
    agregarNotificacion('Reservas', `Tu reserva ${id} cambió a estado ${nuevoEstado}.`, actualizada.solicitanteId)
    // Confirmar/descartar una reserva de equipo cambia su stock disponible.
    if (actualizada.tipoEspacio === 'equipo') cargarCatalogo()
    return actualizada
  }

  // El solicitante (o el personal) anula una reserva activa.
  const cancelarReserva = async (id) => {
    const actualizada = await reservasService.cancelar(id)
    reemplazar(actualizada)
    if (actualizada.tipoEspacio === 'equipo') cargarCatalogo()
    return actualizada
  }

  const obtenerHistorial = async (id) => reservasService.historial(id)

  // Franjas ya ocupadas de un espacio en una fecha (para evitar proponer
  // un horario que el backend va a rechazar por solapamiento).
  const obtenerDisponibilidad = useCallback((espacio, fecha) => reservasService.disponibilidad(espacio, fecha), [])

  const eliminarReserva = async (id) => {
    const reserva = reservas.find((r) => r.id === id)
    await reservasService.eliminar(id)
    setReservas((prev) => prev.filter((r) => r.id !== id))
    if (reserva?.tipoEspacio === 'equipo' && reserva.estado === 'Confirmada') cargarCatalogo()
  }

  return (
    <ReservasContext.Provider
      value={{
        reservas,
        catalogo,
        cargando,
        error,
        actualizarEstado,
        crearReserva,
        cancelarReserva,
        obtenerHistorial,
        obtenerDisponibilidad,
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
