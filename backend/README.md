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

# 2) Instalar dependencias de gateway + los servicios (workspaces de npm)
npm install

# 2b) Crear los .env de cada componente desde su .env.example (solo los que falten)
npm run setup:env

# 3) Levantar gateway + los 7 servicios a la vez
npm run dev
```

Cada servicio crea sus tablas y siembra sus datos iniciales automáticamente la primera vez que arranca. Si prefieres hacerlo con scripts SQL explícitos, usa [`../database/schema.sql`](../database/schema.sql) y [`../database/seed.sql`](../database/seed.sql) (ver [`../database/README.md`](../database/README.md)).

**Usuarios de prueba** (contraseña para todos: `uajs2026`):
| Correo | Rol |
|---|---|
| `camilo.ramirez@uajs.edu.co` | Estudiante |
| `laura.perez@uajs.edu.co` | Docente |
| `andres.gomez@uajs.edu.co` | Administrativo |
| `admin@uajs.edu.co` | Administrador del sistema |

## API REST

Todo el tráfico del frontend entra por el **API Gateway** (`http://localhost:4000/api`), que reenvía cada prefijo al microservicio dueño del dominio. Los ejemplos de cuerpos de petición y respuesta de cada endpoint están en la colección Postman de [`../postman/`](../postman) (111 peticiones con 189 aserciones listas para ejecutar).

### Convenciones (iguales en todos los servicios)

- **Autenticación:** `Authorization: Bearer <JWT>`. Cada servicio valida el token por su cuenta; el Gateway no valida nada.
- **`PUT`** reemplaza los campos editables de un registro (se envía el registro completo editable). **`PATCH`** ejecuta una acción o un cambio parcial (estado, respuesta, asignación, marcar como leída). Los `PATCH /:id` de recursos y eventos se conservan como alias de `PUT` por compatibilidad con el frontend.
- **Códigos HTTP:** `200` consulta/actualización, `201` creación, `204` eliminación, `400` datos inválidos, `401` sin sesión, `403` sin permiso, `404` no existe, `409` conflicto con el estado actual (transición no permitida, solapamiento, duplicado), `502/503` dependencia caída.
- **Respuestas exitosas:** el recurso (o la lista) directamente como JSON, sin envoltorio. Los `DELETE` responden `204` sin cuerpo.
- **Errores:** siempre la misma forma, sin trazas ni datos internos:

```json
{
  "error": "Transicion no permitida para la solicitud: \"Registrada\" -> \"Cerrada\". Desde \"Registrada\" solo se puede pasar a: En revisión.",
  "codigo": "TRANSICION_INVALIDA",
  "detalles": [ { "campo": "estado", "actual": "Registrada", "solicitado": "Cerrada", "permitidas": ["En revisión"] } ]
}
```

| HTTP | Código | Cuándo |
|---|---|---|
| 400 | `VALIDACION` | Dato faltante o inválido. `detalles` lista cada campo. |
| 400 | `JSON_INVALIDO` | El cuerpo no es JSON válido. |
| 400 | `FECHA_INVALIDA / RANGO_HORARIO_INVALIDO / RECURSO_INEXISTENTE / USUARIO_INEXISTENTE` | Regla de negocio sobre los datos enviados. |
| 401 | `NO_AUTENTICADO / TOKEN_INVALIDO / CREDENCIALES_INVALIDAS` | Sin sesión, token vencido o credenciales erróneas. |
| 403 | `PROHIBIDO / USUARIO_INACTIVO` | El rol no tiene permiso o el usuario está desactivado. |
| 404 | `NO_ENCONTRADO / RUTA_NO_ENCONTRADA` | El registro o la ruta no existen. |
| 409 | `TRANSICION_INVALIDA` | Cambio de estado no permitido (el estado no cambia). |
| 409 | `RESERVA_SOLAPADA / SIN_DISPONIBILIDAD / SIN_STOCK` | Conflicto de horario o de unidades. |
| 409 | `CORREO_DUPLICADO / CODIGO_DUPLICADO / YA_INSCRITO / DUPLICADO` | Registro repetido. |
| 409 | `CUPO_AGOTADO / CUPO_INFERIOR_A_INSCRITOS / EVENTO_NO_DISPONIBLE` | Reglas de cupo e inscripción. |
| 409 | `RECURSO_EN_USO / ULTIMO_ADMINISTRADOR / AUTOELIMINACION / SOLICITUD_CERRADA / RESERVA_FINALIZADA` | Regla de integridad (no se puede borrar o modificar). |
| 413 | `PAYLOAD_GRANDE` | Cuerpo de petición demasiado grande. |
| 502 | `SERVICIO_NO_DISPONIBLE` | El Gateway no logra comunicarse con el microservicio. |
| 503 | `SERVICIO_NO_DISPONIBLE / BASE_DE_DATOS_NO_DISPONIBLE` | Un servicio del que depende la operación (o su base) no responde; no se guarda nada a medias. |
| 500 | `ERROR_INTERNO` | Error inesperado (sin trazas ni datos internos en la respuesta). |

