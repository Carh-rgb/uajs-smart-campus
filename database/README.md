# Base de datos — UAJS Smart Campus

Persistencia del Entregable 2: estructura, datos de prueba y decisiones del
modelo. El diagrama entidad-relación y el diccionario de datos completo están
en [`MODELO-DATOS.md`](MODELO-DATOS.md) (se genera desde la estructura real).

## Contenido

| Archivo | Qué es |
|---|---|
| `00_crear_bases.sql` | Crea las 6 bases (una por microservicio) si no existen. |
| `schema/NN_<base>.sql` | Estructura de cada base: tablas, tipos ENUM, llaves primarias, únicas y foráneas. |
| `seed/NN_<base>.sql` | Datos de prueba **ficticios** de cada base (los mismos que siembran los servicios). |
| `cargar.sh` | Crea todo desde cero ejecutando los scripts en orden. |
| `generar-scripts.sh` | Regenera `schema/` y `seed/` después de cambiar un modelo. |
| `generar-diccionario.mjs` | Regenera `MODELO-DATOS.md`. |
| `MODELO-DATOS.md` | Diagrama entidad-relación (Mermaid) y diccionario de datos. |

## Por qué PostgreSQL

La guía pide MySQL "o un motor relacional equivalente". Se eligió PostgreSQL 16
porque:

- **Tipos `ENUM` nativos**: los estados y roles con valores fijos
  (`estado` de recursos y eventos, `rol` de usuarios) quedan restringidos en
  la propia base, no solo en el código.
- **`JSONB`**: `permisos.modulosActivos` guarda la lista de módulos de cada rol
  sin una tabla intermedia.
- **Varias bases aisladas en una sola instancia**: un contenedor de Docker
  con 6 bases separadas cumple "una base por servicio" sin 6 servidores.
- **Integridad**: llaves foráneas con `ON DELETE CASCADE`, restricciones
  `UNIQUE` y `NOT NULL`, transacciones.
- Sequelize lo soporta completo y el equipo ya lo usó en el Entregable 1.

## Una base por microservicio (sección 6.2 de la guía)

Cada microservicio es el **único dueño** de su base: solo él lee y escribe
sus tablas. Si necesita un dato de otro dominio, lo pide por HTTP a la API de
ese servicio, nunca entrando a una base ajena.

| Base | Dueño | Tablas |
|---|---|---|
| `uajs_usuarios` | usuarios-service | `usuarios`, `permisos` |
| `uajs_solicitudes` | solicitudes-service | `solicitudes`, `solicitudes_historial`, `pqrs`, `pqrs_historial` |
| `uajs_reservas` | reservas-service | `pabellones`, `salones`, `salas_especiales`, `salas_biblioteca`, `equipos`, `reservas`, `reservas_historial` |
| `uajs_recursos` | recursos-service | `recursos`, `recursos_historial` |
| `uajs_eventos` | eventos-service | `eventos`, `inscripciones` |
| `uajs_notificaciones` | notificaciones-service | `notificaciones` |
| índice `uajs_buscar` (Elasticsearch) | busqueda-service | — (lo alimentan los demás servicios) |

### Llaves foráneas

Solo hay llaves foráneas **dentro de una misma base**, porque PostgreSQL no
las permite entre bases distintas (y no deben existir entre microservicios):

| Tabla hija | Columna | Referencia | Al borrar el padre |
|---|---|---|---|
| `solicitudes_historial` | `solicitudId` | `solicitudes.id` | CASCADE |
| `pqrs_historial` | `pqrsId` | `pqrs.id` | CASCADE |
| `reservas_historial` | `reservaId` | `reservas.id` | CASCADE |
| `salones` | `pabellonId` | `pabellones.id` | CASCADE |
| `recursos_historial` | `recursoCodigo` | `recursos.codigo` | CASCADE |
| `inscripciones` | `eventoId` | `eventos.id` | CASCADE |

Se eligió CASCADE porque un historial o una inscripción no tienen sentido sin
su registro padre.

### Referencias entre microservicios (sin llave foránea)

| Columna | Apunta a | Cómo se mantiene la consistencia |
|---|---|---|
| `solicitudes.solicitanteId`, `pqrs.solicitanteId`, `reservas.solicitanteId`, `inscripciones.usuarioId`, `notificaciones.usuarioId` | `usuarios.id` | Sale del JWT del usuario autenticado, no del cuerpo de la petición: no se puede inventar. |
| `solicitanteNombre`, `rolSolicitante`, `inscripciones.nombre` | `usuarios.nombre` / `rol` | Copia del momento de la operación, a propósito: los listados no tienen que consultar usuarios-service por cada fila, y el registro conserva quién lo hizo aunque el usuario cambie después. |
| `equipos` (reservas) | `recursos` | Réplica derivada: recursos-service avisa por HTTP (`PATCH /reservas/equipos/sync`) cada vez que crea, edita, cambia de estado o elimina un recurso reservable, y reservas ajusta el stock. Recursos es la fuente de verdad. |

