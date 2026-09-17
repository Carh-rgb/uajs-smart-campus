# API Gateway — UAJS Smart Campus

Punto de entrada único para el frontend. Todo lo que se llama bajo `/api/*`
pasa por aquí y se reenvía (proxy) al microservicio dueño de ese dominio.
No valida sesiones ni contiene lógica de negocio — cada microservicio
protege sus propias rutas de forma independiente.

## Cómo correrlo

Requiere que `backend/docker-compose.yml` esté arriba (`npm run db:up` desde
`backend/`) y un archivo `.env` (copiado de `.env.example`).

```bash
npm install
npm run dev
```

Queda escuchando en `http://localhost:4000` (o el puerto de `PORT` en tu
`.env`).

## Rutas y a qué microservicio van

| Prefijo              | Microservicio           |
| --------------------- | ------------------------ |
| `/api/auth`            | usuarios-service          |
| `/api/usuarios`        | usuarios-service          |
| `/api/permisos`        | usuarios-service          |
| `/api/pqrs`             | solicitudes-service       |
| `/api/solicitudes`     | solicitudes-service       |
| `/api/reservas`        | reservas-service          |
| `/api/recursos`        | recursos-service          |
| `/api/eventos`         | eventos-service           |
| `/api/notificaciones`  | notificaciones-service    |
| `/api/buscar`          | busqueda-service          |

## Health check

`GET /health` devuelve el estado del gateway.

## Variables de entorno

Ver `.env.example`. Todas tienen un valor por defecto de `localhost` para
desarrollo, pero conviene tenerlas explícitas en el `.env` antes de
desplegar en un servidor real.