### Catálogo de endpoints

### Usuarios y autenticación  `usuarios-service :4001`

Cuentas, roles, permisos por módulo y emisión de JWT. Contraseñas con bcrypt; nunca se devuelve `passwordHash`.

**Reglas de negocio y validaciones**

- El correo debe ser único y del dominio `@uajs.edu.co`.
- Roles permitidos: Estudiante, Docente, Administrativo, Administrador del sistema.
- Contraseña de al menos 6 caracteres (se guarda solo el hash bcrypt).
- No se puede eliminar, degradar ni desactivar al único Administrador activo (`ULTIMO_ADMINISTRADOR`).
- No existe registro público: las cuentas las crea el Administrador.

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Inicia sesión <br>Cuerpo: `{ correo, password }` | 200 { token, usuario } | 400 VALIDACION<br>401 CREDENCIALES_INVALIDAS |
| `GET` | `/api/auth/me` | Autenticado | Perfil del usuario autenticado | 200 usuario | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `POST` | `/api/auth/register` | Solo Admin | Crea una cuenta (formulario completo de la pantalla Usuarios) <br>Cuerpo: `{ nombre, correo, password, rol, programa?, …registro institucional }` | 201 { usuario } | 400 VALIDACION<br>409 CONFLICTO (correo repetido)<br>403 PROHIBIDO |
| `PATCH` | `/api/auth/perfil` | Autenticado | Edita datos de contacto del propio perfil <br>Cuerpo: `{ telefono?, direccion?, fechaNacimiento?, fotoPerfil?, contactoEmergencia* }` | 200 usuario | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `PATCH` | `/api/auth/correo-recuperacion` | Autenticado | Define el correo de recuperación <br>Cuerpo: `{ correoRecuperacion }` | 200 usuario | 400 VALIDACION |
| `POST` | `/api/auth/forgot-password` | Público | Solicita enlace de restablecimiento (respuesta igual exista o no el correo) <br>Cuerpo: `{ correo }` | 200 { mensaje } | 400 VALIDACION |
| `POST` | `/api/auth/reset-password` | Público | Restablece la contraseña con el token recibido <br>Cuerpo: `{ token, nuevaPassword }` | 200 { mensaje } | 400 enlace inválido o expirado |
| `GET` | `/api/usuarios` <br>`?rol, ?q, ?activo` | Solo Admin | Lista usuarios | 200 [usuario] | 403 PROHIBIDO |
| `POST` | `/api/usuarios` | Solo Admin | Crea un usuario <br>Cuerpo: `{ nombre, correo, password, rol, programa? }` | 201 usuario | 400 VALIDACION<br>409 CORREO_DUPLICADO |
| `GET` | `/api/usuarios/responsables` | Autenticado | Docentes y Administrativos activos (selector "Asignado a") | 200 [usuario] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `GET` | `/api/usuarios/:id` | Autenticado | Consulta un usuario (Admin o el propio usuario) | 200 usuario | 400 id inválido<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `PUT` | `/api/usuarios/:id` | Solo Admin | Reemplaza nombre, correo, rol, programa y activo <br>Cuerpo: `{ nombre, correo, rol, programa?, activo? }` | 200 usuario | 400 VALIDACION<br>409 CORREO_DUPLICADO / ULTIMO_ADMINISTRADOR<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/usuarios/:id/estado` | Solo Admin | Activa o desactiva (alterna) | 200 usuario | 409 ULTIMO_ADMINISTRADOR<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/usuarios/:id/rol` | Solo Admin | Cambia el rol <br>Cuerpo: `{ rol }` | 200 usuario | 400 VALIDACION<br>409 ULTIMO_ADMINISTRADOR<br>404 NO_ENCONTRADO |
| `DELETE` | `/api/usuarios/:id` | Solo Admin | Elimina el usuario | 204 | 409 AUTOELIMINACION / ULTIMO_ADMINISTRADOR<br>404 NO_ENCONTRADO |
| `GET` | `/api/permisos` | Autenticado | Módulos activos por rol | 200 { rol: [módulos] } | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `PATCH` | `/api/permisos/:rol` | Solo Admin | Activa/desactiva un módulo para un rol <br>Cuerpo: `{ moduloId }` | 200 { rol, modulosActivos } | 400 VALIDACION |

