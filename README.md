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

Diagramas completos (capas, comunicación entre servicios y secuencias de los flujos principales) en [`arquitectura/README.md`](arquitectura/README.md).

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
├── arquitectura/     # Diagramas de arquitectura y de secuencia (ver arquitectura/README.md)
├── backend/          # Gateway + 7 microservicios (ver backend/README.md)
├── database/         # Scripts SQL, datos de prueba y modelo de datos (ver database/README.md)
├── frontend/         # Aplicación React (ver frontend/README.md)
├── postman/          # Colección Postman y entorno local (Entregable 2)
├── pruebas/          # Matriz de pruebas T01–T15, evidencias y scripts (ver pruebas/README.md)
├── .env.example      # Resumen de las variables de entorno de cada servicio
└── GUIA-ENTREGABLE-2.md  # Reparto de tareas y estado del Entregable 2
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

La aplicación queda disponible en `http://localhost:5183`. Para crear las bases desde los scripts SQL (sin arrancar los servicios) y ver el modelo de datos, consulta [`database/README.md`](database/README.md). Instrucciones más detalladas de cada lado en [`backend/README.md`](backend/README.md) y [`frontend/README.md`](frontend/README.md).

### Variables de entorno

Cada servicio tiene su propio `.env.example` (en `backend/gateway/` y en cada
`backend/services/<servicio>/`); se copian a `.env` antes de `npm run dev`.
El archivo [`.env.example`](.env.example) de la raíz resume todas las variables.

### Problemas comunes

| Síntoma | Solución |
|---|---|
| Error de CORS en el navegador | El frontend debe correr en `http://localhost:5183` (coincide con `FRONTEND_ORIGIN`). |
| Un campo nuevo no aparece en la base | Sequelize no modifica tablas existentes: `cd backend && docker compose down -v && docker compose up -d`. |
| `Cannot find module 'express-async-errors'` | Falta `npm install` dentro de `backend/`. |
| Aviso "No se pudo conectar con el servidor" | Algún servicio está caído: revisar `http://localhost:4000/health`. |

## Entregable 2: persistencia, CRUD e integración

| Tema | Dónde |
|---|---|
| Modelo de datos, scripts SQL y orden de ejecución | [`database/README.md`](database/README.md) y [`database/MODELO-DATOS.md`](database/MODELO-DATOS.md) |
| Arquitectura y diagramas de secuencia | [`arquitectura/README.md`](arquitectura/README.md) |
| Pruebas (colección Postman y matriz T01–T15) | [`pruebas/README.md`](pruebas/README.md) y [`pruebas/MATRIZ-PRUEBAS.md`](pruebas/MATRIZ-PRUEBAS.md) |
| Formato de error de la API | `{ "success": false, "error": { "code": "...", "message": "..." } }` en todos los servicios |
| Reparto de tareas y trazabilidad | [`GUIA-ENTREGABLE-2.md`](GUIA-ENTREGABLE-2.md) |

## Despliegue con Docker (Entregable 3)

Todo el sistema (PostgreSQL, Elasticsearch, 7 microservicios, Gateway y frontend con nginx) se levanta con el `docker-compose.yml` de la raíz. Requisitos del servidor: Docker con el plugin Compose y unos 4 GB de RAM (Elasticsearch usa 512 MB de heap).

```bash
git clone https://github.com/Carh-rgb/uajs-smart-campus.git
cd uajs-smart-campus
bash setup.sh                  # solo la primera vez: crea .env con JWT_SECRET y clave de Postgres aleatorios
                               # (en Windows: powershell -ExecutionPolicy Bypass -File .\setup.ps1)
docker compose up -d --build   # la primera vez tarda unos minutos
docker compose ps              # todos los contenedores deben quedar "running" / "healthy"
curl http://127.0.0.1:4000/health   # salud de los 7 servicios vista por el Gateway
```

El sistema queda en `http://<ip-del-servidor>/` (puerto definido por `HTTP_PORT` en `.env`).

| Qué | Cómo queda |
|---|---|
| Puerto abierto a internet | Solo el 80 (nginx). nginx sirve el frontend y reenvía `/api` y `/health` al Gateway por la red interna. |
| Gateway | Publicado únicamente en `127.0.0.1:4000` del servidor, para diagnóstico. |
| Postgres y Elasticsearch | Sin puertos publicados (ver [`SEGURIDAD.md`](SEGURIDAD.md)). |
| Secretos | `.env` de la raíz, generado por `setup.sh`, fuera de git. Ya no se usa el `JWT_SECRET` de relleno. |
| CORS | `FRONTEND_ORIGIN` = `PUBLIC_URL`; el navegador habla con un solo origen. |
| Datos | Volúmenes `uajs_pgdata_prod` y `uajs_esdata_prod` (no se pierden al reiniciar). |

**Con HTTPS (servidor con dominio, por ejemplo la VM de Azure):** al correr `setup.sh` se escribe el dominio (el nombre DNS de la VM, `<nombre>.<region>.cloudapp.azure.com`) y se levanta con la capa de Caddy, que pide el certificado de Let's Encrypt solo y redirige `http` a `https`:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

En ese modo solo Caddy publica los puertos 80 y 443; nginx queda interno.

Comandos útiles: `docker compose logs -f gateway` (registros), `docker compose restart <servicio>`, `docker compose down` (apaga sin borrar datos) y `docker compose down -v` (borra también las bases). Si se vuelve a generar el `.env` con otra clave de Postgres, hay que borrar el volumen con `down -v`.

La dockerización parte del trabajo de Maicol Anaya en `feature/maicol-qa-despliegue`, actualizado al contrato de `develop` del Entregable 2.

## Usuarios de prueba

Contraseña para todos: `uajs2026`

| Correo | Rol |
|---|---|
| `camilo.ramirez@uajs.edu.co` | Estudiante |
| `laura.perez@uajs.edu.co` | Docente |
| `andres.gomez@uajs.edu.co` | Administrativo |
| `admin@uajs.edu.co` | Administrador del sistema |

