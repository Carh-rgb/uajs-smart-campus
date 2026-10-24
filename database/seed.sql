-- ============================================================================
-- UAJS Smart Campus - Datos iniciales de demostracion
-- ============================================================================
-- Ejecutar DESPUES de schema.sql:
--   psql -h localhost -U uajs -d postgres -f database/seed.sql
--
-- Equivale a los seeds de Node (src/seed/seed.js de cada servicio). Es
-- idempotente: cada bloque solo inserta si la tabla esta vacia.
-- Contrasena de los 4 usuarios de prueba: uajs2026 (hash bcrypt, 10 rondas).
-- Orden de ids de usuario: 1 Camilo, 2 Laura, 3 Andres, 4 Admin.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- uajs_usuarios
-- ---------------------------------------------------------------------------
\connect uajs_usuarios

INSERT INTO usuarios (nombre, correo, "passwordHash", rol, programa, activo)
SELECT v.*, TRUE FROM (VALUES
  ('Camilo Ramírez', 'camilo.ramirez@uajs.edu.co', '$2a$10$FZMKeE513D1esXpL9YjFfO..XjzVsQmebuYmO0Yhd/6ieV.BPueXS', 'Estudiante'::enum_usuarios_rol,                'Ingeniería de Sistemas'),
  ('Laura Pérez',    'laura.perez@uajs.edu.co',    '$2a$10$FZMKeE513D1esXpL9YjFfO..XjzVsQmebuYmO0Yhd/6ieV.BPueXS', 'Docente'::enum_usuarios_rol,                   'Facultad de Ingeniería'),
  ('Andrés Gómez',   'andres.gomez@uajs.edu.co',   '$2a$10$FZMKeE513D1esXpL9YjFfO..XjzVsQmebuYmO0Yhd/6ieV.BPueXS', 'Administrativo'::enum_usuarios_rol,            'Bienestar Universitario'),
  ('Admin UAJS',     'admin@uajs.edu.co',          '$2a$10$FZMKeE513D1esXpL9YjFfO..XjzVsQmebuYmO0Yhd/6ieV.BPueXS', 'Administrador del sistema'::enum_usuarios_rol, 'Oficina de Tecnología')
) AS v(nombre, correo, "passwordHash", rol, programa)
WHERE NOT EXISTS (SELECT 1 FROM usuarios);

INSERT INTO permisos (rol, "modulosActivos")
SELECT v.rol::enum_permisos_rol, v.modulos::jsonb FROM (VALUES
  ('Estudiante',     '["inicio","perfil","solicitudes","reservas","eventos","notificaciones","pqrs"]'),
  ('Docente',        '["inicio","perfil","solicitudes","reservas","eventos","notificaciones","pqrs"]'),
  ('Administrativo', '["inicio","perfil","solicitudes","reservas","recursos","eventos","notificaciones","pqrs","reportes"]')
) AS v(rol, modulos)
WHERE NOT EXISTS (SELECT 1 FROM permisos);


-- ---------------------------------------------------------------------------
-- uajs_solicitudes
-- ---------------------------------------------------------------------------
\connect uajs_solicitudes

INSERT INTO solicitudes (id, tipo, dependencia, fecha, prioridad, estado, descripcion, "asignadoA", "solicitanteId", "solicitanteNombre", "rolSolicitante")
SELECT * FROM (VALUES
  ('SOL-0231', 'Certificado académico',          'Registro Académico',     DATE '2026-08-18', 'Media', 'En revisión', 'Solicitud de certificado de notas para trámite externo.',  'Registro Académico',     1, 'Camilo Ramírez', 'Estudiante'),
  ('SOL-0229', 'Corrección de datos personales', 'Registro Académico',     DATE '2026-08-15', 'Alta',  'Asignada',    'Corrección del número de documento registrado.',        'Registro Académico',     1, 'Camilo Ramírez', 'Estudiante'),
  ('SOL-0214', 'Cambio de horario',              'Coordinación Académica', DATE '2026-08-10', 'Baja',  'Resuelta',    'Solicitud de cambio de grupo por cruce de horario.',    'Coordinación Académica', 2, 'Laura Pérez',    'Docente'),
  ('SOL-0198', 'Constancia de matrícula',        'Registro Académico',     DATE '2026-07-30', 'Media', 'Cerrada',     'Constancia solicitada para entidad bancaria.',          'Registro Académico',     1, 'Camilo Ramírez', 'Estudiante')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM solicitudes);

INSERT INTO solicitudes_historial ("solicitudId", estado, fecha, por)
SELECT * FROM (VALUES
  ('SOL-0231', 'Registrada',  DATE '2026-08-18', 'Camilo Ramírez'),
  ('SOL-0231', 'En revisión', DATE '2026-08-19', 'Andrés Gómez'),
  ('SOL-0229', 'Registrada',  DATE '2026-08-15', 'Camilo Ramírez'),
  ('SOL-0229', 'Asignada',    DATE '2026-08-16', 'Andrés Gómez'),
  ('SOL-0214', 'Registrada',  DATE '2026-08-10', 'Laura Pérez'),
  ('SOL-0214', 'Resuelta',    DATE '2026-08-12', 'Andrés Gómez'),
  ('SOL-0198', 'Registrada',  DATE '2026-07-30', 'Camilo Ramírez'),
  ('SOL-0198', 'Cerrada',     DATE '2026-08-02', 'Andrés Gómez')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM solicitudes_historial);

