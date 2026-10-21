# Arquitectura y comunicación entre servicios — UAJS Smart Campus

Diagramas del Entregable 2 (Fase 7 de la guía: "diagrama de secuencia o
flujo" y "comunicaciones entre servicios documentadas, con control de
fallos"). Están en Mermaid, así que GitHub los dibuja directamente; las
versiones en imagen para el documento técnico están en [`img/`](img/) y se
regeneran con `bash arquitectura/exportar.sh`.

Contenido:

1. [Arquitectura general](#1-arquitectura-general)
2. [Inicio de sesión y petición autenticada](#2-inicio-de-sesión-y-petición-autenticada)
3. [Crear una reserva con validación remota](#3-crear-una-reserva-con-validación-remota)
4. [Cambio de estado de una solicitud con notificación](#4-cambio-de-estado-de-una-solicitud-con-notificación)
5. [Cambio de estado de un recurso y sincronización de stock](#5-cambio-de-estado-de-un-recurso-y-sincronización-de-stock)
6. [Resumen de comunicaciones entre servicios](#6-resumen-de-comunicaciones-entre-servicios)
7. [Riesgos conocidos](#7-riesgos-conocidos)

> **Convención:** lo marcado como *E2-xx* es comportamiento que se implementa
> en esa tarea del Entregable 2 (ClickUp). El resto ya existe en `develop`.

---

## 1. Arquitectura general

### 1.1 Capas y despliegue

```mermaid
flowchart TB
  U(["Usuario · navegador"])
  FE["Frontend React 18 + Vite · :5183<br/>api/client.js · token JWT en localStorage"]
  GW["API Gateway · Express · :4000<br/>enrutador puro: /api/* → servicio · /health agregado"]

  subgraph MS["Microservicios Node.js + Express (cada uno valida el JWT)"]
    direction LR
    US["usuarios<br/>:4001"]
    SO["solicitudes<br/>:4002"]
    RE["reservas<br/>:4003"]
    RC["recursos<br/>:4004"]
    EV["eventos<br/>:4005"]
    NO["notificaciones<br/>:4006"]
    BU["busqueda<br/>:4007"]
  end

  subgraph DATOS["Persistencia (contenedores Docker)"]
    direction LR
    DUS[("uajs_usuarios")]
    DSO[("uajs_solicitudes")]
    DRE[("uajs_reservas")]
    DRC[("uajs_recursos")]
    DEV[("uajs_eventos")]
    DNO[("uajs_notificaciones")]
    ES[("Elasticsearch<br/>uajs_buscar · :9200")]
  end

  U --> FE
  FE -- "HTTP + JSON · Bearer JWT" --> GW
  GW --> US & SO & RE & RC & EV & NO & BU
  US --> DUS
  SO --> DSO
  RE --> DRE
  RC --> DRC
  EV --> DEV
  NO --> DNO
  BU --> ES
```

Las 6 bases `uajs_*` viven en **un solo contenedor PostgreSQL 16**
(`uajs-postgres`, puerto 5432), pero cada una es exclusiva de su servicio.

### 1.2 Comunicación entre microservicios

```mermaid
flowchart LR
  subgraph NEG["Servicios de negocio"]
    direction TB
    US["usuarios-service"]
    SO["solicitudes-service"]
    EV["eventos-service"]
    RE["reservas-service"]
    RC["recursos-service"]
  end

  RC -- "sincroniza stock" --> RE
  RE -. "valida recurso · E2-21" .-> RC

  SO -.-> JN(( ))
  RE -.-> JN
  EV -.-> JN
  JN -. "notifica · E2-32" .-> NO["notificaciones-service"]

  NEG --> BU["busqueda-service<br/>todos indexan con<br/>PUT /buscar/documento"]
```

Línea continua: ya existe en `develop`. Línea punteada: se implementa en la
tarea indicada. El detalle de cada llamada está en la
[sección 6](#6-resumen-de-comunicaciones-entre-servicios).

**Cómo leerlo:**

- El navegador **solo** habla con el Gateway (`:4000`). Nunca conoce los
  puertos de los microservicios ni toca una base de datos.
- El Gateway es un **enrutador puro**: quita el prefijo `/api` y reenvía la
  petición al servicio dueño de esa ruta (`/api/solicitudes` →
  solicitudes-service). No valida tokens ni tiene lógica de negocio; si un
  servicio no responde, devuelve `502 SERVICE_UNAVAILABLE`.
- Cada microservicio **valida el JWT por su cuenta** (mismo `JWT_SECRET`) y es
  el **único dueño** de su base. Las 6 bases viven en un solo contenedor
  PostgreSQL, pero separadas.
- Las flechas punteadas son llamadas **HTTP síncronas entre servicios**. Las
  de sincronización, indexación y notificación son *fire-and-forget*: si el
  servicio destino está caído, la operación principal igual se completa y el
  error queda en el log. La validación de recurso (E2-21) es la excepción:
  si falla, la reserva **no** se crea.

---

## 2. Inicio de sesión y petición autenticada

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant FE as Frontend React
  participant GW as API Gateway
  participant US as usuarios-service
  participant DB as uajs_usuarios
  participant SO as solicitudes-service

  U->>FE: correo y contraseña
  FE->>GW: POST /api/auth/login
  GW->>US: POST /auth/login
  US->>DB: SELECT usuario por correo
  DB-->>US: usuario + passwordHash
  US->>US: bcrypt.compare(password, passwordHash)
  alt credenciales inválidas o usuario inactivo
    US-->>GW: 401 UNAUTHORIZED
    GW-->>FE: 401
    FE-->>U: mensaje de error
  else válidas
    US->>US: firma JWT {id, nombre, rol} · expira en 8 h
    US-->>GW: 200 {token, usuario}
    GW-->>FE: 200
    FE->>FE: guarda el token en localStorage
  end

  Note over FE,SO: Peticiones siguientes: el token viaja en Authorization
  FE->>GW: GET /api/solicitudes (Bearer JWT)
  GW->>SO: GET /solicitudes (mismo header)
  SO->>SO: jwt.verify con JWT_SECRET (sin llamar a usuarios-service)
  alt token ausente, inválido o vencido
    SO-->>GW: 401 UNAUTHORIZED
  else rol sin permiso para la acción
    SO-->>GW: 403 FORBIDDEN
  else válido
    SO-->>GW: 200 solicitudes del usuario (todas si es personal)
  end
  GW-->>FE: respuesta
```

**Decisión:** la sesión no se guarda en ningún servidor (JWT sin estado).
Cada servicio verifica la firma localmente, así no depende de que
usuarios-service esté arriba para atender peticiones ya autenticadas.

---

## 3. Crear una reserva con validación remota

Implementa las reglas de la guía 7.5 y 8.5. Tareas: E2-20 (fechas y
solapamiento) y E2-21 (validar el espacio o recurso).

```mermaid
sequenceDiagram
  autonumber
  actor U as Estudiante
  participant FE as Frontend React
  participant GW as API Gateway
  participant RE as reservas-service
  participant DRE as uajs_reservas
  participant RC as recursos-service
  participant BU as busqueda-service

  U->>FE: elige espacio, fecha, horas y motivo
  FE->>FE: valida campos obligatorios y muestra "enviando"
  FE->>GW: POST /api/reservas (Bearer JWT)
  GW->>RE: POST /reservas
  RE->>RE: verifica JWT (el usuario sale del token)
  RE->>RE: valida campos, fecha no pasada y horaFin > horaInicio (E2-20)
  alt datos inválidos
    RE-->>FE: 400 VALIDATION_ERROR (vía Gateway)
  end
  RE->>DRE: ¿existe el espacio en el catálogo? (salón, sala o equipo)
  opt el espacio es un equipo (E2-21)
    RE->>RC: GET /recursos/:codigo (token de servicio)
    alt recursos-service no responde
      RC--xRE: timeout o error de red
      RE-->>FE: 503 SERVICE_UNAVAILABLE · no se crea la reserva
    else el recurso no existe o no está Disponible
      RC-->>RE: 404 o estado distinto de Disponible
      RE-->>FE: 400 VALIDATION_ERROR
    else disponible
      RC-->>RE: 200 recurso Disponible
    end
  end
  RE->>DRE: ¿hay reservas Pendiente/Confirmada del mismo espacio, misma fecha y horario cruzado? (E2-20)
  alt hay solapamiento
    RE-->>FE: 409 RESERVATION_CONFLICT · no se crea
  else libre
    RE->>DRE: INSERT reserva (estado Pendiente) + INSERT reservas_historial
    RE-)BU: PUT /buscar/documento (fire-and-forget)
    RE-->>GW: 201 reserva creada
    GW-->>FE: 201
    FE-->>U: confirmación y la reserva aparece en la lista
  end
```

**Control de fallos:** la consulta a recursos-service es **bloqueante**. Si
no responde, se devuelve un error controlado y no se guarda una reserva
inconsistente (guía 8.5). La indexación en búsqueda no bloquea: si
busqueda-service está caído, la reserva igual se crea.

---

## 4. Cambio de estado de una solicitud con notificación

Tareas: E2-12 (transiciones permitidas) y E2-32 (notificación generada por
el servicio, no por el frontend).

```mermaid
sequenceDiagram
  autonumber
  actor A as Administrativo
  participant FE as Frontend React
  participant GW as API Gateway
  participant SO as solicitudes-service
  participant DSO as uajs_solicitudes
  participant NO as notificaciones-service
  participant BU as busqueda-service
  actor E as Estudiante

  A->>FE: elige el siguiente estado (solo los permitidos, E2-40)
  FE->>GW: PATCH /api/solicitudes/:id/responder {nuevoEstado, respuesta}
  GW->>SO: PATCH /solicitudes/:id/responder
  SO->>SO: verifica JWT y rol (Administrativo o Administrador)
  SO->>DSO: SELECT solicitud
  alt no existe
    SO-->>FE: 404 NOT_FOUND
  end
  SO->>SO: ¿la transición está permitida? (E2-12)
  Note right of SO: Registrada → En revisión → Asignada<br/>→ En proceso → Resuelta → Cerrada
  alt transición no permitida
    SO-->>FE: 409 INVALID_TRANSITION · el estado no cambia
  else permitida
    SO->>DSO: UPDATE solicitud + INSERT solicitudes_historial
    SO-)NO: crear notificación para el solicitante (token de servicio, E2-32)
    SO-)BU: PUT /buscar/documento
    SO-->>GW: 200 solicitud actualizada
    GW-->>FE: 200
    FE-->>A: estado actualizado en el detalle
  end

  Note over E,NO: Más tarde, el estudiante abre la campana
  E->>FE: abre notificaciones
  FE->>GW: GET /api/notificaciones
  GW->>NO: GET /notificaciones
  NO-->>FE: lista con la notificación nueva (vía Gateway)
  E->>FE: marca como leída
  FE->>GW: PATCH /api/notificaciones/:id/leida
  GW->>NO: PATCH /notificaciones/:id/leida
  NO-->>FE: 200 leida = true (persistido)
```

**Control de fallos:** si notificaciones-service está caído, el cambio de
estado igual se guarda (la notificación es secundaria) y el error queda en el
log del servicio. Hoy (antes de E2-32) es el frontend quien crea la
notificación después de una respuesta exitosa.

---

## 5. Cambio de estado de un recurso y sincronización de stock

Comportamiento que **ya existe**: recursos-service es la fuente de verdad
del inventario, y reservas-service mantiene una réplica del stock reservable
por nombre de equipo.

```mermaid
sequenceDiagram
  autonumber
  actor A as Administrativo
  participant FE as Frontend React
  participant GW as API Gateway
  participant RC as recursos-service
  participant DRC as uajs_recursos
  participant RE as reservas-service
  participant DRE as uajs_reservas
  participant BU as busqueda-service

  A->>FE: cambia un proyector a "En mantenimiento"
  FE->>GW: PATCH /api/recursos/:codigo/estado
  GW->>RC: PATCH /recursos/:codigo/estado
  RC->>RC: verifica JWT y rol
  RC->>DRC: UPDATE recurso + INSERT recursos_historial
  alt estado fuera de la lista (ENUM)
    RC-->>FE: 400 VALIDATION_ERROR (antes de E2-01 esto tumbaba el servicio)
  end
  opt tipo reservable (Audiovisual o Equipo de cómputo)
    RC-)RE: PATCH /reservas/equipos/sync {nombre, delta: -1} (token de servicio)
    RE->>DRE: UPDATE equipos SET stock = stock - 1
  end
  RC-)BU: PUT /buscar/documento
  RC-->>GW: 200 recurso actualizado
  GW-->>FE: 200
```

**Control de fallos:** la sincronización es *fire-and-forget*. Si
reservas-service está caído, el recurso igual cambia de estado y el stock
queda desfasado en una unidad hasta la siguiente sincronización (limitación
conocida, ver sección 7).

---

## 6. Resumen de comunicaciones entre servicios

| Origen → destino | Endpoint | Cuándo | ¿Bloquea la operación? | Si el destino falla |
|---|---|---|---|---|
| Frontend → Gateway | `/api/*` | Toda petición del usuario | Sí | `502 SERVICE_UNAVAILABLE`; la interfaz muestra el error |
| Gateway → servicio | ruta sin `/api` | Toda petición | Sí | `502` con formato único de error |
| recursos → reservas | `PATCH /reservas/equipos/sync` | Crear, editar, cambiar estado o eliminar un recurso reservable | No | Se registra en log; el stock puede quedar desfasado |
| reservas → recursos *(E2-21)* | `GET /recursos/:codigo` | Crear una reserva de equipo | **Sí** | `503`; no se crea la reserva |
| solicitudes, reservas, eventos → notificaciones *(E2-32)* | endpoint interno de notificaciones | Cambio de estado, confirmación, inscripción | No | Se registra en log; la operación se completa |
| usuarios, solicitudes, reservas, recursos, eventos → búsqueda | `PUT /buscar/documento`, `DELETE /buscar/documento/:tipo/:id` | Crear, editar o eliminar algo indexable | No | Se registra en log; el índice se recupera con `backfill` |

**Autenticación entre servicios:** las llamadas internas llevan un *token de
servicio* firmado con el mismo `JWT_SECRET`, con 1 minuto de vigencia y sin
usuario real detrás (`id: 0`).

**Formato de error común (E2-01):** todos los servicios y el Gateway
responden los errores como
`{ "success": false, "error": { "code": "...", "message": "..." } }`.

---

## 7. Riesgos conocidos

| Riesgo | Impacto | Propuesta |
|---|---|---|
| Los endpoints internos de búsqueda (`PUT` y `DELETE /buscar/documento`) aceptan el token de **cualquier usuario**, y el Gateway los publica en `/api/buscar/documento`. | Un usuario autenticado podría insertar o borrar resultados del buscador. | Aceptar solo tokens de servicio (marcarlos con un campo `servicio`) o no exponer esas rutas en el Gateway. |
| El `JWT_SECRET` de los `.env.example` es un valor de relleno público. | Con él se pueden fabricar tokens válidos. | Generar uno nuevo antes de cualquier despliegue (ver `SEGURIDAD.md` de la rama de Maicol). |
| Sincronización de stock *fire-and-forget*. | Si reservas-service está caído durante un cambio de recurso, el stock queda desfasado. | Reintentos o una cola de mensajes (RabbitMQ), propuesto para el Entregable 3. |
| Comunicación síncrona HTTP en todas las integraciones. | Un servicio lento retrasa al que lo llama. | Timeouts explícitos en los clientes HTTP y mensajería asíncrona en el Entregable 3. |