### Solicitudes  `solicitudes-service :4002`

Solicitudes académicas/administrativas con ciclo de vida controlado e historial de estados.

**Reglas de negocio y validaciones**

- Estado inicial siempre `Registrada`; el id (`SOL-####`) lo genera el backend.
- Ciclo: Registrada → En revisión → Asignada → En proceso → Resuelta → Cerrada. Cualquier otro salto responde `409 TRANSICION_INVALIDA` y el estado no cambia.
- Única transición hacia atrás: Resuelta → En proceso (reapertura). Cerrada es final.
- Condiciones: al pasar a Asignada debe quedar un responsable (por defecto, la dependencia); Resuelta y Cerrada exigen una respuesta registrada.
- Prioridad: Baja, Media o Alta. Descripción de 10 a 2000 caracteres.
- El solicitante solo ve y edita sus solicitudes (y solo en `Registrada`); el personal ve todas.

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/solicitudes` <br>`?estado, ?prioridad, ?q` | Autenticado | Lista (propias o todas según rol) | 200 [solicitud] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `GET` | `/api/solicitudes/:id` | Autenticado | Detalle con historial | 200 { …solicitud, historial } | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `GET` | `/api/solicitudes/:id/historial` | Autenticado | Historial de estados | 200 [{ estado, fecha, por }] | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `POST` | `/api/solicitudes` | Estudiante / Docente | Registra una solicitud <br>Cuerpo: `{ tipo, dependencia, descripcion, prioridad? }` | 201 solicitud (estado Registrada) | 400 VALIDACION<br>403 (Administrativo no registra) |
| `PUT` | `/api/solicitudes/:id` | Autenticado | Reemplaza tipo, dependencia, prioridad y descripción (no toca estado) <br>Cuerpo: `{ tipo, dependencia, prioridad, descripcion }` | 200 solicitud | 400 VALIDACION<br>403 PROHIBIDO<br>409 SOLICITUD_CERRADA<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/solicitudes/:id/responder` | Administrativo / Admin | Responde y/o cambia el estado (alias: `/estado`) <br>Cuerpo: `{ nuevoEstado \| estado, respuesta?, adjunto?, asignadoA? }` | 200 solicitud | 400 VALIDACION<br>409 TRANSICION_INVALIDA<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `DELETE` | `/api/solicitudes/:id` | Autenticado | Elimina (dueño solo en Registrada; personal siempre) | 204 | 403 PROHIBIDO<br>404 NO_ENCONTRADO |

### PQRS  `solicitudes-service :4002`

Peticiones, quejas, reclamos y sugerencias. Comparte servicio con las solicitudes.

**Reglas de negocio y validaciones**

