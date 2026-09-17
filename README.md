# UAJS Smart Campus

Proyecto Integrador — Asignatura Sistemas Distribuidos, Corporación Universitaria Antonio José de Sucre (UNIAJS).

Plataforma web que centraliza los servicios universitarios de UAJS (solicitudes, PQRS, reservas de espacios/equipos, catálogo de recursos, eventos institucionales, notificaciones y reportes) detrás de una autenticación por rol, con una arquitectura de microservicios independientes y persistencia real en PostgreSQL.

## Integrantes

| Integrante | Rol | Responsabilidad principal |
|---|---|---|
| Arnovis | Líder / Arquitectura y Backend base | Arquitectura general, API Gateway, configuración inicial del backend, coordinación técnica |
| Camilo | Microservicios — Usuarios y Solicitudes | `usuarios-service` (auth, roles, permisos) y `solicitudes-service` (solicitudes + PQRS) |
| Simón | Microservicios — Reservas y Recursos | `reservas-service` y `recursos-service`, incluida la sincronización de stock entre ambos |
| Diego | Microservicios — Eventos, Notificaciones y Búsqueda | `eventos-service`, `notificaciones-service` y `busqueda-service` (Elasticsearch) |
| David | Frontend / UX | Componentes React, rutas, dashboard, formularios, CSS/BEM, responsive |
| Maicol | QA, DevOps y documentación | Pruebas funcionales, Docker, GitHub (ramas/PRs/trazabilidad), documentación técnica y ClickUp |

## Arquitectura

```
Frontend React (5183)
        │  HTTPS + JWT
        ▼
  API Gateway (4000) — enrutador puro, sin lógica propia
        │
   ┌────┼────────┬──────────┬──────────┬──────────────┬──────────┐
   ▼    ▼         ▼          ▼          ▼              ▼          ▼
usuarios solicitudes reservas recursos eventos  notificaciones  busqueda
 :4001  :4002(+pqrs)  :4003    :4004    :4005        :4006       :4007
   │        │           │        │        │              │           │
   ▼        ▼           ▼        ▼        ▼              ▼           ▼
        PostgreSQL — un contenedor, 6 bases separadas          Elasticsearch
```

Cada microservicio protege sus propias rutas con su propio middleware JWT (el Gateway no valida nada); comparten el mismo `JWT_SECRET`. El detalle completo de responsabilidades, rutas y decisiones está en [`backend/README.md`](backend/README.md) y en el [diagrama de arquitectura](docs/diagrama-arquitectura.html).

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 18, React Router 6, Vite 5, Recharts |
| Backend | Node.js, Express, Sequelize |
| Base de datos | PostgreSQL (una base por microservicio) + Elasticsearch (búsqueda) |
| Comunicación | REST sobre HTTP/HTTPS, JSON, JWT |
| Infraestructura local | Docker (Postgres + Elasticsearch) |

## Estructura del repositorio

```
uajs-smart-campus/
├── backend/          # Gateway + 7 microservicios (ver backend/README.md)
├── frontend/         # Aplicación React (ver frontend/README.md)
└── docs/             # Documentos del Entregable 1 (análisis, arquitectura, diseño)
```

## Cómo levantar todo

```bash
# 1) Backend: base de datos + los 7 microservicios + Gateway
cd backend
npm run db:up
npm install
npm run dev

# 2) Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5183`. Instrucciones más detalladas de cada lado en [`backend/README.md`](backend/README.md) y [`frontend/README.md`](frontend/README.md).

## Despliegue con Docker (recomendado para un servidor)

Para levantar TODO (gateway, los 7 microservicios, el frontend, PostgreSQL y
Elasticsearch) con un solo comando, en cualquier servidor con Docker y
Docker Compose instalados:

```bash
git clone git@github.com:Carh-rgb/uajs-smart-campus.git
cd uajs-smart-campus
./setup.sh              # crea los .env necesarios (solo la primera vez)
docker compose up -d --build
```

El sistema queda disponible en `http://<ip-o-dominio-del-servidor>` (puerto 80),
tanto desde el mismo servidor como desde cualquier otro dispositivo en la
misma red (o en internet, si el servidor es un VPS con el puerto abierto).

`setup.sh` te pregunta la URL pública (por defecto detecta la IP local del
servidor) y crea los `.env` de cada microservicio a partir de sus
`.env.example` — no pisa ninguno que ya exista. Si quieres que funcione el
correo de recuperación de contraseña, después de correr `setup.sh` edita
`backend/services/usuarios-service/.env` y coloca un `EMAIL_USER` real y un
`EMAIL_PASS` (contraseña de aplicación de Google, no la contraseña normal
de la cuenta — se genera en myaccount.google.com → Seguridad → Contraseñas
de aplicaciones, con la verificación en 2 pasos activada).

Para actualizar un servidor ya desplegado con cambios nuevos:
```bash
git pull
docker compose up -d --build
```

## Usuarios de prueba

Contraseña para todos: `uajs2026`

| Correo | Rol |
|---|---|
| `camilo.ramirez@uajs.edu.co` | Estudiante |
| `laura.perez@uajs.edu.co` | Docente |
| `andres.gomez@uajs.edu.co` | Administrativo |
| `admin@uajs.edu.co` | Administrador del sistema |

