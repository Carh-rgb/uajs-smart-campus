import React from 'react'

// Set de iconos de linea (trazo, sin relleno) usado en Login, Landing y en
// la navegacion de la app (sidebar/busqueda) para mantener una sola familia
// visual en toda la plataforma.
const base = { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }
const trazo = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconoDocumento(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" {...trazo} />
      <path d="M14 3v5h5" {...trazo} />
      <path d="M9 13h6M9 17h6" {...trazo} />
    </svg>
  )
}

export function IconoCalendario(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" {...trazo} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" {...trazo} />
    </svg>
  )
}

export function IconoCampana(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10a6 6 0 0 1 12 0v4l1.5 3h-15L6 14v-4Z" {...trazo} />
      <path d="M10 20a2 2 0 0 0 4 0" {...trazo} />
    </svg>
  )
}

export function IconoGorro(props) {
  return (
    <svg {...base} {...props}>
      <path d="m12 4 10 5-10 5L2 9l10-5Z" {...trazo} />
      <path d="M6 11.5v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" {...trazo} />
      <path d="M20 10v6" {...trazo} />
    </svg>
  )
}

export function IconoLibro(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5c2.5-1.3 5.3-1.3 8 0v13c-2.7-1.3-5.5-1.3-8 0v-13Z" {...trazo} />
      <path d="M20 5.5c-2.5-1.3-5.3-1.3-8 0v13c2.7-1.3 5.5-1.3 8 0v-13Z" {...trazo} />
    </svg>
  )
}

export function IconoEdificio(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21V9l7-5 7 5v12" {...trazo} />
      <path d="M3 21h18" {...trazo} />
      <path d="M9 21v-6h6v6" {...trazo} />
      <path d="M9 12h.01M15 12h.01M9 9h.01M15 9h.01" {...trazo} />
    </svg>
  )
}

export function IconoDiploma(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h11l3 3v13H5V4Z" {...trazo} />
      <path d="M16 4v3h3" {...trazo} />
      <circle cx="10.5" cy="14" r="2.5" {...trazo} />
      <path d="m9 16-1 3.5 2.5-1.3L13 19.5 12 16" {...trazo} />
    </svg>
  )
}

export function IconoMochila(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8V6a5 5 0 0 1 10 0v2" {...trazo} />
      <path d="M6 8h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" {...trazo} />
      <path d="M9 12h6M9 16h6" {...trazo} />
    </svg>
  )
}

export function IconoCarnet(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" {...trazo} />
      <circle cx="9" cy="11" r="2" {...trazo} />
      <path d="M6 16c.6-1.6 1.9-2.5 3-2.5s2.4.9 3 2.5" {...trazo} />
      <path d="M14.5 10h4M14.5 13h4" {...trazo} />
    </svg>
  )
}

export function IconoLaptop(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="5" width="15" height="10" rx="1.2" {...trazo} />
      <path d="M2.5 19h19l-1.5-3h-16l-1.5 3Z" {...trazo} />
    </svg>
  )
}

export function IconoGlobo(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" {...trazo} />
      <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z" {...trazo} />
    </svg>
  )
}

export function IconoChat(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16v11H9l-4 4V5Z" {...trazo} />
      <path d="M8 9.5h8M8 13h5" {...trazo} />
    </svg>
  )
}

export function IconoReloj(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" {...trazo} />
      <path d="M12 7v5l3.5 2" {...trazo} />
    </svg>
  )
}

export function IconoLapiz(props) {
  return (
    <svg {...base} {...props}>
      <path d="m4 20 1-4.5L15.5 5 19 8.5 8.5 19 4 20Z" {...trazo} />
      <path d="M13.5 6.5 17.5 10.5" {...trazo} />
    </svg>
  )
}

export function IconoGrafico(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10M11 20V4M18 20v-7" {...trazo} />
      <path d="M2 20h20" {...trazo} />
    </svg>
  )
}

export function IconoCasa(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11 12 4l8 7" {...trazo} />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" {...trazo} />
      <path d="M10 20v-6h4v6" {...trazo} />
    </svg>
  )
}

export function IconoUsuario(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.2" r="3.5" {...trazo} />
      <path d="M5 20c1-4 3.8-6 7-6s6 2 7 6" {...trazo} />
    </svg>
  )
}

export function IconoUsuarios(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.3" r="3" {...trazo} />
      <path d="M3.2 19c.8-3.3 3-5.2 5.8-5.2s5 1.9 5.8 5.2" {...trazo} />
      <circle cx="17" cy="9" r="2.2" {...trazo} />
      <path d="M15.2 12.4c1.9.5 3.3 2 3.9 4.3" {...trazo} />
    </svg>
  )
}

export function IconoLupa(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" {...trazo} />
      <path d="m20 20-4.8-4.8" {...trazo} />
    </svg>
  )
}

export function IconoHerramientas(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="9.5" width="18" height="9.5" rx="1.5" {...trazo} />
      <path d="M8 9.5V6.8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.7" {...trazo} />
      <path d="M3 13.5h18" {...trazo} />
    </svg>
  )
}