- Tipos: Petición, Queja, Reclamo, Sugerencia.
- Estados: Registrada → En gestión → Resuelta (Registrada puede resolverse directo; Resuelta puede reabrirse a En gestión).
- Asignar a alguien pone en gestión una PQRS recién registrada; el responsable se valida contra usuarios-service.
- Responder exige una respuesta; la pueden dar el personal o el docente asignado.

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/pqrs` <br>`?estado, ?tipo` | Autenticado | Lista (Estudiante: las suyas; Docente: las asignadas; staff: todas) | 200 [pqrs] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `GET` | `/api/pqrs/:id` | Autenticado | Detalle con historial | 200 { …pqrs, historial } | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `POST` | `/api/pqrs` | Autenticado | Radica una PQRS <br>Cuerpo: `{ tipo, dirigidoA, asunto, descripcion, adjunto? }` | 201 pqrs | 400 VALIDACION |
| `PUT` | `/api/pqrs/:id` | Autenticado | Reemplaza los datos editables (dueño solo en Registrada) <br>Cuerpo: `{ tipo, dirigidoA, asunto, descripcion, adjunto? }` | 200 pqrs | 400 VALIDACION<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/pqrs/:id/asignar` | Administrativo / Admin | Asigna responsable <br>Cuerpo: `{ asignadoA }` | 200 pqrs | 400 VALIDACION (responsable inexistente)<br>404 NO_ENCONTRADO<br>503 SERVICIO_NO_DISPONIBLE |
| `PATCH` | `/api/pqrs/:id/responder` | Autenticado | Responde (staff o docente asignado) <br>Cuerpo: `{ respuesta, estado?, adjunto? }` | 200 pqrs | 400 VALIDACION<br>409 TRANSICION_INVALIDA<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `GET` | `/api/pqrs/:id/historial` | Autenticado | Historial de estados | 200 [{ estado, fecha, por }] | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `DELETE` | `/api/pqrs/:id` | Autenticado | Elimina (dueño solo en Registrada; personal siempre) | 204 | 403 PROHIBIDO<br>404 NO_ENCONTRADO |

### Reservas  `reservas-service :4003`

Reservas de espacios (salones, salas) y equipos, con detección de solapamientos.

**Reglas de negocio y validaciones**

