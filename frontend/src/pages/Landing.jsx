import React from 'react'
import { Link } from 'react-router-dom'
import {
  IconoGorro,
  IconoLibro,
  IconoEdificio,
  IconoDiploma,
  IconoMochila,
  IconoCarnet,
  IconoLaptop,
  IconoGlobo,
  IconoChat,
  IconoReloj,
  IconoLapiz,
  IconoDocumento,
  IconoCalendario,
  IconoCampana,
} from '../components/icons.jsx'

// Composicion curada de figuras universitarias dispersas de fondo (estilo
// "line-art pattern"). Se concentran mas hacia la derecha/abajo para no
// competir con el bloque de texto, que vive en la mitad izquierda.
const PATRON_ICONOS = [
  { Icono: IconoGorro, top: '10%', left: '54%', size: 46, rot: -10 },
  { Icono: IconoLibro, top: '14%', left: '78%', size: 34, rot: 8 },
  { Icono: IconoEdificio, top: '28%', left: '90%', size: 52, rot: 0 },
  { Icono: IconoDiploma, top: '6%', left: '88%', size: 32, rot: -6 },
  { Icono: IconoMochila, top: '46%', left: '62%', size: 38, rot: 6 },
  { Icono: IconoCarnet, top: '62%', left: '84%', size: 40, rot: -4 },
  { Icono: IconoLaptop, top: '72%', left: '58%', size: 42, rot: 4 },
  { Icono: IconoGlobo, top: '80%', left: '80%', size: 30, rot: 0 },
  { Icono: IconoChat, top: '38%', left: '38%', size: 30, rot: -8 },
  { Icono: IconoReloj, top: '58%', left: '30%', size: 26, rot: 0 },
  { Icono: IconoLapiz, top: '20%', left: '20%', size: 24, rot: 20 },
  { Icono: IconoDocumento, top: '85%', left: '20%', size: 28, rot: -6 },
  { Icono: IconoCalendario, top: '48%', left: '10%', size: 30, rot: 6 },
  { Icono: IconoCampana, top: '10%', left: '10%', size: 26, rot: -10 },
]

const MARCAS = [
  { tipo: 'x', top: '20%', left: '68%' },
  { tipo: 'punto', top: '34%', left: '84%' },
  { tipo: 'guion', top: '52%', left: '92%' },
  { tipo: 'punto', top: '8%', left: '68%' },
  { tipo: 'x', top: '66%', left: '68%' },
  { tipo: 'guion', top: '24%', left: '44%' },
  { tipo: 'punto', top: '78%', left: '46%' },
  { tipo: 'x', top: '90%', left: '64%' },
  { tipo: 'guion', top: '40%', left: '20%' },
  { tipo: 'punto', top: '64%', left: '16%' },
  { tipo: 'x', top: '12%', left: '30%' },
]

function Marca({ tipo }) {
  if (tipo === 'x') {
    return (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  if (tipo === 'guion') {
    return (
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 8h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

const SERVICIOS = [
  {
    Icono: IconoDocumento,
    titulo: 'Solicitudes',
    texto: 'Radica y da seguimiento a certificados, constancias y trámites académicos sin filas ni papeleo.',
  },
  {
    Icono: IconoCalendario,
    titulo: 'Reservas',
    texto: 'Reserva salones, salas especiales, espacios de biblioteca y equipos en pocos minutos.',
  },
  {
    Icono: IconoLaptop,
    titulo: 'Recursos',
    texto: 'Consulta en tiempo real la disponibilidad de equipos audiovisuales y de cómputo del campus.',
  },
  {
    Icono: IconoGorro,
    titulo: 'Eventos y actividades',
    texto: 'Entérate de conferencias, talleres y actividades institucionales, e inscríbete en un clic.',
  },
  {
    Icono: IconoCampana,
    titulo: 'Notificaciones',
    texto: 'Recibe alertas inmediatas sobre el estado de tus trámites, reservas e inscripciones.',
  },
  {
    Icono: IconoChat,
    titulo: 'PQRS',
    texto: 'Radica peticiones, quejas, reclamos o sugerencias y haz seguimiento a la respuesta oficial.',
  },
]

export default function Landing() {
  return (
    <div>
      <section className="landing-hero landing-hero--full">
        <div className="landing-hero__pattern" aria-hidden="true">
          {PATRON_ICONOS.map((p, i) => (
            <span
              key={i}
              className="landing-hero__pattern-icon"
              style={{ top: p.top, left: p.left, width: p.size, height: p.size, transform: `rotate(${p.rot}deg)` }}
            >
              <p.Icono />
            </span>
          ))}
          {MARCAS.map((m, i) => (
            <span key={i} className={`landing-hero__pattern-mark landing-hero__pattern-mark--${m.tipo}`} style={{ top: m.top, left: m.left }}>
              <Marca tipo={m.tipo} />
            </span>
          ))}
        </div>

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

      <section className="landing-services">
        <div className="landing-services__header">
          <span className="landing-services__kicker">Un ecosistema, no solo un portal</span>
          <h2 className="landing-services__title">¿Qué puedes hacer en Smart Campus?</h2>
          <p className="landing-services__text">
            Todo el ciclo de trámites y servicios de la comunidad UAJS, en un
            único acceso institucional.
          </p>
        </div>

        <div className="landing-services__grid">
          {SERVICIOS.map((s) => (
            <div className="landing-feature-card" key={s.titulo}>
              <span className="landing-feature-card__icon">
                <s.Icono />
              </span>
              <h3 className="landing-feature-card__title">{s.titulo}</h3>
              <p className="landing-feature-card__text">{s.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
