# Matriz de pruebas — Entregable 2

Ejecutada el 2026-10-23 15:59 (hora de Colombia) contra el sistema completo levantado en local (PostgreSQL 16, Gateway y 7 microservicios), con la colección `postman/UAJS-Smart-Campus.postman_collection.json` corrida en newman y una prueba de interfaz en navegador. Archivo generado por `pruebas/generar_matriz.py`.

**Resumen:** 71 peticiones y 156 verificaciones automáticas, **0 fallidas**. Matriz mínima de la guía: **15 de 15 pruebas pasan.**

## Matriz mínima (guía, sección 9.3)

| ID | Prueba | Datos de entrada | Resultado esperado | Resultado obtenido | Resultado | Evidencia |
|---|---|---|---|---|---|---|
| T01 | Listar recursos | GET /api/resources | 200 y colección JSON | GET /api/recursos → 200 | ✅ Pasa | postman/ · [T01] Listar recursos |
| T02 | Crear recurso válido | Nombre, código, tipo y estado válidos | 201; registro almacenado | POST /api/recursos → 201 | ✅ Pasa | postman/ · [T02] Crear recurso válido |
| T03 | Crear recurso incompleto | Omitir nombre o código | 400; no se almacena | POST /api/recursos → 400 | ✅ Pasa | postman/ · [T03] Crear recurso sin nombre |
| T04 | Consultar ID existente | ID válido | 200; datos correctos | GET /api/recursos/REC-032 → 200 | ✅ Pasa | postman/ · [T04] Consultar recurso existente |
| T05 | Consultar ID inexistente | ID que no existe | 404 controlado | GET /api/recursos/REC-999 → 404 | ✅ Pasa | postman/ · [T05] Consultar recurso inexistente |
| T06 | Actualizar recurso | Modificar ubicación o estado permitido | 200; cambio persistido | PATCH /api/recursos/REC-032 → 200 | ✅ Pasa | postman/ · [T06] Actualizar ubicación |
| T07 | Eliminar recurso | ID existente y sin conflicto de integridad | 204 o respuesta documentada | DELETE /api/recursos/REC-032 → 204 | ✅ Pasa | postman/ · [T07] Eliminar recurso |
| T08 | Crear solicitud | Descripción y tipo válidos | 201; estado inicial REGISTRADA | POST /api/solicitudes → 201 | ✅ Pasa | postman/ · [T08] Crear solicitud válida |
| T09 | Transición inválida | Intentar pasar de REGISTRADA a CERRADA | 400 o 409; estado no cambia | PATCH /api/solicitudes/SOL-0232/responder → 409 | ✅ Pasa | postman/ · [T09] Transición inválida Registrada → Cerrada |
| T10 | Crear reserva válida | Recurso y franja disponible | 201; reserva persistida | POST /api/reservas → 201 | ✅ Pasa | postman/ · [T10] Crear reserva válida |
| T11 | Reserva solapada | Mismo recurso y horario conflictivo | 409; no se crea reserva duplicada | POST /api/reservas → 409 | ✅ Pasa | postman/ · [T11] Reserva solapada en el mismo espacio |
| T12 | Persistencia tras reinicio | Crear registro, reiniciar servicios y consultar | El registro sigue disponible | Se creó el recurso, se reiniciaron el Gateway y los 7 servicios sin tocar la base, y la consulta lo devolvió: POST /api/recursos → 201; GET /api/recursos?nombre=Recurso%20persistente → 200 | ✅ Pasa | postman/ · [T12] Crear recurso para la prueba de persistencia · [T12] Consultar el recurso tras reiniciar |
| T13 | Integración UI–API | Crear desde React | La interfaz muestra la respuesta real del backend | Desde React: cambio de estado de solicitud con responsable (queda Asignada en la base), modificación de reserva con 409 visible en el modal y guardado exitoso, notificaciones y eventos con los datos reales. 8/8 verificaciones en navegador. | ✅ Pasa | evidencias/T13-*.png |
| T14 | Error de conexión | Detener temporalmente un servicio | La interfaz informa el error sin bloquearse | GET /api/eventos → 502; GET /api/recursos → 200. En la interfaz aparece el aviso de conexión y se puede seguir navegando. | ✅ Pasa | postman/ · [T14] Eventos con el servicio detenido · [T14] Los demás servicios siguen respondiendo · evidencias/T14-servicio-caido-interfaz.png |
| T15 | Health checks | GET /health de cada servicio | Respuesta de salud documentada | GET /health → 200 | ✅ Pasa | postman/ · [T15] Health agregado del Gateway |

Nota: la guía usa rutas en inglés de referencia (`/api/resources`); este proyecto usa sus equivalentes en español (`/api/recursos`), como permite la sección 7.

## Detalle de todos los casos


