import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BrandSpinner } from './BrandSpinner.jsx'

export default function RouteLoader() {
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const esPrimerRender = useRef(true)

  useEffect(() => {
    if (esPrimerRender.current) {
      esPrimerRender.current = false
      return
    }
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(t)
  }, [location.pathname])

  if (!loading) return null

  return (
    <div className="route-loader-overlay">
      <BrandSpinner label="Cargando..." />
    </div>
  )
}
