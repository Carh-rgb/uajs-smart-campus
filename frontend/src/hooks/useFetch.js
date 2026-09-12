import { useEffect, useState, useCallback } from 'react'

/**
 * useFetch
 * Custom hook que abstrae la logica de consulta y filtrado de datos.
 * Simula una llamada asincrona a una API (con un pequeno delay) sobre
 * un dataset local, y permite aplicar un filtro opcional sobre el
 * resultado cada vez que cambian las dependencias indicadas.
 *
 * @param {Function} fetcher - funcion que retorna el arreglo de datos (sync)
 * @param {Function} [filterFn] - funcion (item) => boolean para filtrar
 * @param {Array} deps - dependencias que disparan una nueva "consulta"
 */
export function useFetch(fetcher, filterFn, deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const timeout = setTimeout(() => {
      try {
        const raw = fetcher()
        const result = filterFn ? raw.filter(filterFn) : raw
        setData(result)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const cancel = load()
    return cancel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  return { data, loading, error, refetch: load }
}