## En qué difiere de las entidades sugeridas por la guía

| Entidad sugerida | En este proyecto | Por qué |
|---|---|---|
| `Users` + `Roles` (`role_id`) | `usuarios.rol` es un ENUM con los 4 roles de la guía (Estudiante, Docente, Administrativo, Administrador del sistema). Los módulos que ve cada rol están en `permisos`. | Los roles son fijos (no se crean desde la aplicación) y el ENUM garantiza que solo existan esos valores, sin un join. Lo administrable (los módulos de cada rol) sí está en una tabla. |
| `Users.status` | `usuarios.activo` (BOOLEAN) | Solo hay dos estados: activo o inactivo. |
| `Users.password` | `usuarios.passwordHash` | Solo se guarda el hash bcrypt; nunca la contraseña. |
| `Resources.code`, `.id` | `recursos.codigo` es la llave primaria (`REC-001`) | El código ya es único y es lo que ve el usuario; un id numérico extra no aporta. |
| `Requests.code`, `service_type`, `department`, `assigned_to` | `solicitudes.id` (`SOL-0301`), `tipo`, `dependencia`, `asignadoA` | Mismos datos con nombres en español. |
| `Reservations.resource_id`, `start_at`, `end_at` | `tipoEspacio` + `espacio`, y `fecha` + `horaInicio` + `horaFin` | Una reserva puede ser de un salón, una sala especial, una sala de biblioteca o un equipo (4 tablas distintas), así que se guarda el tipo y el identificador del espacio. La validación de que el espacio exista va en la tarea E2-21. |
| `events.start_time`, `end_time` | `eventos.hora` | Falta la hora de fin: tarea E2-30. |
| `notifications.title`, `type`, `related_entity`, `related_id` | `notificaciones.categoria`, `mensaje` | Faltan título y entidad relacionada: tarea E2-31. |

Las validaciones de reglas de negocio (transiciones de estado, choques de
horario, formatos) se hacen en el backend de cada servicio antes de guardar;
la base agrega la última línea de defensa con `NOT NULL`, `UNIQUE`, `ENUM` y
llaves foráneas.

## Crear las bases desde cero

Hay dos formas equivalentes.

### A. Dejar que los servicios las creen (desarrollo diario)

```bash
cd backend
docker compose up -d   # PostgreSQL + Elasticsearch; crea las 6 bases vacías
npm run dev            # cada servicio crea sus tablas (Sequelize) y siembra datos de prueba
```

### B. Con los scripts SQL (reproducible, sin arrancar los servicios)

Las bases deben estar **vacías** (si los servicios ya arrancaron antes,
borrar el volumen):

```bash
cd backend && docker compose down -v && docker compose up -d && cd ..
bash database/cargar.sh        # Git Bash o Linux, desde la raíz del repo
```

Orden que sigue `cargar.sh` (si se hace a mano, respetarlo):

1. `00_crear_bases.sql` conectado a la base `postgres`.
2. Para cada base, en el orden de los números: `schema/NN_<base>.sql` y luego `seed/NN_<base>.sql`.

En PowerShell, el equivalente para una base es:

```powershell
Get-Content database\schema\02_uajs_solicitudes.sql | docker exec -i uajs-postgres psql -U uajs -d uajs_solicitudes
Get-Content database\seed\02_uajs_solicitudes.sql   | docker exec -i uajs-postgres psql -U uajs -d uajs_solicitudes
```

Después de cargar los scripts, los servicios arrancan normal: Sequelize ve que
las tablas ya existen y los seeds no vuelven a sembrar porque las tablas ya
tienen datos.

**Usuarios de prueba** (todos con la contraseña `uajs2026`):
`camilo.ramirez@uajs.edu.co` (Estudiante), `laura.perez@uajs.edu.co`
(Docente), `andres.gomez@uajs.edu.co` (Administrativo) y `admin@uajs.edu.co`
(Administrador del sistema). Todos los datos son ficticios.

## Variables de entorno

Cada servicio lee `DATABASE_URL` de su `.env` (plantilla en
`backend/services/<servicio>/.env.example`). Los valores de ejemplo
(`uajs` / `uajs_dev_pass`) son solo para desarrollo local; en un despliegue
real se cambian, igual que `JWT_SECRET`.

## Después de cambiar un modelo

Si se agrega un campo, una restricción o una relación, o se cambian los datos
de prueba:

1. Bases vacías y servicios arrancados una vez (forma A de arriba), luego detenerlos.
2. `bash database/generar-scripts.sh` (regenera `schema/` y `seed/`).
3. `node database/generar-diccionario.mjs` (regenera `MODELO-DATOS.md`).
4. Hacer commit de los archivos regenerados junto con el cambio del modelo.

> Ojo: `sequelize.sync()` crea las tablas que faltan pero **no modifica**
> tablas existentes. Si cambias un modelo y tu base local ya tenía esa tabla,
> el campo nuevo no aparece hasta que recrees la base (`docker compose down -v`).
