# UAJS Smart Campus — Backend de microservicios

Backend distribuido para UAJS Smart Campus: 6 microservicios independientes en Node.js + Express, cada uno con su propia base de datos PostgreSQL, más un API Gateway como único punto de entrada.

## Arquitectura

```
Frontend React (puerto 5183)
        │
        ▼
  API Gateway (puerto 4000)
        │
   ┌────┼────────┬──────────┬──────────┬──────────┬──────────────┐
   ▼    ▼         ▼          ▼          ▼          ▼              ▼
usuarios solicitudes reservas recursos eventos notificaciones
 :4001    :4002 (+pqrs) :4003    :4004    :4005      :4006
   │         │           │        │        │            │
   ▼         ▼           ▼        ▼        ▼            ▼
uajs_usuarios uajs_solicitudes uajs_reservas uajs_recursos uajs_eventos uajs_notificaciones
                       (todas en el mismo contenedor Postgres, bases separadas)
```

Cada servicio sigue el patrón MVC (`models/`, `controllers/`, `routes/`) con Sequelize sobre PostgreSQL, y valida la sesión con un JWT emitido por `usuarios-service` (mismo `JWT_SECRET` en el `.env` de cada servicio).

`solicitudes-service` expone tanto `/solicitudes` como `/pqrs`: son datos casi idénticos y el PDF del proyecto no pide un microservicio de PQRS aparte de los 6 recomendados.

## Requisitos

- Node.js 18+ (ya lo tienes).
- Docker Desktop instalado y **en ejecución** (ábrelo manualmente si no está corriendo).

## Cómo levantar todo

```bash
cd server

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
```

Cada `GET /health` (p. ej. `http://localhost:4001/health`) confirma que un servicio individual está arriba.

## Apagar

```bash
npm run db:down   # detiene y borra el contenedor (el volumen de datos persiste)
```

## Frontend

El frontend React (carpeta `uajs-smart-campus/`) ya está conectado a este backend: todos sus `Context` hacen `fetch` al Gateway a través de `src/api/client.js`, usando la URL de `uajs-smart-campus/.env` (`VITE_API_URL=http://localhost:4000/api`). Para probar todo junto:

```bash
# Terminal 1
cd server && npm run db:up && npm run dev

# Terminal 2
cd uajs-smart-campus && npm run dev
```

Inicia sesión con cualquiera de los usuarios de prueba de la tabla de arriba (contraseña `uajs2026`).

Temas de "profundización" del PDF que quedaron fuera intencionalmente (no son requisito base): un broker de mensajes (RabbitMQ) para notificaciones entre servicios, y Redis para caché.
