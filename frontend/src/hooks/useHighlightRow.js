import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Cuando la busqueda del topbar navega a un modulo con un resultado
// especifico (una PQRS, una reserva, un usuario...), este hook resalta
// y hace scroll hasta la fila/tarjeta correspondiente (marcada con
// data-row-id). El id llega vía location.state para no ensuciar la URL.
export function useHighlightRow() {
  const location = useLocation()
  const navigate = useNavigate()
  const [highlightId, setHighlightId] = useState(location.state?.highlightId || null)
  const procesado = useRef(false)

  useEffect(() => {
    const id = location.state?.highlightId
    if (!id || procesado.current) return
    procesado.current = true
    setHighlightId(id)

    let intentos = 0
    const intervalo = setInterval(() => {
      const el = document.querySelector(`[data-row-id="${CSS.escape(String(id))}"]`)
      intentos += 1
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        clearInterval(intervalo)
      } else if (intentos >= 20) {
        clearInterval(intervalo)
      }
    }, 100)

    navigate(location.pathname, { replace: true, state: {} })
    const apagar = setTimeout(() => setHighlightId(null), 2500)

    return () => {
      clearInterval(intervalo)
      clearTimeout(apagar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  return highlightId
}
