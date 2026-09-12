import React from 'react'

/**
 * Loader de marca: una insignia UNIAJS estática en el centro con puntos
 * "orbitando" alrededor (alude a una red de servicios conectados a un
 * campus central) y un pulso de luz detrás. Para overlays de página o
 * paneles completos.
 */
export function BrandSpinner({ label = 'Cargando...', size = 'lg' }) {
  return (
    <div className={`brand-orbit brand-orbit--${size}`} role="status" aria-live="polite">
      <div className="brand-orbit__ring">
        <span className="brand-orbit__dot brand-orbit__dot--1" />
        <span className="brand-orbit__dot brand-orbit__dot--2" />
        <span className="brand-orbit__dot brand-orbit__dot--3" />
      </div>
      <div className="brand-orbit__badge">
        <img src="/logo-192.png" alt="" className="brand-orbit__badge-img" />
      </div>
      {label && <span className="brand-orbit__label">{label}</span>}
    </div>
  )
}

/**
 * Version compacta para usar dentro de botones: un arco de dos tonos que
 * hereda el color del texto del boton (currentColor), asi funciona igual
 * de bien en botones primarios (fondo navy) que en outline/secundarios.
 */
export function ButtonSpinner() {
  return <span className="btn-spinner" aria-hidden="true" />
}
