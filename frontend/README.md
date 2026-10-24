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

Archivo `.env` en esta carpeta (hay un `.env.example` de referencia; `npm run setup:env` en `backend/` lo crea si falta):

```
VITE_API_URL=http://localhost:4000/api
```

Apunta al API Gateway, nunca a un microservicio ni a la base de datos: el navegador solo habla con el Gateway.

## Estructura de carpetas

```
src/
├── api/          # cliente HTTP base (fetch + token JWT + ApiError tipado)
├── services/     # un cliente HTTP por dominio (solicitudes, reservas, recursos, eventos...)
├── constants/    # catálogos (estados, tipos) y transiciones de estado válidas
├── components/   # componentes reutilizables (Modal, Sidebar, StatusBadge, ErrorPanel, icons.jsx...)
├── context/      # un Context por dominio: estado, carga y error sobre los services
├── hooks/        # useHighlightRow
├── pages/        # 15 vistas (una por módulo)
├── styles/       # CSS con metodología BEM, variables de tema (claro/oscuro)
├── App.jsx       # rutas (React Router)
└── main.jsx
```

## Integración con el backend

Flujo de cada acción: **página → context → service → API Gateway → microservicio → base de datos**. Los datos que se muestran vienen siempre de la API; no hay datos simulados en la aplicación (la única excepción es el panel editorial "Anuncios y beneficios" del dashboard, que es contenido estático en `constants/institucional.js`).

Estados de interfaz implementados en cada módulo: **cargando** (spinner), **éxito** (confirmación y lista actualizada), **error de validación o de regla de negocio** (el mensaje del backend, que nombra el campo), **error de servidor o de conexión** (panel con botón *Reintentar* y aviso global que indica qué servicio no responde), **lista vacía** (mensaje útil) y **detalle inexistente** (pantalla "no encontrado"). Los selectores de estado (solicitudes, PQRS, reservas) ofrecen solo las transiciones que el backend acepta.

## Tecnologías

React 18 · React Router 6 · Vite 5 · Recharts (gráficos en Reportes)

## Convenciones de diseño

Paleta, tipografía (Poppins/Inter), iconografía y navegación completa documentadas en [`docs/diseno-frontend.html`](../docs/diseno-frontend.html).

## Usuarios de prueba

Ver [`README.md`](../README.md) en la raíz del repositorio (contraseña `uajs2026` para todos).
