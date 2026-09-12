# UAJS Smart Campus — Backend de microservicios

Backend distribuido para UAJS Smart Campus: 7 microservicios independientes en Node.js + Express (6 con su propia base de datos PostgreSQL, uno de búsqueda sobre Elasticsearch), más un API Gateway como único punto de entrada.

## Arquitectura

```
Frontend React (puerto 5183)
        │
        ▼
  API Gateway (puerto 4000)
        │
   ┌────┼────────┬──────────┬──────────┬──────────┬──────────────┬──────────┐
   ▼    ▼         ▼          ▼          ▼          ▼              ▼          ▼
usuarios solicitudes reservas recursos eventos notificaciones  busqueda
 :4001    :4002 (+pqrs) :4003    :4004    :4005      :4006        :4007
   │         │           │        │        │            │           │
   ▼         ▼           ▼        ▼        ▼            ▼           ▼
uajs_usuarios uajs_solicitudes uajs_reservas uajs_recursos uajs_eventos uajs_notificaciones  Elasticsearch
                       (todas en el mismo contenedor Postgres, bases separadas)         (indice uajs_buscar)
```

Cada servicio con base de datos sigue el patrón MVC (`models/`, `controllers/`, `routes/`) con Sequelize sobre PostgreSQL, y valida la sesión con un JWT emitido por `usuarios-service` (mismo `JWT_SECRET` en el `.env` de cada servicio).

`solicitudes-service` expone tanto `/solicitudes` como `/pqrs`: son datos casi idénticos y el PDF del proyecto no pide un microservicio de PQRS aparte de los 6 recomendados.

### Búsqueda (`busqueda-service` + Elasticsearch)

Es el equivalente al "MS Buscador" de una arquitectura con Eureka/Spring: un
microservicio que solo conoce Elasticsearch, no una base de datos propia.

- `solicitudes-service`, `reservas-service`, `recursos-service`,
  `eventos-service` y `usuarios-service` avisan a `busqueda-service`
  (`PUT /buscar/documento` / `DELETE /buscar/documento/:tipo/:id`) cada vez
  que crean, editan o borran algo indexable — el mismo patrón
  fire-and-forget que ya usa `recursos-service` para sincronizar el stock
  con `reservas-service` (`src/utils/busquedaClient.js` en cada uno).
- Al arrancar por primera vez, `busqueda-service` hace un backfill: lee el
  catálogo completo de cada servicio (con un JWT de servicio, mismo
  `JWT_SECRET` compartido) y lo indexa de una vez, para que lo que ya
  existía también sea buscable.
- `GET /buscar?q=...` hace la búsqueda de texto completo en Elasticsearch y
  filtra los resultados según lo que el rol del usuario ya puede ver en
  cada módulo (un estudiante no ve recursos ni usuarios, etc.).
- El frontend lo consume desde la barra de búsqueda del topbar
  (`src/components/TopbarSearch.jsx`).

## Requisitos

- Node.js 18+ (ya lo tienes).
- Docker Desktop instalado y **en ejecución** (ábrelo manualmente si no está corriendo).
- Al menos ~1GB de RAM libre para Elasticsearch (limitado a 512MB via `ES_JAVA_OPTS` en `docker-compose.yml`, pero Docker Desktop necesita margen alrededor de eso).

## Cómo levantar todo

```bash
cd backend

# 1) Base de datos (Postgres con las 6 bases, vía Docker)
npm run db:up

# 2) Instalar dependencias de gateway + los 6 servicios (workspaces de npm)
npm install

# 3) Levantar gateway + los 6 servicios a la vez
npm run dev
```

Cada servicio siembra sus datos iniciales automáticamente la primera vez que arranca (mismos usuarios/solicitudes/reservas/etc. que tenía el frontend en `mockData.js`).

**Usuarios de prueba** (contraseña para todos: `uajs2026`):
| Correo | Rol |
|---|---|
| `camilo.ramirez@uajs.edu.co` | Estudiante |
| `laura.perez@uajs.edu.co` | Docente |
| `andres.gomez@uajs.edu.co` | Administrativo |
| `admin@uajs.edu.co` | Administrador del sistema |

## Verificación rápida (curl)

```bash
# 1. Login → token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"andres.gomez@uajs.edu.co","password":"uajs2026"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# 2. Listar solicitudes (requiere token)
curl -s http://localhost:4000/api/solicitudes -H "Authorization: Bearer $TOKEN"

# 3. Responder una solicitud (Administrativo/Admin)
curl -s -X PATCH http://localhost:4000/api/solicitudes/SOL-0231/responder \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"respuesta":"Tu certificado ya esta listo.","nuevoEstado":"Resuelta"}'

# 4. Reservas, recursos, eventos, notificaciones
curl -s http://localhost:4000/api/reservas/catalogo -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/recursos -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/eventos -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/notificaciones -H "Authorization: Bearer $TOKEN"

# 5. Busqueda de texto completo (Elasticsearch)
curl -s "http://localhost:4000/api/buscar?q=certificado" -H "Authorization: Bearer $TOKEN"
```

Cada `GET /health` (p. ej. `http://localhost:4001/health`) confirma que un servicio individual está arriba.

## Apagar

```bash
npm run db:down   # detiene y borra el contenedor (el volumen de datos persiste)
```

## Frontend

El frontend React (carpeta `frontend/`) ya está conectado a este backend: todos sus `Context` hacen `fetch` al Gateway a través de `src/api/client.js`, usando la URL de `frontend/.env` (`VITE_API_URL=http://localhost:4000/api`). Para probar todo junto:

```bash
# Terminal 1
cd backend && npm run db:up && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Inicia sesión con cualquiera de los usuarios de prueba de la tabla de arriba (contraseña `uajs2026`).

Temas de "profundización" del PDF que quedaron fuera intencionalmente (no son requisito base): un broker de mensajes (RabbitMQ) para notificaciones entre servicios, y Redis para caché.
