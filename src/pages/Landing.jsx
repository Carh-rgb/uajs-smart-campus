import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="landing-hero landing-hero--full">
      <div className="landing-hero__inner">
        <div className="landing-hero__brand">
          <img src="/logo-blanco.png" alt="UAJS" className="landing-hero__logo" />
          <span>UAJS SMART CAMPUS</span>
        </div>
        <div className="landing-hero__eyebrow">
          Corporación Universitaria Antonio José de Sucre
        </div>
        <h1 className="landing-hero__title">
          Un solo lugar para todos tus servicios universitarios
        </h1>
        <p className="landing-hero__text">
          UAJS Smart Campus articula en una sola plataforma los servicios
          académicos y administrativos de la Universidad Antonio José de
          Sucre, para que consultes, gestiones y hagas seguimiento a tus
          trámites desde una experiencia integrada.
        </p>
        <div className="landing-hero__actions">
          <Link to="/login" className="btn btn--light">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  )
}
