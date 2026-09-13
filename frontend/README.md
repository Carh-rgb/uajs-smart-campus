# UAJS Smart Campus — Frontend

Aplicación React de UAJS Smart Campus: todas las vistas de estudiante, docente, administrativo y administrador del sistema, conectadas al backend a través del API Gateway.

## Requisitos

- Node.js 18+
- El backend corriendo (ver [`backend/README.md`](../backend/README.md)) — sin él, la app carga pero muestra un aviso de "backend no disponible".

## Instalación y ejecución

```bash
npm install
npm run dev
```

Queda disponible en `http://localhost:5183`.

Otros scripts:

```bash
npm run build     # build de producción
npm run preview   # sirve el build localmente
```

## Variables de entorno

Archivo `.env` en esta carpeta:

```
VITE_API_URL=http://localhost:4000/api
```

Apunta al API Gateway, no a un microservicio directamente.

## Estructura de carpetas

```
src/
├── api/          # cliente HTTP (fetch + token JWT)
├── components/   # 15 componentes reutilizables (Modal, Sidebar, StatusBadge, icons.jsx...)
├── context/      # un Context por dominio (Auth, Solicitudes, Reservas, PQRS, Eventos...)
├── data/         # catálogos y datos ilustrativos (mockData.js)
├── hooks/        # useHighlightRow, useFetch
├── pages/        # 15 vistas (una por módulo)
├── styles/       # CSS con metodología BEM, variables de tema (claro/oscuro)
├── App.jsx       # rutas (React Router)
└── main.jsx
```

## Tecnologías

React 18 · React Router 6 · Vite 5 · Recharts (gráficos en Reportes)

## Convenciones de diseño

Paleta, tipografía (Poppins/Inter), iconografía y navegación completa documentadas en [`docs/diseno-frontend.html`](../docs/diseno-frontend.html).

## Usuarios de prueba

Ver [`README.md`](../README.md) en la raíz del repositorio (contraseña `uajs2026` para todos).