### 01 · Recursos (CRUD)

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T01] Listar recursos | `GET /api/recursos` | 200 | 2/2 | ✅ |
| [T02] Crear recurso válido | `POST /api/recursos` | 201 | 2/2 | ✅ |
| [T03] Crear recurso sin nombre | `POST /api/recursos` | 400 | 3/3 | ✅ |
| Crear recurso con tipo inválido | `POST /api/recursos` | 400 | 3/3 | ✅ |
| [T04] Consultar recurso existente | `GET /api/recursos/REC-032` | 200 | 2/2 | ✅ |
| [T05] Consultar recurso inexistente | `GET /api/recursos/REC-999` | 404 | 3/3 | ✅ |
| [T06] Actualizar ubicación | `PATCH /api/recursos/REC-032` | 200 | 2/2 | ✅ |
| Cambiar estado a uno inválido | `PATCH /api/recursos/REC-032/estado` | 400 | 3/3 | ✅ |
| Cambiar estado a En mantenimiento | `PATCH /api/recursos/REC-032/estado` | 200 | 2/2 | ✅ |
| [T07] Eliminar recurso | `DELETE /api/recursos/REC-032` | 204 | 1/1 | ✅ |
| Estudiante intenta crear recurso | `POST /api/recursos` | 403 | 3/3 | ✅ |

### 02 · Solicitudes (ciclo de vida)

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T08] Crear solicitud válida | `POST /api/solicitudes` | 201 | 2/2 | ✅ |
| Crear solicitud con tipo inválido | `POST /api/solicitudes` | 400 | 3/3 | ✅ |
| [T09] Transición inválida Registrada → Cerrada | `PATCH /api/solicitudes/SOL-0232/responder` | 409 | 3/3 | ✅ |
| Verificar que el estado no cambió | `GET /api/solicitudes/SOL-0232` | 200 | 2/2 | ✅ |
| Registrada → En revisión | `PATCH /api/solicitudes/SOL-0232/responder` | 200 | 1/1 | ✅ |
| En revisión → Asignada sin responsable | `PATCH /api/solicitudes/SOL-0232/responder` | 400 | 3/3 | ✅ |
| En revisión → Asignada con responsable | `PATCH /api/solicitudes/SOL-0232/responder` | 200 | 2/2 | ✅ |
| Retroceso Asignada → Registrada | `PATCH /api/solicitudes/SOL-0232/responder` | 409 | 3/3 | ✅ |
| Asignada → En proceso | `PATCH /api/solicitudes/SOL-0232/responder` | 200 | 1/1 | ✅ |
| En proceso → Resuelta | `PATCH /api/solicitudes/SOL-0232/responder` | 200 | 1/1 | ✅ |
| Resuelta → Cerrada | `PATCH /api/solicitudes/SOL-0232/responder` | 200 | 1/1 | ✅ |
| Detalle con historial completo | `GET /api/solicitudes/SOL-0232` | 200 | 2/2 | ✅ |
| Docente intenta ver la solicitud del estudiante | `GET /api/solicitudes/SOL-0232` | 403 | 3/3 | ✅ |
| Solicitud inexistente | `GET /api/solicitudes/SOL-9999` | 404 | 3/3 | ✅ |

### 03 · Reservas (reglas de negocio)

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T10] Crear reserva válida | `POST /api/reservas` | 201 | 2/2 | ✅ |
| [T11] Reserva solapada en el mismo espacio | `POST /api/reservas` | 409 | 3/3 | ✅ |
| Franja contigua sí se permite | `POST /api/reservas` | 201 | 1/1 | ✅ |
| Hora de fin antes del inicio | `POST /api/reservas` | 400 | 3/3 | ✅ |
| Fecha pasada | `POST /api/reservas` | 400 | 3/3 | ✅ |
| Espacio inexistente | `POST /api/reservas` | 400 | 3/3 | ✅ |
| Reserva de equipo (consulta recursos-service) | `POST /api/reservas` | 201 | 1/1 | ✅ |
| Modificar a una franja ocupada | `PATCH /api/reservas/RES-0131` | 409 | 3/3 | ✅ |
| Modificar a otra fecha libre | `PATCH /api/reservas/RES-0131` | 200 | 2/2 | ✅ |
| Otro usuario consulta la reserva | `GET /api/reservas/RES-0131` | 403 | 3/3 | ✅ |
| Confirmar reserva | `PATCH /api/reservas/RES-0131/estado` | 200 | 1/1 | ✅ |
| Confirmada → Pendiente (no permitido) | `PATCH /api/reservas/RES-0131/estado` | 409 | 3/3 | ✅ |
| Cancelar reserva | `PATCH /api/reservas/RES-0131/estado` | 200 | 1/1 | ✅ |
| Historial de la reserva | `GET /api/reservas/RES-0131/historial` | 200 | 2/2 | ✅ |

