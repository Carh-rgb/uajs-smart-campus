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
├── backend/          # Gateway + 7 microservicios + pruebas de API (ver backend/README.md)
│   ├── gateway/
│   ├── services/     # usuarios, solicitudes (+pqrs), reservas, recursos, eventos, notificaciones, busqueda
│   └── tests/        # 82 pruebas automáticas de API (npm test)
├── frontend/         # Aplicación React (ver frontend/README.md)
├── database/         # schema.sql, seed.sql y README de la base de datos
├── postman/          # Colección y entorno de Postman (111 peticiones, 189 aserciones)
└── .env.example      # Referencia de todas las variables de entorno
```

## Requisitos

- Node.js 18 o superior
- Docker Desktop **en ejecución** (PostgreSQL y Elasticsearch corren en contenedores)
- ~1 GB de RAM libre para Elasticsearch

## Cómo levantar todo

```bash
# 1) Backend: base de datos + los 7 microservicios + Gateway
cd backend
npm run db:up        # PostgreSQL + Elasticsearch en Docker
npm install
npm run setup:env    # crea los .env desde los .env.example (solo los que falten)
npm run dev

# 2) Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5183`. Cada servicio crea sus tablas y carga datos de prueba la primera vez que arranca; si prefieres scripts SQL explícitos, están en [`database/`](database/README.md). Instrucciones más detalladas de cada lado en [`backend/README.md`](backend/README.md) y [`frontend/README.md`](frontend/README.md).

## Puertos

| Componente | Puerto |
|---|---|
| Frontend (Vite) | 5183 |
| API Gateway | 4000 |
| usuarios · solicitudes · reservas · recursos · eventos · notificaciones · búsqueda | 4001 · 4002 · 4003 · 4004 · 4005 · 4006 · 4007 |
| PostgreSQL · Elasticsearch | 5432 · 9200 |

## Pruebas

Con la base de datos y los servicios corriendo:

```bash
cd backend
npm test             # 82 pruebas automáticas de API (~13 s)
```

Además, la colección de [`postman/`](postman) se puede ejecutar completa con el Runner de Postman o con Newman. Detalle de pruebas, catálogo de endpoints, reglas de negocio y solución de problemas en [`backend/README.md`](backend/README.md).

## Usuarios de prueba

Contraseña para todos: `uajs2026`

| Correo | Rol |
|---|---|
| `camilo.ramirez@uajs.edu.co` | Estudiante |
| `laura.perez@uajs.edu.co` | Docente |
| `andres.gomez@uajs.edu.co` | Administrativo |
| `admin@uajs.edu.co` | Administrador del sistema |

