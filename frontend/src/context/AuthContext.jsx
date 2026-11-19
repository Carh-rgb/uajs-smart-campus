import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, getToken, setToken, onSesionCerrada } from '../api/client.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'uajs_smart_campus_user'

// --- Sesion unica e inactividad (Entregable 3) ---------------------------
// El backend es quien manda: cierra la sesion si la cuenta entra desde otro
// dispositivo o si pasan 30 minutos sin actividad. Aqui el frontend:
//  - registra la actividad del usuario (mouse, teclado, toques, scroll),
//    compartida entre pestañas mediante localStorage;
//  - cada minuto consulta /auth/sesion: si hubo actividad cuenta como tal,
//    si no, solo revisa (asi el servidor no expira a quien esta leyendo);
//  - cierra la sesion por su cuenta al cumplirse 30 minutos sin actividad,
//    aunque el servidor no responda;
//  - deja en sessionStorage el motivo para mostrarlo en la pantalla de login.
const INACTIVIDAD_MS = 30 * 60 * 1000
const ACTIVIDAD_KEY = 'uajs_smart_campus_ultima_actividad'
export const AVISO_SESION_KEY = 'uajs_smart_campus_aviso_sesion'
const REVISION_MS = 60 * 1000
const EVENTOS_DE_ACTIVIDAD = ['pointerdown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel']

const MENSAJE_INACTIVIDAD = 'Tu sesión se cerró por inactividad (más de 30 minutos). Inicia sesión de nuevo.'

function leerUltimaActividad() {
  const valor = Number(localStorage.getItem(ACTIVIDAD_KEY))
  return Number.isFinite(valor) && valor > 0 ? valor : null
}

function marcarActividad() {
  try {
    localStorage.setItem(ACTIVIDAD_KEY, String(Date.now()))
  } catch {
    // almacenamiento no disponible
  }
}

function guardarAviso(mensaje) {
  try {
    sessionStorage.setItem(AVISO_SESION_KEY, mensaje)
  } catch {
    // ignorar
  }
}

function leerUsuarioGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerUsuarioGuardado)
  const [cargando, setCargando] = useState(true)

  const guardarSesion = (token, usuario) => {
    marcarActividad()
    setToken(token)
    setUser(usuario)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
    } catch {
      // almacenamiento no disponible; la sesion sigue funcionando en memoria
    }
  }

  const login = async ({ correo, password }) => {
    const { token, usuario } = await api.post('/auth/login', { correo, password })
    guardarSesion(token, usuario)
    return usuario
  }

  const actualizarUsuarioLocal = (usuario) => {
    setUser(usuario)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
    } catch {
      // almacenamiento no disponible; la sesion sigue funcionando en memoria
    }
  }

  const actualizarCorreoRecuperacion = async (correoRecuperacion) => {
    const usuario = await api.patch('/auth/correo-recuperacion', { correoRecuperacion })
    actualizarUsuarioLocal(usuario)
    return usuario
  }

  const actualizarPerfil = async (datos) => {
    const usuario = await api.patch('/auth/perfil', datos)
    actualizarUsuarioLocal(usuario)
    return usuario
  }

  // Limpia la sesion en este navegador (sin llamar al backend).
  const limpiarSesionLocal = useCallback(() => {
    setToken(null)
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ACTIVIDAD_KEY)
    } catch {
      // ignorar
    }
  }, [])

  // Cierre de sesion del usuario: tambien la cierra en el servidor, para que
  // el token no pueda reutilizarse. La peticion sale con el token actual
  // antes de borrarlo y no se espera su respuesta.
  const logout = useCallback(() => {
    if (getToken()) api.post('/auth/logout').catch(() => {})
    limpiarSesionLocal()
  }, [limpiarSesionLocal])

  // Cierre por motivo de seguridad (otro dispositivo o inactividad).
  const cerrarPorSeguridad = useCallback(
    (mensaje) => {
      guardarAviso(mensaje)
      limpiarSesionLocal()
    },
    [limpiarSesionLocal],
  )

  useEffect(() => {
    onSesionCerrada((code, mensaje) => cerrarPorSeguridad(mensaje))
    return () => onSesionCerrada(null)
  }, [cerrarPorSeguridad])

  // Si en otra pestaña se cerro la sesion, esta tambien se cierra.
  useEffect(() => {
    const alCambiarStorage = (e) => {
      if (e.key === 'uajs_smart_campus_token' && !e.newValue) setUser(null)
    }
    window.addEventListener('storage', alCambiarStorage)
    return () => window.removeEventListener('storage', alCambiarStorage)
  }, [])

  // Seguimiento de actividad e inactividad mientras haya sesion abierta.
  const huboActividad = useRef(false)
  useEffect(() => {
    if (!user) return undefined

    let ultimaMarca = 0
    const alActuar = () => {
      huboActividad.current = true
      const ahora = Date.now()
      // Se guarda como maximo cada 5 s para no escribir en cada mousemove.
      if (ahora - ultimaMarca > 5000) {
        ultimaMarca = ahora
        marcarActividad()
      }
    }

    const revisar = () => {
      const ultima = leerUltimaActividad()
      if (ultima && Date.now() - ultima > INACTIVIDAD_MS) {
        if (getToken()) api.post('/auth/logout').catch(() => {})
        cerrarPorSeguridad(MENSAJE_INACTIVIDAD)
        return
      }
      const activo = huboActividad.current
      huboActividad.current = false
      // Si la sesion se cerro en el servidor, client.js avisa y se cierra aqui.
      api.sesion(activo).catch(() => {})
    }

    // Al volver a la pestaña (o despertar el equipo) se revisa enseguida.
    const alVolver = () => {
      if (document.visibilityState === 'visible') revisar()
    }

    EVENTOS_DE_ACTIVIDAD.forEach((ev) => window.addEventListener(ev, alActuar, { passive: true }))
    document.addEventListener('visibilitychange', alVolver)
    const intervalo = setInterval(revisar, REVISION_MS)
    return () => {
      EVENTOS_DE_ACTIVIDAD.forEach((ev) => window.removeEventListener(ev, alActuar))
      document.removeEventListener('visibilitychange', alVolver)
      clearInterval(intervalo)
    }
  }, [user, cerrarPorSeguridad])

  // Al cargar la app con un token guardado, se refresca el perfil contra el
  // backend (por si el rol o el estado activo cambiaron desde otra sesion).
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setCargando(false)
      return
    }
    // Si el navegador estuvo cerrado mas de 30 minutos, la sesion ya vencio.
    const ultima = leerUltimaActividad()
    if (ultima && Date.now() - ultima > INACTIVIDAD_MS) {
      api.post('/auth/logout').catch(() => {})
      cerrarPorSeguridad(MENSAJE_INACTIVIDAD)
      setCargando(false)
      return
    }
    marcarActividad()
    api
      .get('/auth/me')
      .then((usuario) => {
        setUser(usuario)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
      })
      .catch(() => {
        limpiarSesionLocal()
      })
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, cargando, actualizarPerfil, actualizarCorreoRecuperacion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