INSERT INTO pqrs (id, tipo, "dirigidoA", asunto, descripcion, estado, respuesta, fecha, "solicitanteId", solicitante, "rolSolicitante", "asignadoA")
SELECT * FROM (VALUES
  ('PQRS-1042', 'Petición',   'Registro Académico',     'Corrección de nota en acta',      'Solicito revisión de la nota registrada en el acta de calificaciones.', 'En gestión', NULL::text,                                                              DATE '2026-08-14', 1, 'Camilo Ramírez', 'Estudiante', 'Laura Pérez'),
  ('PQRS-1037', 'Sugerencia', 'Bienestar Universitario', 'Ampliar horario de la biblioteca', 'Sugiero ampliar el horario de atención los sábados.',                    'Resuelta',   'Se amplió el horario de la biblioteca los sábados hasta las 4:00 p.m.', DATE '2026-07-28', 1, 'Camilo Ramírez', 'Estudiante', 'Andrés Gómez')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM pqrs);

INSERT INTO pqrs_historial ("pqrsId", estado, fecha, por)
SELECT * FROM (VALUES
  ('PQRS-1042', 'Registrada', DATE '2026-08-14', 'Camilo Ramírez'),
  ('PQRS-1042', 'En gestión', DATE '2026-08-15', 'Andrés Gómez'),
  ('PQRS-1037', 'Registrada', DATE '2026-07-28', 'Camilo Ramírez'),
  ('PQRS-1037', 'Resuelta',   DATE '2026-07-30', 'Andrés Gómez')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM pqrs_historial);


-- ---------------------------------------------------------------------------
-- uajs_reservas
-- ---------------------------------------------------------------------------
\connect uajs_reservas

INSERT INTO pabellones (id, nombre)
SELECT l, 'Pabellón ' || l FROM unnest(ARRAY['A','B','C','D']) AS l
WHERE NOT EXISTS (SELECT 1 FROM pabellones);

-- 4 pabellones x 17 salones; capacidad 30,40,50,60 en ciclo (igual que el seed de Node).
INSERT INTO salones (id, "pabellonId", nombre, capacidad)
SELECT p.id || lpad(n::text, 2, '0'), p.id, 'Salón ' || p.id || lpad(n::text, 2, '0'), 30 + ((n - 1) % 4) * 10
FROM pabellones p, generate_series(1, 17) AS n
WHERE NOT EXISTS (SELECT 1 FROM salones);

INSERT INTO salas_especiales (id, nombre, tipo, capacidad)
SELECT * FROM (VALUES
  ('S01', 'Sala S01', 'Auditorio',      80),
  ('S02', 'Sala S02', 'Sala de juntas', 20),
  ('S03', 'Sala S03', 'Laboratorio',    25),
  ('S04', 'Sala S04', 'Sala múltiple',  40)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM salas_especiales);

INSERT INTO salas_biblioteca (id, nombre, capacidad)
SELECT * FROM (VALUES
  ('B01', 'Sala de lectura 1',       6),
  ('B02', 'Sala de lectura 2',       6),
  ('B03', 'Sala de estudio grupal', 10)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM salas_biblioteca);

INSERT INTO equipos (codigo, nombre, tipo, stock)
SELECT * FROM (VALUES
  ('REC-001', 'Videobeam Epson X400',   'Audiovisual',       4),
  ('REC-014', 'Portátil Dell Latitude', 'Equipo de cómputo', 8),
  ('REC-031', 'Amplificador portátil',  'Audiovisual',       2)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM equipos);

INSERT INTO reservas (id, "tipoEspacio", espacio, fecha, "horaInicio", "horaFin", motivo, estado, "solicitanteId", "solicitanteNombre", "rolSolicitante")
SELECT * FROM (VALUES
  ('RES-0118', 'espacio', 'Salón B05',              DATE '2026-08-19', '08:00', '10:00', 'Clase de Bases de Datos',                 'Confirmada', 2, 'Laura Pérez',    'Docente'),
  ('RES-0121', 'espacio', 'Sala S02',               DATE '2026-08-22', '14:00', '16:00', 'Reunión de semillero de investigación',   'Pendiente',  2, 'Laura Pérez',    'Docente'),
  ('RES-0102', 'espacio', 'Sala S02',               DATE '2026-08-12', '09:00', '11:00', 'Taller de emprendimiento',                'Cancelada',  3, 'Andrés Gómez',   'Administrativo'),
  ('RES-0130', 'equipo',  'Portátil Dell Latitude', DATE '2026-08-23', '10:00', '12:00', 'Sustentación de proyecto final',         'Pendiente',  1, 'Camilo Ramírez', 'Estudiante')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM reservas);

