# Guía de trabajo — Entregable 2 (Persistencia, CRUD e integración)

**Entrega a la docente: sábado 24 de octubre.** Esta guía dice qué le toca a
cada uno, en qué orden y de quién depende, para que nadie trabaje encima de
algo que no existe todavía ni pise el trabajo de otro.

- Sale de contrastar el código de `develop` con cada fase del documento de la
  docente. **No hay que rehacer nada del Entregable 1**: el CRUD básico, el
  Gateway y la conexión del frontend con la API ya funcionan. Falta: reglas de
  negocio, validaciones, consultas por ID, base de datos, pruebas y documentación.
- Cada tarea está en **ClickUp** (espacio SISTEMAS DISTRIBUIDOS, etiqueta
  `entregable 2`) con responsable, fecha y criterio de aceptación. El enlace
  está en la columna ID.
- El reparto sigue los roles del README: **Arnovis** (líder, arquitectura y
  backend base), **Camilo** (usuarios y solicitudes), **Simón** (reservas y
  recursos), **Diego** (eventos, notificaciones y búsqueda), **David**
  (frontend/UX) y **Maicol** (QA, DevOps y documentación).

---

## 0. Estado al viernes 23 (léelo primero)

Como el jueves no hubo avances, **Arnovis implementó y probó todo el backend,
el frontend y las pruebas en el
[PR #14](https://github.com/Carh-rgb/uajs-smart-campus/pull/14)**
(E2-10 a E2-13, E2-20 a E2-23, E2-30 a E2-33, E2-40 a E2-42, E2-51 y E2-52).
**No vuelvan a hacer esas tareas.** La matriz de pruebas da 15/15
(`pruebas/MATRIZ-PRUEBAS.md`).

Lo que **sí** queda pendiente, en este orden:

| Quién | Qué | Para cuándo |
|---|---|---|
| Camilo (o quien pueda) | Revisar y mezclar en `develop` los PR #11, #12, #13 y #14 (se mezclan en cualquier orden sin conflictos). | Hoy viernes |
| Todos | Bajar `develop`, levantar el sistema (`npm install` y `docker compose down -v && docker compose up -d` en `backend/`) y probar su módulo desde la interfaz. Si algo falla, avisar en el grupo. | Hoy viernes |
| Maicol | E2-50: integrar la dockerización a `develop` con CORS limitado. | Hoy viernes |
| David | E2-43: revisar estados de interfaz y completar capturas por módulo (ya hay 5 en `pruebas/evidencias/`). | Hoy viernes |
| Maicol | E2-05: documento técnico PDF. Insumos listos: `database/`, `arquitectura/` (con imágenes), `pruebas/` y `postman/`. | Sábado 12 m. |
| Maicol | E2-53: registrar en ClickUp los defectos de `pruebas/MATRIZ-PRUEBAS.md` y armar el ZIP final. | Sábado 12 m. |

---

## 1. Lo primero: hoy, miércoles 21

Hay 3 Pull Requests de base abiertos. **Nadie debe crear su rama del
Entregable 2 hasta que estén mezclados en `develop`**, porque todo lo demás
se construye encima de ellos.

| PR | Qué trae | Por qué hay que mezclarlo antes de empezar |
|---|---|---|
| [#11](https://github.com/Carh-rgb/uajs-smart-campus/pull/11) · E2-01 | Manejo centralizado de errores en los 7 servicios + esta guía | Cambia el `server.js` de todos los servicios y agrega una dependencia. Si alguien arranca antes, va a tener conflictos. |
| [#12](https://github.com/Carh-rgb/uajs-smart-campus/pull/12) · E2-02 / E2-03 | Llaves foráneas en los modelos, scripts SQL y modelo de datos | Toca `models/index.js` de 4 servicios. |
| [#13](https://github.com/Carh-rgb/uajs-smart-campus/pull/13) · E2-04 | Diagramas de arquitectura y de secuencia | Describe cómo deben quedar E2-21 (Simón) y E2-32 (Diego). |

**Quién:** Camilo revisa y mezcla los tres (se pueden mezclar en cualquier
orden; ya se probó que no chocan entre sí).

**Después de que estén mezclados, cada uno en su PC:**

```bash
git checkout develop
git pull
cd backend
npm install                 # hay una dependencia nueva (express-async-errors)
docker compose down -v      # borra la base local (solo tiene datos de prueba)
docker compose up -d        # base nueva, ya con las llaves foráneas
```

Y para empezar tu parte:

```bash
git checkout develop
git checkout -b feature/<tu-nombre>-e2-<tema>      # ej. feature/simon-e2-reservas
```

---

## 2. Tabla maestra

Ordenada por fase: primero lo que desbloquea a otros. Los IDs enlazan a ClickUp.

| Fase | ID | Tarea | Responsable | Depende de | Fecha | Estado | Rúbrica |
|---|---|---|---|---|---|---|---|
| 0 | [E2-01](https://app.clickup.com/t/17tjyy3mx8d) | Manejo centralizado de errores | Arnovis | — | Mié 21 | ✅ PR #11 | Pruebas y errores 10 % |
| 0 | [E2-02](https://app.clickup.com/t/17tjyy3mx8e) | Scripts SQL y llaves foráneas | Arnovis | — | Vie 23, 6 p.m. | 🟡 PR #12 (se regenera el viernes) | Modelo y persistencia 15 % |
| 0 | [E2-03](https://app.clickup.com/t/17tjyy3mx8f) | Modelo de datos (diagrama entidad-relación y diccionario) | Arnovis | — | Vie 23, 6 p.m. | 🟡 PR #12 (se regenera el viernes) | Modelo y persistencia 15 % |
| 0 | [E2-04](https://app.clickup.com/t/17tjyy3mx8g) | Diagramas de arquitectura y secuencia | Arnovis | — | Vie 23, 6 p.m. | ✅ PR #13 | Gateway e integración 15 % |
| 1 | [E2-10](https://app.clickup.com/t/17tjyy3mx8k) | Cerrar el registro público | Camilo | PR #11 | Jue 22 | ⬜ | Calidad y seguridad 10 % |
| 1 | [E2-11](https://app.clickup.com/t/17tjyy3mx8m) | CRUD completo de usuarios | Camilo | PR #11 | Jue 22 | ⬜ | CRUD 20 % |
| 1 | [E2-12](https://app.clickup.com/t/17tjyy3mx8n) | Ciclo de vida de solicitudes | Camilo | PR #11 | Jue 22 | ⬜ | Reglas de negocio 15 % |
| 1 | [E2-13](https://app.clickup.com/t/17tjyy3mx8p) | Permisos de lectura de solicitudes | Camilo | PR #11 | Jue 22 | ⬜ | Calidad y seguridad 10 % |
| 1 | [E2-20](https://app.clickup.com/t/17tjyy3mx8q) | Reglas de reserva (fechas y solapamiento) | Simón | PR #11 | Jue 22 | ⬜ | Reglas de negocio 15 % |
| 1 | [E2-21](https://app.clickup.com/t/17tjyy3mx8r) | Validar espacio y recurso por HTTP | Simón | PR #11, E2-23 | Jue 22 | ⬜ | Gateway e integración 15 % |
| 1 | [E2-22](https://app.clickup.com/t/17tjyy3mx8t) | CRUD completo de reservas | Simón | PR #11, E2-20 | Jue 22 | ⬜ | CRUD 20 % |
| 1 | [E2-23](https://app.clickup.com/t/17tjyy3mx8u) | CRUD completo de recursos | Simón | PR #11 | Jue 22 | ⬜ | CRUD 20 % |
| 1 | [E2-30](https://app.clickup.com/t/17tjyy3mx8v) | CRUD completo de eventos | Diego | PR #11 | Jue 22 | ⬜ | CRUD 20 % |
| 1 | [E2-31](https://app.clickup.com/t/17tjyy3mx8w) | Modelo y consulta de notificaciones | Diego | PR #11 | Jue 22 | ⬜ | CRUD 20 % |
| 1 | [E2-50](https://app.clickup.com/t/17tjyy3mx93) | Integrar la dockerización a `develop` | Maicol | PR #11 y #12 | Jue 22 | ⬜ | Calidad y seguridad 10 % |
| 1 | [E2-43](https://app.clickup.com/t/17tjyy3mx92) | Estados de interfaz y capturas | David | PR #11 (la revisión de estados se puede empezar ya) | Vie 23, 11 p.m. | ⬜ | Gateway e integración 15 % |
| 2 | [E2-32](https://app.clickup.com/t/17tjyy3mx8x) | Notificaciones generadas por los servicios | Diego | E2-31, E2-12, E2-20 | Vie 23, 6 p.m. | ⬜ | Gateway e integración 15 % |
| 2 | [E2-40](https://app.clickup.com/t/17tjyy3mx8z) | Detalle de solicitud con transiciones | David | E2-12 | Vie 23, 6 p.m. | ⬜ | Gateway e integración 15 % |
| 2 | [E2-41](https://app.clickup.com/t/17tjyy3mx90) | Reservas: conflicto y modificación | David | E2-20, E2-22 | Vie 23, 6 p.m. | ⬜ | Gateway e integración 15 % |
| 2 | [E2-42](https://app.clickup.com/t/17tjyy3mx91) | Eventos con hora fin y notificaciones con título | David | E2-30, E2-31, E2-32 | Vie 23, 6 p.m. | ⬜ | Gateway e integración 15 % |
| 2 | [E2-51](https://app.clickup.com/t/17tjyy3mx94) | Colección Postman | Maicol | Endpoints de la fase 1 | Vie 23, 6 p.m. | ⬜ | Pruebas y errores 10 % |
| 2 | E2-02 / E2-03 | Regenerar scripts y modelo de datos | Arnovis | Modelos finales (E2-11, E2-23, E2-30, E2-31) | Vie 23, 6 p.m. | ⬜ | Modelo y persistencia 15 % |
| 3 | [E2-33](https://app.clickup.com/t/17tjyy3mx8y) | Búsqueda al día y endpoints internos protegidos | Diego | E2-30, E2-31 | Vie 23, 11 p.m. | ⬜ | Calidad y seguridad 10 % |
| 3 | [E2-52](https://app.clickup.com/t/17tjyy3mx95) | Matriz de pruebas T01–T15 | Maicol | E2-51 | Vie 23, 11 p.m. | ⬜ | Pruebas y errores 10 % |
| 4 | [E2-05](https://app.clickup.com/t/17tjyy3mx8j) | Catálogo de endpoints, README y documento técnico | Maicol | E2-02, E2-03, E2-04, E2-43, E2-52 | Sáb 24, 12 m. | ⬜ | Documentación 5 % |
| 4 | [E2-53](https://app.clickup.com/t/17tjyy3mx96) | Registro de defectos y ZIP final | Maicol | Todo lo anterior mezclado | Sáb 24, 12 m. | ⬜ | Pruebas y errores 10 % |

Estado: ✅ listo (en PR) · 🟡 avanzado · ⬜ por hacer. Cada responsable
actualiza el estado en ClickUp (*in development* al empezar, *in review* al
abrir el PR, *shipped* al mezclarse).

### Fases en el tiempo

| Fase | Cuándo | Qué pasa |
|---|---|---|
| **0** | Hoy, miércoles 21 | Mezclar los PR #11, #12 y #13. Todos actualizan su `develop` local. |
| **1** | Jueves 22 | Backend de cada dominio en paralelo (Camilo, Simón, Diego), Docker de Maicol. David empieza la revisión de estados de interfaz. **Cada uno mezcla su PR antes de terminar el día.** |
| **2** | Viernes 23 hasta las 6 p.m. | David conecta la interfaz con lo nuevo, Diego conecta las notificaciones, Maicol arma Postman, Arnovis regenera la base de datos. |
| **3** | Viernes 23 en la noche | Matriz de pruebas, capturas y búsqueda. |
| **4** | Sábado 24 en la mañana | Documento técnico, ZIP y entrega. |

---

## 3. Qué hacer primero, por persona

**Arnovis** (líder)
1. Conseguir que se mezclen los PR #11, #12 y #13 hoy.
2. Revisar los PRs de backend de Camilo, Simón y Diego a medida que lleguen.
3. Viernes, con los modelos finales: regenerar `database/` con
   `bash database/generar-scripts.sh` y `node database/generar-diccionario.mjs`
   (pasos en `database/README.md`).

**Camilo**
1. Revisar y mezclar los PR #11, #12 y #13.
2. E2-10 (registro público): es un hueco de seguridad real, va primero.
3. E2-12 (ciclo de vida de solicitudes): David lo necesita para E2-40.
4. E2-11 y E2-13.

**Simón**
1. E2-20 (fechas y solapamiento): David lo necesita para E2-41.
2. E2-23 (`GET /recursos/:codigo`): lo necesitas tú mismo para E2-21.
3. E2-21 (validación por HTTP, ver la secuencia 3 de `arquitectura/README.md`).
4. E2-22.

**Diego**
1. E2-31 (modelo de notificaciones y endpoint interno): lo necesitas para E2-32.
2. E2-30 (eventos con hora fin).
3. E2-32 cuando estén mezclados E2-12 (Camilo) y E2-20 (Simón); ver la
   secuencia 4 de `arquitectura/README.md`.
4. E2-33, incluido cerrar los endpoints internos de búsqueda (ver riesgos en
   `arquitectura/README.md`, sección 7).

**David**
1. Mientras sale el backend: E2-43, revisando los estados de interfaz
   (cargando, error, vacío, no encontrado) en todas las vistas.
2. E2-40 apenas se mezcle E2-12; E2-41 apenas se mezclen E2-20 y E2-22.
3. E2-42 cuando Diego termine E2-30, E2-31 y E2-32.
4. Capturas finales del flujo React → Gateway → base de datos.

**Maicol**
1. E2-50: actualizar `feature/maicol-qa-despliegue` con `develop` (después de
   que se mezclen #11 y #12) y abrir el PR con CORS limitado.
2. E2-51: armar la colección Postman a medida que se mezclan los endpoints.
3. E2-52 el viernes en la noche, con todo mezclado.
4. E2-05 y E2-53 el sábado en la mañana.

---

## 4. Quién revisa a quién

La guía de la docente pide que otra persona revise cada PR antes de mezclarlo.

| Autor del PR | Revisa y mezcla |
|---|---|
| Arnovis | Camilo |
| Camilo, Simón, Diego (backend) | Arnovis |
| David (frontend) | Camilo |
| Maicol (Docker, Postman, documentación) | Arnovis |

---

## 5. Reglas para no enredarse

1. **Siempre crea tu rama desde `develop` actualizado** (`git checkout develop && git pull`).
   Antes de abrir el PR, vuelve a traer `develop` a tu rama
   (`git pull origin develop`) y resuelve los conflictos en tu lado.
2. **Nunca uses `git push --force`** sobre `develop`, `master` ni la rama de
   otra persona.
3. **No edites archivos de otro dominio sin avisar.** Si necesitas algo en un
   servicio que no es tuyo (por ejemplo, Diego agregando el cliente de
   notificaciones en solicitudes-service), avísale al dueño en el grupo y
   menciónalo en el PR.
4. Rama propia: `feature/<tu-nombre>-e2-<tema>`. Commits con el ID de ClickUp
   entre corchetes, por ejemplo
   `feat(reservas): rechaza reservas solapadas con 409 [17tjyy3mx8q]`
   (el ID es lo que va después de `/t/` en el enlace de tu tarea).
5. **Si cambias un modelo** (campo nuevo, restricción), avisa en el grupo:
   Arnovis lo necesita para regenerar los scripts SQL y el modelo de datos.
   Para ver el campo en tu base local hay que recrearla (`docker compose down -v`),
   porque Sequelize no modifica tablas que ya existen.
6. Mínimos de la rúbrica **por persona**: 3 tareas en ClickUp, 5 commits con
   contenido real, rama propia, 2 Pull Requests a `develop`, una evidencia por
   tarea cerrada y un aporte a la documentación.
7. Errores: usa el formato único de E2-01 (sección 6). Ya no hace falta
   `try/catch` para que el servicio no se caiga.

---

## 6. Formato de error (ya implementado en E2-01)

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Recurso no encontrado." } }
```

En los controladores basta con
`return res.status(409).json({ error: 'mensaje', code: 'CODIGO' })` o
`throw new HttpError(409, 'mensaje', 'CODIGO')` (`src/middlewares/errores.js`).
Códigos por defecto según el status: `VALIDATION_ERROR` (400), `UNAUTHORIZED`
(401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409),
`SERVICE_UNAVAILABLE` (502/503), `INTERNAL_ERROR` (500). Las respuestas
exitosas no cambian.

---

## 7. Detalle de cada tarea (criterios de aceptación)

### Arnovis — Arquitectura, Gateway y backend base

| ID | Tarea | Criterio de aceptación |
|---|---|---|
| [E2-01](https://app.clickup.com/t/17tjyy3mx8d) | Manejo centralizado de errores | Ningún dato inválido tumba un servicio; todos los errores salen con `{success:false,error:{code,message}}`. |
| [E2-02](https://app.clickup.com/t/17tjyy3mx8e) | Scripts de base de datos | `database/` con la creación de las bases, la estructura y los datos de prueba de cada una, orden de ejecución y justificación de PostgreSQL. La base se puede crear desde cero siguiendo `database/README.md`. |
| [E2-03](https://app.clickup.com/t/17tjyy3mx8f) | Modelo de datos | Diagrama entidad-relación de las 6 bases, diccionario de datos y tabla de qué servicio es dueño de cada dato, con los modelos finales. |
| [E2-04](https://app.clickup.com/t/17tjyy3mx8g) | Diagramas de arquitectura y secuencia | Arquitectura actualizada y secuencias de los flujos principales, con el manejo de fallos de cada comunicación entre servicios. |

### Camilo — Usuarios y Solicitudes

| ID | Tarea | Criterio de aceptación |
|---|---|---|
| [E2-10](https://app.clickup.com/t/17tjyy3mx8k) | Cerrar el registro público | Hoy `POST /auth/register` deja registrarse como "Administrador del sistema". El registro público solo crea Estudiantes (o se elimina y solo el admin crea cuentas). Mandar `rol` en el registro público no debe dar más permisos. |
| [E2-11](https://app.clickup.com/t/17tjyy3mx8m) | CRUD completo de usuarios | `GET /usuarios/:id`, `POST /usuarios` (admin crea con rol), `PATCH /usuarios/:id` (datos) y validar `rol` contra la lista permitida. Nunca devolver `passwordHash`. |
| [E2-12](https://app.clickup.com/t/17tjyy3mx8n) | Ciclo de vida de solicitudes | Solo se permite Registrada → En revisión → Asignada → En proceso → Resuelta → Cerrada. Saltos o retrocesos no definidos responden **409 `INVALID_TRANSITION`** y el estado no cambia (T08, T09). Pasar a Asignada exige `asignadoA`. Validar tipo, dependencia y prioridad contra sus catálogos. |
| [E2-13](https://app.clickup.com/t/17tjyy3mx8p) | Permisos de lectura | `GET /solicitudes/:id` solo para el dueño o el personal (hoy un estudiante ve la solicitud de otro si sabe el ID). Igual para el historial de PQRS. |

### Simón — Reservas y Recursos

| ID | Tarea | Criterio de aceptación |
|---|---|---|
| [E2-20](https://app.clickup.com/t/17tjyy3mx8q) | Reglas de reserva | Fecha válida y no pasada, `horaFin > horaInicio`, y **409 `RESERVATION_CONFLICT`** si se cruza con otra reserva Pendiente o Confirmada del mismo espacio en la misma fecha (T10, T11). La regla se revisa también al confirmar. |
| [E2-21](https://app.clickup.com/t/17tjyy3mx8r) | Validar que el espacio exista | El espacio debe existir en el catálogo (salón, sala o equipo). Para equipos, consultar por HTTP a recursos-service; si no responde, error controlado (503) y **no** se crea la reserva. |
| [E2-22](https://app.clickup.com/t/17tjyy3mx8t) | CRUD completo de reservas | `GET /reservas/:id` (dueño o personal), `PATCH /reservas/:id` para cambiar fecha, horas o motivo mientras esté Pendiente (revalidando solapamiento) y validar `estado` contra la lista permitida. |
| [E2-23](https://app.clickup.com/t/17tjyy3mx8u) | CRUD completo de recursos | `GET /recursos/:codigo` (T04, T05), validar `tipo` y `estado` contra sus listas y agregar el campo `descripcion`. |

### Diego — Eventos, Notificaciones y Búsqueda

| ID | Tarea | Criterio de aceptación |
|---|---|---|
| [E2-30](https://app.clickup.com/t/17tjyy3mx8v) | CRUD completo de eventos | `GET /eventos/:id`, campo `horaFin` con rango válido (fin después de inicio), fecha válida y `estado` validado. |
| [E2-31](https://app.clickup.com/t/17tjyy3mx8w) | Modelo de notificaciones | Agregar `titulo`, `tipo`, `entidadRelacionada` y `entidadId`; `GET /notificaciones/:id` (solo el destinatario); endpoint interno para que otros servicios creen notificaciones con token de servicio. |
| [E2-32](https://app.clickup.com/t/17tjyy3mx8x) | Notificaciones generadas por los servicios | Solicitudes (cambio de estado), Reservas (confirmada, denegada o cancelada) y Eventos (inscripción) crean la notificación por HTTP, sin bloquear la operación si notificaciones está caído (igual que `busquedaClient.js`). Coordinar con Camilo y Simón. |
| [E2-33](https://app.clickup.com/t/17tjyy3mx8y) | Búsqueda al día y protegida | Reindexar con los campos nuevos y verificar que la búsqueda y el `backfill` siguen funcionando. Además, `PUT` y `DELETE /buscar/documento` hoy aceptan el token de cualquier usuario y el Gateway los publica: deben aceptar solo tokens de servicio (o no exponerse en el Gateway). |

### David — Frontend

| ID | Tarea | Criterio de aceptación |
|---|---|---|
| [E2-40](https://app.clickup.com/t/17tjyy3mx8z) | Detalle de solicitud | El selector solo ofrece las transiciones permitidas desde el estado actual y muestra el mensaje del 409 si el backend la rechaza. |
| [E2-41](https://app.clickup.com/t/17tjyy3mx90) | Reservas en la interfaz | Mostrar el conflicto de horario (409) y los errores de validación por campo; formulario para modificar una reserva Pendiente. |
| [E2-42](https://app.clickup.com/t/17tjyy3mx91) | Eventos y notificaciones | Campo hora fin en el formulario de eventos; mostrar el título de la notificación; dejar de crear notificaciones desde el frontend cuando el backend ya las genere (coordinar con Diego). |
| [E2-43](https://app.clickup.com/t/17tjyy3mx92) | Estados de interfaz y evidencias | Revisar cargando, éxito, error, lista vacía y no encontrado en todas las vistas (sección 8.3 de la guía). Capturas del flujo React → Gateway → base de datos para cada módulo. |

### Maicol — QA, DevOps y documentación

| ID | Tarea | Criterio de aceptación |
|---|---|---|
| [E2-50](https://app.clickup.com/t/17tjyy3mx93) | Integrar la dockerización | Actualizar `feature/maicol-qa-despliegue` con `develop` y abrir el PR. Cambiar `FRONTEND_ORIGIN: "*"` por un origen configurable (la guía pide limitar CORS). |
| [E2-51](https://app.clickup.com/t/17tjyy3mx94) | Colección Postman | Exportada en `postman/` con su entorno: CRUD de los 6 dominios y casos de error (400, 401, 403, 404, 409). |
| [E2-52](https://app.clickup.com/t/17tjyy3mx95) | Matriz de pruebas T01–T15 | Ejecutada con evidencia, incluyendo T12 (persistencia tras reiniciar) y T14 (servicio caído). |
| [E2-05](https://app.clickup.com/t/17tjyy3mx8j) | Catálogo de endpoints, README y documento técnico | Método, ruta, parámetros, cuerpo, respuesta y errores de cada endpoint; README final; PDF técnico con la matriz de aportes. Insumos: `database/README.md`, `database/MODELO-DATOS.md`, `arquitectura/` (imágenes en `arquitectura/img/`) y capturas de E2-43. |
| [E2-53](https://app.clickup.com/t/17tjyy3mx96) | Defectos y paquete final | Cada defecto registrado en ClickUp con el formato 9.4 (pasos, esperado, observado, severidad, responsable) y el ZIP final con la estructura de la sección 11.1. |