- El espacio o equipo debe existir en el catálogo; el usuario debe existir y estar activo (consulta a usuarios-service; si no responde → `503` y no se crea nada).
- Fecha válida y no pasada; `horaFin` posterior a `horaInicio` (formato HH:MM).
- Solapamiento: no se acepta una reserva que se cruce con otra activa (Pendiente o Confirmada) del mismo espacio y fecha → `409 RESERVA_SOLAPADA`. Franjas contiguas (10:00 y 10:00) no se cruzan.
- La verificación y la creación son atómicas (transacción + bloqueo de PostgreSQL): 5 peticiones simultáneas crean solo una.
- Equipos: confirmar descuenta una unidad de stock; cancelar o denegar la repone.
- Estados: Pendiente → Confirmada / Denegada / Cancelada; Confirmada → Cancelada. Denegada y Cancelada son finales y liberan el horario.

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/reservas/catalogo` | Autenticado | Pabellones con salones, salas especiales, salas de biblioteca y equipos (con stock) | 200 { pabellones, salasEspeciales, salasBiblioteca, equipos } | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `GET` | `/api/reservas/disponibilidad` <br>`?espacio=…&fecha=AAAA-MM-DD` | Autenticado | Franjas ocupadas de un espacio en una fecha | 200 { espacio, fecha, ocupadas } | 400 VALIDACION |
| `GET` | `/api/reservas` <br>`?estado, ?fecha, ?espacio` | Autenticado | Lista (propias o todas según rol) | 200 [reserva] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `POST` | `/api/reservas` | Autenticado | Crea una reserva (estado Pendiente) <br>Cuerpo: `{ tipoEspacio: "espacio"\|"equipo", espacio, fecha, horaInicio, horaFin, motivo }` | 201 reserva | 400 VALIDACION (FECHA_INVALIDA, RANGO_HORARIO_INVALIDO, RECURSO_INEXISTENTE)<br>409 RESERVA_SOLAPADA / SIN_DISPONIBILIDAD<br>503 SERVICIO_NO_DISPONIBLE |
| `GET` | `/api/reservas/:id` | Autenticado | Detalle con historial | 200 { …reserva, historial } | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `PUT` | `/api/reservas/:id` | Autenticado | Modifica fecha, horario, motivo y espacio (dueño solo en Pendiente); revalida solapamientos <br>Cuerpo: `{ espacio, fecha, horaInicio, horaFin, motivo }` | 200 reserva | 400 VALIDACION<br>409 RESERVA_SOLAPADA / RESERVA_FINALIZADA<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/reservas/:id/estado` | Administrativo / Admin | Cambia el estado <br>Cuerpo: `{ estado }` | 200 reserva | 400 VALIDACION<br>409 TRANSICION_INVALIDA<br>409 SIN_STOCK<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/reservas/:id/cancelar` | Autenticado | El solicitante (o el personal) cancela una reserva activa | 200 reserva (Cancelada) | 409 TRANSICION_INVALIDA<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `GET` | `/api/reservas/:id/historial` | Autenticado | Historial de estados | 200 [{ estado, fecha, por }] | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `DELETE` | `/api/reservas/:id` | Autenticado | Elimina (dueño solo en Pendiente; personal siempre) | 204 | 403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `GET` | `/api/reservas/equipos/uso` <br>`?nombre=…` | Administrativo / Admin | Reservas activas de un equipo (lo consulta recursos-service) | 200 { nombre, activas } | 400 VALIDACION |
| `PATCH` | `/api/reservas/equipos/sync` | Interno (servicio a servicio) | Sincroniza el stock de equipos (solo recursos-service) <br>Cuerpo: `{ codigo, nombre, tipo, delta, eliminarSiVacio? }` | 200 equipo | 400 VALIDACION<br>403 PROHIBIDO |

### Recursos  `recursos-service :4004`

Catálogo de recursos físicos y tecnológicos con historial de estados.

**Reglas de negocio y validaciones**

- Código `REC-###` generado por el backend (opcionalmente se puede enviar uno con ese formato; si ya existe → `409 CODIGO_DUPLICADO`).
- Tipo: Audiovisual, Equipo de cómputo, Mobiliario, Instrumento de laboratorio u Otro. Estado: Disponible, En mantenimiento o Fuera de servicio.
- Los recursos Audiovisual / Equipo de cómputo Disponibles aportan stock reservable en reservas-service (sincronización automática).
- No se puede eliminar un equipo del que dependen reservas activas → `409 RECURSO_EN_USO` (consulta a reservas-service; si no responde → `503`).

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/recursos` <br>`?tipo, ?estado, ?q` | Autenticado | Lista recursos | 200 [recurso] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `POST` | `/api/recursos` | Administrativo / Admin | Crea un recurso <br>Cuerpo: `{ nombre, tipo, ubicacion, descripcion?, estado?, codigo? }` | 201 recurso | 400 VALIDACION<br>409 CODIGO_DUPLICADO<br>403 PROHIBIDO |
| `GET` | `/api/recursos/:codigo` | Autenticado | Consulta un recurso | 200 recurso | 404 NO_ENCONTRADO |
| `PUT` | `/api/recursos/:codigo` | Administrativo / Admin | Reemplaza nombre, tipo, ubicación, descripción (y estado si se envía). `PATCH` es alias <br>Cuerpo: `{ nombre, tipo, ubicacion, descripcion?, estado? }` | 200 recurso | 400 VALIDACION<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/recursos/:codigo/estado` | Administrativo / Admin | Cambia el estado <br>Cuerpo: `{ estado }` | 200 recurso | 400 VALIDACION<br>404 NO_ENCONTRADO |
| `GET` | `/api/recursos/:codigo/historial` | Administrativo / Admin | Historial de estados | 200 [{ estado, fecha, por }] | 404 NO_ENCONTRADO |
| `DELETE` | `/api/recursos/:codigo` | Administrativo / Admin | Elimina el recurso | 204 | 409 RECURSO_EN_USO<br>503 SERVICIO_NO_DISPONIBLE<br>404 NO_ENCONTRADO |

### Eventos  `eventos-service :4005`

Eventos y actividades institucionales con inscripción y cupo.

**Reglas de negocio y validaciones**

