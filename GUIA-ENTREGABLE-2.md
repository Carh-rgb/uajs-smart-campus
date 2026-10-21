# Guía de trabajo — Entregable 2 (Persistencia, CRUD e integración)

Reparto de lo que falta para cumplir la guía del Entregable 2, sacado de
contrastar el código de `develop` con cada fase del documento de la docente.
**No hay que rehacer nada del Entregable 1**: el CRUD básico, el Gateway y la
conexión del frontend con la API ya funcionan. Lo que falta son reglas de
negocio, validaciones, consultas por ID, scripts de base de datos, pruebas y
documentación.

**Entrega a la docente: sábado 24 de octubre.** Las fechas de cada tarea dejan
el sábado en la mañana para revisar y armar el ZIP. Cada tarea ya está creada en
ClickUp (lista del espacio SISTEMAS DISTRIBUIDOS, etiqueta `entregable 2`) con su
responsable y criterio de aceptación; el enlace está en la columna ID.

## Reglas para todos

1. **Antes de crear tu rama, actualiza `develop`** (`git checkout develop && git pull`)
   y espera a que esté mezclado el PR de la base de errores (tarea E2-01). Todo lo
   demás se construye encima de eso.
2. Rama propia: `feature/<tu-nombre>-e2-<tema>` (ej. `feature/simon-e2-reservas`).
3. Commits con el ID de la tarea de ClickUp entre corchetes:
   `feat(reservas): rechaza reservas solapadas con 409 [17tjyy3mx8q]`
   (el ID es lo que va después de `/t/` en el enlace de tu tarea). Al empezar una
   tarea pásala a *in development*; al abrir el PR, a *in review*.
4. Mínimos de la rúbrica **por persona**: 3 tareas en ClickUp, 5 commits con
   contenido real, rama propia, 2 Pull Requests a `develop`, una evidencia por
   tarea cerrada y un aporte a la documentación.
5. Otra persona revisa el PR antes de mezclarlo.
6. Errores: usar el formato único que ya quedó en E2-01. En los controladores
   basta con `return res.status(409).json({ error: 'mensaje', code: 'CODIGO' })`
   o `throw new HttpError(409, 'mensaje', 'CODIGO')`
   (`src/middlewares/errores.js`). Ya no hace falta `try/catch` para que el
   servicio no se caiga.
7. Cada cambio de modelo (campos nuevos) avísenlo en el grupo: Arnovis lo
   necesita para los scripts SQL y el diagrama entidad-relación.