INSERT INTO reservas_historial ("reservaId", estado, fecha, por)
SELECT * FROM (VALUES
  ('RES-0118', 'Pendiente',  DATE '2026-08-17', 'Laura Pérez'),
  ('RES-0118', 'Confirmada', DATE '2026-08-17', 'Andrés Gómez'),
  ('RES-0121', 'Pendiente',  DATE '2026-08-20', 'Laura Pérez'),
  ('RES-0102', 'Pendiente',  DATE '2026-08-10', 'Andrés Gómez'),
  ('RES-0102', 'Cancelada',  DATE '2026-08-11', 'Andrés Gómez'),
  ('RES-0130', 'Pendiente',  DATE '2026-08-21', 'Camilo Ramírez')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM reservas_historial);


-- ---------------------------------------------------------------------------
-- uajs_recursos
-- ---------------------------------------------------------------------------
\connect uajs_recursos

INSERT INTO recursos (codigo, nombre, tipo, ubicacion, estado)
SELECT v.codigo, v.nombre, v.tipo, v.ubicacion, v.estado::enum_recursos_estado FROM (VALUES
  ('REC-001', 'Videobeam Epson X400',   'Audiovisual',       'Almacén Pabellón A', 'Disponible'),
  ('REC-014', 'Portátil Dell Latitude', 'Equipo de cómputo', 'Sala S03',           'En mantenimiento'),
  ('REC-031', 'Amplificador portátil',  'Audiovisual',       'Sala S01',           'Disponible')
) AS v(codigo, nombre, tipo, ubicacion, estado)
WHERE NOT EXISTS (SELECT 1 FROM recursos);

INSERT INTO recursos_historial ("recursoCodigo", estado, fecha, por)
SELECT codigo, estado::text, DATE '2026-07-15', 'Sistema' FROM recursos
WHERE NOT EXISTS (SELECT 1 FROM recursos_historial);


-- ---------------------------------------------------------------------------
-- uajs_eventos
-- ---------------------------------------------------------------------------
\connect uajs_eventos

INSERT INTO eventos (titulo, fecha, hora, lugar, ponente, descripcion, facultad, estado, "cupoMaximo")
SELECT v.titulo, v.fecha, v.hora, v.lugar, v.ponente, v.descripcion, v.facultad, v.estado::enum_eventos_estado, v."cupoMaximo" FROM (VALUES
  ('Semana de la Ingeniería',                          DATE '2026-09-02', '09:00', 'Sala S01',  'Facultad de Ingeniería', 'Actividades y charlas durante toda la semana.',        'Facultad de Ciencias de la Ingeniería', 'Activo', NULL::integer),
  ('Conferencia: Sistemas Distribuidos en la práctica', DATE '2026-09-05', '15:00', 'Salón B10', 'Ing. Marcela Torres',    'Charla sobre arquitecturas distribuidas aplicadas.', 'Facultad de Ciencias de la Ingeniería', 'Activo', 40),
  ('Taller de emprendimiento universitario',           DATE '2026-09-10', '10:00', 'Sala S04',  'Bienestar Universitario', 'Taller práctico para nuevos emprendedores UAJS.',    'General / Bienestar Universitario',     'Activo', 25)
) AS v(titulo, fecha, hora, lugar, ponente, descripcion, facultad, estado, "cupoMaximo")
WHERE NOT EXISTS (SELECT 1 FROM eventos);

INSERT INTO inscripciones ("eventoId", "usuarioId", nombre, rol)
SELECT e.id, v.usuario_id, v.nombre, v.rol
FROM (VALUES
  ('Semana de la Ingeniería',                           1, 'Camilo Ramírez', 'Estudiante'),
  ('Conferencia: Sistemas Distribuidos en la práctica', 2, 'Laura Pérez',    'Docente')
) AS v(titulo, usuario_id, nombre, rol)
JOIN eventos e ON e.titulo = v.titulo
WHERE NOT EXISTS (SELECT 1 FROM inscripciones);


-- ---------------------------------------------------------------------------
-- uajs_notificaciones
-- ---------------------------------------------------------------------------
\connect uajs_notificaciones

INSERT INTO notificaciones ("usuarioId", categoria, mensaje, fecha, leida)
SELECT * FROM (VALUES
  (1, 'Solicitudes',   'Tu solicitud SOL-0229 cambió a estado Asignada.',        DATE '2026-08-20', FALSE),
  (1, 'Reservas',      'Reserva aprobada para Salón B05 el 19 de agosto.',       DATE '2026-08-18', FALSE),
  (1, 'Institucional', 'Recuerda inscribirte a la Semana de la Ingeniería.',     DATE '2026-08-17', TRUE),
  (1, 'Solicitudes',   'Tu solicitud SOL-0214 fue resuelta.',                    DATE '2026-08-11', TRUE)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM notificaciones);