- Obligatorios: título, fecha válida, hora (HH:MM), lugar, ponente y facultad. `horaFin` es opcional pero, si existe, debe ser posterior a `hora`.
- Estados: Activo, Inactivo (borrador, solo lo ve el personal) y Cancelado.
- Inscripción solo en eventos Activos; una persona no se inscribe dos veces (`YA_INSCRITO`); el cupo se respeta incluso con peticiones simultáneas (`CUPO_AGOTADO`).
- El cupo no puede bajarse por debajo del número de inscritos (`CUPO_INFERIOR_A_INSCRITOS`).
- Eliminar un evento elimina también sus inscripciones (alternativa: marcarlo Cancelado).

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/eventos` <br>`?estado, ?facultad, ?q` | Autenticado | Lista con `inscrito` e `inscritosCount` | 200 [evento] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `POST` | `/api/eventos` | Administrativo / Admin | Crea un evento <br>Cuerpo: `{ titulo, fecha, hora, horaFin?, lugar, ponente, facultad, descripcion?, cupoMaximo?, estado? }` | 201 evento | 400 VALIDACION (RANGO_HORARIO_INVALIDO)<br>403 PROHIBIDO |
| `GET` | `/api/eventos/:id` | Autenticado | Consulta un evento | 200 evento | 400 id inválido<br>404 NO_ENCONTRADO |
| `PUT` | `/api/eventos/:id` | Administrativo / Admin | Reemplaza los datos del evento. `PATCH` es alias <br>Cuerpo: `igual que POST` | 200 evento | 400 VALIDACION<br>409 CUPO_INFERIOR_A_INSCRITOS<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/eventos/:id/estado` | Administrativo / Admin | Cambia el estado <br>Cuerpo: `{ estado }` | 200 evento | 400 VALIDACION<br>404 NO_ENCONTRADO |
| `GET` | `/api/eventos/:id/inscritos` | Administrativo / Admin | Lista de inscritos | 200 [inscripcion] | 404 NO_ENCONTRADO |
| `POST` | `/api/eventos/:id/inscribir` | Estudiante / Docente | Inscribe al usuario autenticado | 201 inscripcion | 409 YA_INSCRITO / CUPO_AGOTADO / EVENTO_NO_DISPONIBLE<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `DELETE` | `/api/eventos/:id/inscripcion` | Estudiante / Docente | Cancela la propia inscripción | 204 | 404 NO_ENCONTRADO |
| `DELETE` | `/api/eventos/:id` | Administrativo / Admin | Elimina el evento y sus inscripciones | 204 | 404 NO_ENCONTRADO |

### Notificaciones  `notificaciones-service :4006`

Avisos por usuario con estado de lectura.

**Reglas de negocio y validaciones**

