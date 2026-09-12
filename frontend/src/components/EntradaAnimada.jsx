import React, { useEffect, useState } from 'react'

/**
 * Secuencia de entrada al sistema tras un login exitoso: la insignia de
 * la universidad aparece en el centro con un anillo de progreso que se
 * llena (en vez de un spinner indefinido, para transmitir "esto ya casi
 * termina") y un pulso de luz alrededor. Dura 3s en total y luego
 * dispara onFinish para navegar al dashboard.
 */
export default function EntradaAnimada({ nombre, onFinish }) {
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    const salir = setTimeout(() => setSaliendo(true), 2750)
    const terminar = setTimeout(onFinish, 3000)
    return () => {
      clearTimeout(salir)
      clearTimeout(terminar)
    }
  }, [onFinish])

  return (
    <div className={`entrada-animada ${saliendo ? 'entrada-animada--saliendo' : ''}`} role="status" aria-live="polite">
      <div className="entrada-animada__orb entrada-animada__orb--a" aria-hidden="true" />
      <div className="entrada-animada__orb entrada-animada__orb--b" aria-hidden="true" />

      <div className="entrada-animada__content">
        <div className="entrada-animada__ring">
          <svg viewBox="0 0 120 120" className="entrada-animada__progress" aria-hidden="true">
            <circle className="entrada-animada__track" cx="60" cy="60" r="54" />
            <circle className="entrada-animada__fill" cx="60" cy="60" r="54" />
          </svg>
          <div className="entrada-animada__badge">
            <img src="/logo-blanco.png" alt="" />
          </div>
        </div>
        <p className="entrada-animada__title">Bienvenido{nombre ? `, ${nombre.split(' ')[0]}` : ''}</p>
        <p className="entrada-animada__subtitle">Ingresando a tu Smart Campus...</p>
      </div>
    </div>
  )
}
