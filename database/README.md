# Base de datos — UAJS Smart Campus

Scripts reproducibles para crear y poblar la persistencia del sistema. El diagrama entidad-relación y el diccionario de datos completo están en el documento técnico del Entregable 2.

| Archivo | Para qué sirve |
|---|---|
| [`schema.sql`](schema.sql) | Crea las 6 bases, las 18 tablas, claves, `CHECK` e índices. Idempotente. |
| [`seed.sql`](seed.sql) | Carga datos ficticios de demostración (4 usuarios, solicitudes, reservas, etc.). Idempotente. |

## Motor elegido y por qué

**PostgreSQL 16** (la guía pide "MySQL o un motor relacional equivalente"):

- Es relacional, con claves foráneas, `CHECK`, `UNIQUE`, tipos `ENUM` y transacciones — todo lo que exige el modelo de datos del Entregable 2.
- Trae **bloqueos asesores** (`pg_advisory_xact_lock`) y bloqueo de fila (`SELECT … FOR UPDATE`), que usamos para que dos peticiones simultáneas no creen reservas solapadas ni superen el cupo de un evento.
- Corre en un solo contenedor Docker (`postgres:16-alpine`) sin instalar nada en el equipo.
- Sequelize (el ORM de los servicios) usa consultas parametrizadas, lo que previene inyección SQL.

## Propiedad de los datos (una base por microservicio)

Cada microservicio es dueño exclusivo de su base y **nunca** lee ni escribe las tablas de otro: cuando necesita un dato ajeno lo pide por la API del servicio dueño.

| Base de datos | Servicio dueño | Tablas |
|---|---|---|
| `uajs_usuarios` | usuarios-service | `usuarios`, `permisos` |
| `uajs_solicitudes` | solicitudes-service | `solicitudes`, `solicitudes_historial`, `pqrs`, `pqrs_historial` |
| `uajs_reservas` | reservas-service | `pabellones`, `salones`, `salas_especiales`, `salas_biblioteca`, `equipos`, `reservas`, `reservas_historial` |
| `uajs_recursos` | recursos-service | `recursos`, `recursos_historial` |
| `uajs_eventos` | eventos-service | `eventos`, `inscripciones` |
| `uajs_notificaciones` | notificaciones-service | `notificaciones` |

Las relaciones **entre** servicios (por ejemplo `reservas.solicitanteId → usuarios.id`) son referencias lógicas: al ser bases distintas no pueden llevar `FOREIGN KEY`, y cada servicio las valida consultando al servicio dueño (ver "Integración entre servicios" en el README del backend). Las relaciones **dentro** de una misma base sí llevan clave foránea.

## Crear la base desde cero

Requisitos: Docker Desktop en ejecución.

```bash
# 1) Levantar PostgreSQL (crea el usuario `uajs` y la base uajs_usuarios)
cd backend
npm run db:up

# 2) Crear bases y tablas, y cargar los datos de demostración
#    (desde la raíz del repositorio; clave de desarrollo: uajs_dev_pass)
docker exec -i uajs-postgres psql -U uajs -d postgres -v ON_ERROR_STOP=1 < database/schema.sql
docker exec -i uajs-postgres psql -U uajs -d postgres -v ON_ERROR_STOP=1 < database/seed.sql
```

**Orden:** primero `schema.sql`, después `seed.sql`. Ambos se pueden ejecutar varias veces sin duplicar datos (los `CREATE` usan `IF NOT EXISTS` y cada bloque del seed solo inserta si la tabla está vacía).

> En PowerShell, `<` no redirige archivos; usa `Get-Content database/schema.sql | docker exec -i uajs-postgres psql -U uajs -d postgres -v ON_ERROR_STOP=1`.

### ¿Y los scripts son obligatorios?

No. Si solo arrancas los servicios (`npm run dev`), cada uno crea sus tablas con `sequelize.sync()` y carga su seed de Node la primera vez. Los scripts SQL son el camino explícito y reproducible; ambos producen **exactamente las mismas tablas y columnas** (verificado comparando `information_schema` de las 6 bases).

## Verificar

```bash
docker exec -it uajs-postgres psql -U uajs -d uajs_usuarios -c "SELECT id, correo, rol, activo FROM usuarios;"
docker exec -it uajs-postgres psql -U uajs -d uajs_reservas  -c "SELECT id, espacio, fecha, \"horaInicio\", \"horaFin\", estado FROM reservas;"
```

Usuarios de prueba creados por el seed (contraseña `uajs2026`, almacenada como hash bcrypt, nunca en texto plano):

| Correo | Rol |
|---|---|
| `camilo.ramirez@uajs.edu.co` | Estudiante |
| `laura.perez@uajs.edu.co` | Docente |
| `andres.gomez@uajs.edu.co` | Administrativo |
| `admin@uajs.edu.co` | Administrador del sistema |

Todos los datos son ficticios. No hay información real de estudiantes, docentes ni funcionarios.

## Reglas de integridad

| Regla | Dónde |
|---|---|
| Correo de usuario único | `usuarios.correo UNIQUE` |
| Un permiso por rol | `permisos.rol UNIQUE` |
| `horaFin` posterior a `horaInicio` | `CHECK` en `reservas`; en `eventos` si hay hora de fin |
| Capacidades, stock y cupo no negativos | `CHECK (capacidad > 0)`, `CHECK (stock >= 0)`, `CHECK (cupoMaximo > 0)` |
| Un usuario no se inscribe dos veces al mismo evento | índice único `(eventoId, usuarioId)` |
| Estados de usuario, recurso y evento restringidos | tipos `ENUM` |
| Al borrar una solicitud/PQRS/reserva se borra su historial | `ON DELETE CASCADE` |
| Al borrar un evento se borran sus inscripciones | `ON DELETE CASCADE` |
| Un salón pertenece a un pabellón existente | `FOREIGN KEY salones.pabellonId` |

Reglas que **no** se pueden expresar como restricción de tabla (viven en el backend, dentro de transacciones): no solapar reservas activas del mismo espacio, transiciones de estado válidas, y no eliminar un equipo con reservas activas.

## Reiniciar los datos

```bash
cd backend
npm run db:down                       # detiene el contenedor (el volumen conserva los datos)
docker volume rm uajs_pgdata          # borra los datos para empezar de cero
npm run db:up                         # vuelve a crear las bases vacías
```