### 04 · Usuarios

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| Registro público con rol Administrador queda Estudiante | `POST /api/auth/register` | 201 | 2/2 | ✅ |
| Admin crea un Docente | `POST /api/usuarios` | 201 | 2/2 | ✅ |
| Admin crea con rol inválido | `POST /api/usuarios` | 400 | 3/3 | ✅ |
| Consultar usuario por ID | `GET /api/usuarios/6` | 200 | 1/1 | ✅ |
| Editar usuario | `PATCH /api/usuarios/6` | 200 | 2/2 | ✅ |
| Estudiante consulta otro usuario | `GET /api/usuarios/6` | 403 | 3/3 | ✅ |
| Eliminar usuario | `DELETE /api/usuarios/6` | 204 | 1/1 | ✅ |

### 05 · Eventos

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| Crear evento | `POST /api/eventos` | 201 | 1/1 | ✅ |
| Crear evento con hora de fin inválida | `POST /api/eventos` | 400 | 3/3 | ✅ |
| Consultar evento por ID | `GET /api/eventos/4` | 200 | 2/2 | ✅ |
| Editar evento | `PATCH /api/eventos/4` | 200 | 1/1 | ✅ |
| Estudiante se inscribe | `POST /api/eventos/4/inscribir` | 201 | 1/1 | ✅ |
| Inscripción duplicada | `POST /api/eventos/4/inscribir` | 409 | 2/2 | ✅ |
| Evento inexistente | `GET /api/eventos/99999` | 404 | 3/3 | ✅ |

### 06 · Notificaciones

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| Listar mis notificaciones | `GET /api/notificaciones` | 200 | 2/2 | ✅ |
| Consultar notificación propia | `GET /api/notificaciones/16` | 200 | 1/1 | ✅ |
| Otro usuario consulta la notificación | `GET /api/notificaciones/16` | 404 | 3/3 | ✅ |
| Marcar como leída | `PATCH /api/notificaciones/16/leida` | 200 | 2/2 | ✅ |
| Crear notificación sin título | `POST /api/notificaciones` | 400 | 3/3 | ✅ |
| Usuario normal en endpoint interno | `POST /api/notificaciones/interna` | 403 | 3/3 | ✅ |

### 07 · Errores y seguridad

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| Sin token | `GET /api/recursos` | 401 | 3/3 | ✅ |
| Token inválido | `GET /api/recursos` | 401 | 3/3 | ✅ |
| JSON mal formado | `POST /api/recursos` | 400 | 3/3 | ✅ |
| Ruta inexistente en el Gateway | `GET /api/no-existe` | 404 | 3/3 | ✅ |
| Ruta inexistente en un servicio | `PUT /api/recursos/REC-001/xyz` | 404 | 3/3 | ✅ |
| Usuario intenta indexar en el buscador | `PUT /api/buscar/documento` | 403 | 3/3 | ✅ |
| Búsqueda global | `GET /api/buscar?q=Feria` | 200 | 1/1 | ✅ |

### 08 · Health checks

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T15] Health agregado del Gateway | `GET /health` | 200 | 2/2 | ✅ |

### 09 · Persistencia (antes de reiniciar)

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T12] Crear recurso para la prueba de persistencia | `POST /api/recursos` | 201 | 1/1 | ✅ |

### 10 · Persistencia (después de reiniciar)

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T12] Consultar el recurso tras reiniciar | `GET /api/recursos?nombre=Recurso%20persistente` | 200 | 2/2 | ✅ |

### 11 · Servicio caído

| Caso | Petición | HTTP | Verificaciones | Resultado |
|---|---|---|---|---|
| [T14] Eventos con el servicio detenido | `GET /api/eventos` | 502 | 3/3 | ✅ |
| [T14] Los demás servicios siguen respondiendo | `GET /api/recursos` | 200 | 1/1 | ✅ |

## Observaciones y defectos encontrados

| # | Observación | Severidad | Estado |
|---|---|---|---|
| D1 | Un estado inválido en `PATCH /recursos/:codigo/estado` tumbaba recursos-service (promesa sin manejar en Express 4). | Alta | Corregido en E2-01 (PR #11) |
| D2 | `POST /auth/register` permitía registrarse como "Administrador del sistema". | Alta | Corregido en E2-10 |
| D3 | Un estudiante podía ver solicitudes ajenas por ID y una solicitud podía saltar de Registrada a Cerrada. | Alta | Corregido en E2-12 y E2-13 |
| D4 | Se aceptaban reservas solapadas y con hora de fin anterior a la de inicio. | Alta | Corregido en E2-20 |
| D5 | Cualquier usuario podía insertar o borrar documentos del índice de búsqueda vía `/api/buscar/documento`. | Media | Corregido en E2-33 |
| D6 | El aviso de conexión del frontend es genérico ("No se pudo conectar con el servidor") aunque solo esté caído un servicio, y menciona una carpeta `server` que ya no existe. | Baja | Abierto (frontend) |
| D7 | Los datos de prueba no coinciden entre servicios: reservas muestra 4 unidades del Videobeam Epson X400 y recursos solo tiene 1 registrada. | Baja | Abierto (datos semilla) |