- Categoría y mensaje (3 a 255 caracteres) obligatorios; título opcional (por defecto, la categoría); entidad y entidadId opcionales para enlazar con el registro que la originó.
- Cada usuario ve solo sus notificaciones (el Administrador puede consultar cualquiera).
- Notificar a otro usuario: solo Docente, Administrativo y Administrador, y el destinatario debe existir y estar activo (usuarios-service).
- Lectura representada con el booleano `leida`; marcar como leída es idempotente.

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/notificaciones` <br>`?leida=true\|false, ?categoria` | Autenticado | Lista las propias | 200 [notificacion] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `POST` | `/api/notificaciones` | Autenticado | Crea una notificación (propia o, con permiso, para otro usuario) <br>Cuerpo: `{ categoria, mensaje, titulo?, usuarioId?, entidad?, entidadId? }` | 201 notificacion | 400 VALIDACION<br>403 PROHIBIDO<br>400 USUARIO_INEXISTENTE<br>503 SERVICIO_NO_DISPONIBLE |
| `GET` | `/api/notificaciones/:id` | Autenticado | Consulta una notificación propia | 200 notificacion | 400 id inválido<br>404 NO_ENCONTRADO |
| `PUT` | `/api/notificaciones/:id` | Solo Admin | Corrige categoría, título, mensaje y lectura <br>Cuerpo: `{ categoria, mensaje, titulo?, leida? }` | 200 notificacion | 400 VALIDACION<br>403 PROHIBIDO<br>404 NO_ENCONTRADO |
| `PATCH` | `/api/notificaciones/:id/leida` | Autenticado | Marca como leída (o `{ "leida": false }` para revertir) | 200 notificacion | 404 NO_ENCONTRADO |
| `PATCH` | `/api/notificaciones/marcar-todas` | Autenticado | Marca todas las propias como leídas | 200 { ok, actualizadas } | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `DELETE` | `/api/notificaciones/:id` | Autenticado | Elimina una propia | 204 | 404 NO_ENCONTRADO |

### Búsqueda y salud  `busqueda-service :4007 / API Gateway :4000`

Búsqueda de texto completo (Elasticsearch) y verificación de salud.

**Reglas de negocio y validaciones**

- Los resultados se filtran según lo que el rol del usuario ya puede ver en cada módulo.

| Método | Ruta | Quién | Descripción | Respuesta | Errores |
|---|---|---|---|---|---|
| `GET` | `/api/buscar` <br>`?q=texto` | Autenticado | Búsqueda de texto completo | 200 [resultado] | 401 NO_AUTENTICADO / TOKEN_INVALIDO |
| `GET` | `/health` | Público | Gateway: salud agregada de los 7 microservicios (200 ok / 503 degradado). Cada servicio expone además su propio `/health` | 200 { status, microservicios } | 503 { status: "degradado" } |

## Integración entre servicios

Los servicios se comunican por **HTTP síncrono** a través de la API pública del servicio dueño del dato (nunca leyendo sus tablas), con un token de servicio de un minuto firmado con el `JWT_SECRET` compartido. Si el servicio consultado no responde, la operación falla con `503` y **no se guarda nada inconsistente**.

| Quién llama | A quién | Para qué | Si falla |
|---|---|---|---|
| reservas-service | usuarios-service `GET /usuarios/:id` | Comprobar que el usuario existe y está activo antes de reservar | `503`, no se crea la reserva |
| notificaciones-service | usuarios-service `GET /usuarios/:id` | Validar al destinatario de una notificación ajena | `503`, no se crea |
| solicitudes-service | usuarios-service `GET /usuarios/responsables` | Validar el responsable al asignar una PQRS o solicitud | `503`, no se asigna |
| recursos-service | reservas-service `PATCH /reservas/equipos/sync` | Mantener el stock reservable al crear/editar/eliminar recursos | Se registra el error; la operación sobre el recurso continúa |
| recursos-service | reservas-service `GET /reservas/equipos/uso` | No eliminar un equipo con reservas activas | `503`, no se elimina |
| todos los dominios | busqueda-service `PUT/DELETE /buscar/documento` | Indexar en Elasticsearch | Se registra el error; la operación principal continúa |

## Pruebas

### Pruebas automáticas de API (82 pruebas)

Golpean el Gateway real, así que primero levanta la base de datos y los servicios:

```bash
cd backend
npm run db:up
npm run dev          # en una terminal
npm test             # en otra: 82 pruebas, ~13 s
```

Usan el ejecutor nativo de Node (`node --test`), sin dependencias nuevas. Cubren CRUD, validaciones, permisos por rol, transiciones de estado, solapamiento de reservas (incluida una carrera de 5 peticiones simultáneas), integridad entre servicios y health checks. Cada prueba limpia los datos que crea.

### Colección Postman

Importa `postman/UAJS-Smart-Campus.postman_collection.json` y `postman/UAJS-Local.postman_environment.json`, y ejecuta la colección completa con el Runner (o con Newman: `npx newman run postman/UAJS-Smart-Campus.postman_collection.json -e postman/UAJS-Local.postman_environment.json`). La carpeta `00` inicia sesión y guarda los tokens que usan las demás.

### Pruebas manuales de resiliencia (T12 y T14)

```bash
node tests/manual/resiliencia.mjs   # solo Windows: crea datos, reinicia un servicio y detiene otro
```

Comprueba que los datos persisten tras reiniciar un servicio (T12) y que, con un servicio caído, el Gateway responde `502`/`503` controlado sin crear datos inconsistentes (T14).

## Seguridad básica

- **Datos ficticios** únicamente; sin información real de estudiantes, docentes ni funcionarios.
- **Secretos fuera del código:** `JWT_SECRET`, cadenas de conexión y credenciales viven en `.env` (ignorados por Git); el repositorio solo trae `.env.example`. `npm run setup:env` crea los `.env` que falten.
- **Contraseñas** con bcrypt (10 rondas); nunca se devuelven en las respuestas (`passwordHash`, tokens de restablecimiento).
- **Consultas parametrizadas** (Sequelize) en todo acceso a datos; hay una prueba de inyección SQL en el login.
- **Validación en el backend** de cada campo recibido, con rechazo de campos no declarados (no hay *mass assignment*).
- **CORS** limitado al origen del frontend (`FRONTEND_ORIGIN`, por defecto `http://localhost:5183`).
- **Permisos por rol** en cada endpoint; el registro de cuentas es solo del Administrador.