## Formato de error (ya implementado)

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Recurso no encontrado." } }
```

Códigos por defecto según el status: `VALIDATION_ERROR` (400), `UNAUTHORIZED`
(401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409),
`SERVICE_UNAVAILABLE` (502/503), `INTERNAL_ERROR` (500). Las respuestas
exitosas no cambian.

---

## Arnovis — Arquitectura, Gateway y transversal

| ID | Tarea | Fecha | Criterio de aceptación |
|---|---|---|---|
| [E2-01](https://app.clickup.com/t/17tjyy3mx8d) | Manejo centralizado de errores y formato único | Mié 21 | ✅ Hecho: ningún dato inválido tumba un servicio; todos los errores salen con `{success:false,error:{code,message}}`. |
| [E2-02](https://app.clickup.com/t/17tjyy3mx8e) | Scripts de base de datos | Vie 23, 6 p.m. | `database/schema.sql` y `database/seed.sql` por cada base, orden de ejecución documentado, `.env.example` en la raíz y justificación de PostgreSQL. La base se puede crear desde cero siguiendo el README. |
| [E2-03](https://app.clickup.com/t/17tjyy3mx8f) | Modelo de datos | Vie 23, 6 p.m. | Diagrama entidad-relación de las 6 bases, diccionario de datos y tabla de qué servicio es dueño de cada dato (con los modelos ya finales). |
| [E2-04](https://app.clickup.com/t/17tjyy3mx8g) | Diagramas de arquitectura y secuencia | Vie 23, 6 p.m. | Arquitectura actualizada y secuencias de: crear reserva con validación remota, y cambio de estado de solicitud con notificación. |
| [E2-05](https://app.clickup.com/t/17tjyy3mx8j) | Catálogo de endpoints y documento técnico | Sáb 24, 12 m. | Método, ruta, parámetros, cuerpo, respuesta y errores de cada endpoint; README final; PDF técnico consolidado con la matriz de aportes. |

## Camilo — Usuarios y Solicitudes

| ID | Tarea | Fecha | Criterio de aceptación |
|---|---|---|---|
| [E2-10](https://app.clickup.com/t/17tjyy3mx8k) | Cerrar el registro público | Jue 22 | Hoy `POST /auth/register` deja registrarse como "Administrador del sistema". El registro público solo crea Estudiantes (o se elimina y solo el admin crea cuentas). Mandar `rol` en el registro público no debe dar más permisos. |
| [E2-11](https://app.clickup.com/t/17tjyy3mx8m) | CRUD completo de usuarios | Jue 22 | `GET /usuarios/:id`, `POST /usuarios` (admin crea con rol), `PATCH /usuarios/:id` (datos), validar `rol` contra la lista permitida. Nunca devolver `passwordHash`. |
| [E2-12](https://app.clickup.com/t/17tjyy3mx8n) | Ciclo de vida de solicitudes | Jue 22 | Solo se permiten Registrada → En revisión → Asignada → En proceso → Resuelta → Cerrada. Saltos o retrocesos no definidos responden **409 `INVALID_TRANSITION`** y el estado no cambia (T08, T09). Pasar a Asignada exige `asignadoA`. Validar tipo, dependencia y prioridad contra sus catálogos. |
| [E2-13](https://app.clickup.com/t/17tjyy3mx8p) | Permisos de lectura | Jue 22 | `GET /solicitudes/:id`: solo el dueño o el personal (hoy un estudiante ve la solicitud de otro si sabe el ID). Igual para el historial de PQRS. |

## Simón — Reservas y Recursos

| ID | Tarea | Fecha | Criterio de aceptación |
|---|---|---|---|
| [E2-20](https://app.clickup.com/t/17tjyy3mx8q) | Reglas de reserva | Jue 22 | Fecha válida y no pasada, `horaFin > horaInicio`, y **409 `RESERVATION_CONFLICT`** si se cruza con otra reserva Pendiente o Confirmada del mismo espacio en la misma fecha (T10, T11). La regla se revisa también al confirmar. |
| [E2-21](https://app.clickup.com/t/17tjyy3mx8r) | Validar que el espacio exista | Jue 22 | El espacio debe existir en el catálogo (salón, sala o equipo). Para equipos, consultar por HTTP a recursos-service; si no responde, error controlado (503) y **no** se crea la reserva. |
| [E2-22](https://app.clickup.com/t/17tjyy3mx8t) | CRUD completo de reservas | Jue 22 | `GET /reservas/:id` (dueño o personal), `PATCH /reservas/:id` para cambiar fecha, horas o motivo mientras esté Pendiente (revalidando solapamiento) y validar `estado` contra la lista permitida. |
| [E2-23](https://app.clickup.com/t/17tjyy3mx8u) | CRUD completo de recursos | Jue 22 | `GET /recursos/:codigo` (T04, T05), validar `tipo` y `estado` contra sus listas, campo `descripcion`. |

## Diego — Eventos, Notificaciones y Búsqueda

| ID | Tarea | Fecha | Criterio de aceptación |
|---|---|---|---|
| [E2-30](https://app.clickup.com/t/17tjyy3mx8v) | CRUD completo de eventos | Jue 22 | `GET /eventos/:id`, campo `horaFin` con rango válido (fin después de inicio), fecha válida y `estado` validado. |
| [E2-31](https://app.clickup.com/t/17tjyy3mx8w) | Modelo de notificaciones | Jue 22 | Agregar `titulo`, `tipo`, `entidadRelacionada` y `entidadId`; `GET /notificaciones/:id` (solo el destinatario); endpoint interno para que otros servicios creen notificaciones con token de servicio. |
| [E2-32](https://app.clickup.com/t/17tjyy3mx8x) | Notificaciones generadas por los servicios | Vie 23, 6 p.m. | Solicitudes (cambio de estado), Reservas (confirmada, denegada o cancelada) y Eventos (inscripción) crean la notificación por HTTP, sin bloquear la operación si notificaciones está caído (igual que `busquedaClient.js`). Coordinar con Camilo y Simón. |
| [E2-33](https://app.clickup.com/t/17tjyy3mx8y) | Búsqueda al día | Vie 23, 11 p.m. | Reindexar con los campos nuevos y verificar que la búsqueda y el `backfill` siguen funcionando. |

## David — Frontend

| ID | Tarea | Fecha | Criterio de aceptación |
|---|---|---|---|
| [E2-40](https://app.clickup.com/t/17tjyy3mx8z) | Detalle de solicitud | Vie 23, 6 p.m. | El selector solo ofrece las transiciones permitidas desde el estado actual y muestra el mensaje del 409 si el backend la rechaza. |
| [E2-41](https://app.clickup.com/t/17tjyy3mx90) | Reservas en la interfaz | Vie 23, 6 p.m. | Mostrar el conflicto de horario (409) y los errores de validación por campo; formulario para modificar una reserva Pendiente. |
| [E2-42](https://app.clickup.com/t/17tjyy3mx91) | Eventos y notificaciones | Vie 23, 6 p.m. | Campo hora fin en el formulario de eventos; mostrar el título de la notificación; dejar de crear notificaciones desde el frontend cuando el backend ya las genere (coordinar con Diego). |
| [E2-43](https://app.clickup.com/t/17tjyy3mx92) | Estados de interfaz y evidencias | Vie 23, 11 p.m. | Revisar cargando, éxito, error, lista vacía y no encontrado en todas las vistas (sección 8.3). Capturas del flujo React → Gateway → base de datos para cada módulo. |

## Maicol — QA y despliegue

| ID | Tarea | Fecha | Criterio de aceptación |
|---|---|---|---|
| [E2-50](https://app.clickup.com/t/17tjyy3mx93) | Integrar la dockerización | Jue 22 | Actualizar `feature/maicol-qa-despliegue` con `develop` y abrir el PR. Cambiar `FRONTEND_ORIGIN: "*"` por un origen configurable (la guía pide limitar CORS). |
| [E2-51](https://app.clickup.com/t/17tjyy3mx94) | Colección Postman | Vie 23, 6 p.m. | Exportada en `postman/` con su entorno: CRUD de los 6 dominios y casos de error (400, 401, 403, 404, 409). |
| [E2-52](https://app.clickup.com/t/17tjyy3mx95) | Matriz de pruebas T01–T15 | Vie 23, 11 p.m. | Ejecutada con evidencia, incluyendo T12 (persistencia tras reiniciar) y T14 (servicio caído). |
| [E2-53](https://app.clickup.com/t/17tjyy3mx96) | Defectos y paquete final | Sáb 24, 12 m. | Cada defecto registrado en ClickUp con el formato 9.4 (pasos, esperado, observado, severidad, responsable) y el ZIP final con la estructura de la sección 11.1. |

---

## Orden sugerido

1. **Hoy (miércoles 21):** E2-01 mezclado a `develop` (base para todos).
2. **Jueves 22**, en paralelo: Camilo (E2-10 a E2-13), Simón (E2-20 a E2-23), Diego (E2-30 a E2-33), Maicol (E2-50).
3. **Viernes 23:** David conecta la interfaz a medida que salen los endpoints (E2-40 a E2-43).
4. **Viernes 23**, con los modelos ya finales: Arnovis (E2-02 a E2-04) y Maicol (E2-51 y E2-52).
5. **Sábado 24 en la mañana:** documento técnico, README y ZIP (E2-05 y E2-53).
