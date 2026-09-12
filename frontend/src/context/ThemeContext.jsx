import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'uajs_smart_campus_theme'

function leerTemaGuardado() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(leerTemaGuardado)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    try {
      localStorage.setItem(STORAGE_KEY, tema)
    } catch {
      // almacenamiento no disponible; el tema sigue funcionando en memoria
    }
  }, [tema])

  const toggleTema = () => setTema((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ tema, toggleTema }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