## Base de datos

PostgreSQL con una base por microservicio. Scripts de creación y datos de prueba, propiedad de los datos y reglas de integridad en [`../database/README.md`](../database/README.md). La referencia de todas las variables de entorno está en [`../.env.example`](../.env.example).

## Verificación rápida (curl)

```bash
# 1. Login → token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"andres.gomez@uajs.edu.co","password":"uajs2026"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# 2. Listar recursos y solicitudes (requiere token)
curl -s http://localhost:4000/api/recursos -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/solicitudes -H "Authorization: Bearer $TOKEN"

# 3. Mover una solicitud al siguiente estado válido (con los datos del seed, SOL-0231 está "En revisión")
curl -s -X PATCH http://localhost:4000/api/solicitudes/SOL-0231/estado \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"estado":"Asignada"}'

# 4. Intentar un salto no permitido: responde 409 TRANSICION_INVALIDA y no cambia nada
curl -s -X PATCH http://localhost:4000/api/solicitudes/SOL-0231/estado \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"estado":"Cerrada"}'

# 5. Catálogo de reservas, eventos y notificaciones
curl -s http://localhost:4000/api/reservas/catalogo -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/eventos -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/notificaciones -H "Authorization: Bearer $TOKEN"

# 6. Búsqueda de texto completo (Elasticsearch)
curl -s "http://localhost:4000/api/buscar?q=certificado" -H "Authorization: Bearer $TOKEN"
```

Cada `GET /health` (p. ej. `http://localhost:4001/health`) confirma que un servicio individual está arriba; `http://localhost:4000/health` resume los 7.

## Solución de problemas comunes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `No se pudo iniciar: ECONNREFUSED 5432` al arrancar un servicio | PostgreSQL no está corriendo | Abre Docker Desktop y ejecuta `npm run db:up` |
| `database "uajs_xxx" does not exist` | El volumen de Postgres se creó antes de `db/init.sql` | Crea las bases con `database/schema.sql` (ver `database/README.md`) |
| El Gateway responde `502` / el banner dice "algunos servicios no están respondiendo" | Un microservicio se cayó o aún está arrancando | Revisa su consola; el `/health` del Gateway indica cuál |
| `401 Token invalido` en todas las peticiones | `JWT_SECRET` distinto entre servicios | Debe ser idéntico en todos los `.env` (usa `npm run setup:env`) |
| `npm test` falla en el login | Servicios sin levantar o datos de prueba borrados | Levanta `npm run dev` y verifica los usuarios de prueba |
| Elasticsearch tarda o se cae | Poca RAM libre | Dale margen a Docker Desktop; la búsqueda es la única función afectada |

## Apagar

```bash
npm run db:down   # detiene y borra el contenedor (el volumen de datos persiste)
```

## Frontend

El frontend React (carpeta `frontend/`) ya está conectado a este backend: sus clientes HTTP viven en `src/services/` y llaman al Gateway a través de `src/api/client.js`, usando la URL de `frontend/.env` (`VITE_API_URL=http://localhost:4000/api`). Para probar todo junto:

```bash
# Terminal 1
cd backend && npm run db:up && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Inicia sesión con cualquiera de los usuarios de prueba de la tabla de arriba (contraseña `uajs2026`).

Temas de "profundización" del PDF que quedaron fuera intencionalmente (no son requisito base): un broker de mensajes (RabbitMQ) para notificaciones entre servicios, y Redis para caché.
