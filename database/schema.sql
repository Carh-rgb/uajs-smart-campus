-- ============================================================================
-- UAJS Smart Campus - Esquema de base de datos (PostgreSQL 16)
-- ============================================================================
-- Una base de datos independiente por microservicio (database per service):
--   uajs_usuarios, uajs_solicitudes, uajs_reservas,
--   uajs_recursos, uajs_eventos,     uajs_notificaciones
--
-- Uso (desde la raiz del repositorio, con el contenedor uajs-postgres arriba):
--   psql -h localhost -U uajs -d postgres -f database/schema.sql
--   psql -h localhost -U uajs -d postgres -f database/seed.sql
-- (clave de desarrollo: uajs_dev_pass)
--
-- Los nombres de tablas y columnas son identicos a los que genera Sequelize
-- en cada servicio, por lo que este script y sequelize.sync() son
-- intercambiables. Todos los CREATE son idempotentes (IF NOT EXISTS).
--
-- Relaciones entre servicios (ej. reservas.solicitanteId -> usuarios.id) son
-- referencias logicas: al ser bases separadas no llevan FOREIGN KEY, y cada
-- servicio las valida por API / JWT.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Bases de datos (CREATE DATABASE no admite IF NOT EXISTS: se usa \gexec)
-- ---------------------------------------------------------------------------
SELECT 'CREATE DATABASE ' || d
FROM (VALUES ('uajs_usuarios'), ('uajs_solicitudes'), ('uajs_reservas'),
             ('uajs_recursos'), ('uajs_eventos'), ('uajs_notificaciones')) AS t(d)
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = t.d)
\gexec


-- ===========================================================================
-- 1. uajs_usuarios  (usuarios-service :4001)
-- ===========================================================================
\connect uajs_usuarios

DO $$ BEGIN
  CREATE TYPE enum_usuarios_rol AS ENUM ('Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_permisos_rol AS ENUM ('Estudiante', 'Docente', 'Administrativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id                           SERIAL PRIMARY KEY,
  nombre                       VARCHAR(255) NOT NULL,
  correo                       VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash"               VARCHAR(255) NOT NULL,           -- bcrypt (10 rondas)
  rol                          enum_usuarios_rol NOT NULL,
  programa                     VARCHAR(255),
  activo                       BOOLEAN NOT NULL DEFAULT TRUE,
  "correoRecuperacion"         VARCHAR(255),
  "fotoPerfil"                 TEXT,                            -- data URL base64
  telefono                     VARCHAR(255),
  direccion                    VARCHAR(255),
  "fechaNacimiento"            DATE,
  genero                       VARCHAR(255),
  "tipoDocumento"              VARCHAR(255),
  "numeroDocumento"            VARCHAR(255),
  "codigoEstudiantil"          VARCHAR(255),
  semestre                     VARCHAR(255),
  area                         VARCHAR(255),
  asignaturas                  VARCHAR(255),
  cargo                        VARCHAR(255),
  oficina                      VARCHAR(255),
  extension                    VARCHAR(255),
  "contactoEmergenciaNombre"   VARCHAR(255),
  "contactoEmergenciaRelacion" VARCHAR(255),
  "contactoEmergenciaTelefono" VARCHAR(255),
  "resetToken"                 VARCHAR(255),
  "resetTokenExpira"           TIMESTAMPTZ,
  "createdAt"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un registro por rol gestionable con los ids de modulo activos.
-- "Administrador del sistema" siempre tiene acceso total y no vive aqui.
CREATE TABLE IF NOT EXISTS permisos (
  id               SERIAL PRIMARY KEY,
  rol              enum_permisos_rol NOT NULL UNIQUE,
  "modulosActivos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===========================================================================
-- 2. uajs_solicitudes  (solicitudes-service :4002) - solicitudes y PQRS
-- ===========================================================================
\connect uajs_solicitudes

CREATE TABLE IF NOT EXISTS solicitudes (
  id                  VARCHAR(255) PRIMARY KEY,                 -- SOL-0231
  tipo                VARCHAR(255) NOT NULL,
  dependencia         VARCHAR(255) NOT NULL,
  fecha               DATE NOT NULL,
  prioridad           VARCHAR(255) NOT NULL DEFAULT 'Media',
  estado              VARCHAR(255) NOT NULL DEFAULT 'Registrada',
  descripcion         TEXT NOT NULL,
  "asignadoA"         VARCHAR(255),
  "solicitanteId"     INTEGER NOT NULL,                         -- ref. logica a usuarios.id
  "solicitanteNombre" VARCHAR(255) NOT NULL,
  "rolSolicitante"    VARCHAR(255) NOT NULL,
  respuesta           TEXT,
  "adjuntoRespuesta"  VARCHAR(255),
  "respondidoPor"     VARCHAR(255),
  "fechaRespuesta"    DATE,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_solicitudes_solicitante ON solicitudes ("solicitanteId");
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado      ON solicitudes (estado);

CREATE TABLE IF NOT EXISTS solicitudes_historial (
  id             SERIAL PRIMARY KEY,
  "solicitudId"  VARCHAR(255) NOT NULL REFERENCES solicitudes (id) ON DELETE CASCADE,
  estado         VARCHAR(255) NOT NULL,
  fecha          DATE NOT NULL,
  por            VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS pqrs (
  id                 VARCHAR(255) PRIMARY KEY,                  -- PQRS-1042
  tipo               VARCHAR(255) NOT NULL,                     -- Peticion, Queja, Reclamo, Sugerencia
  "dirigidoA"        VARCHAR(255) NOT NULL,
  asunto             VARCHAR(255) NOT NULL,
  descripcion        TEXT NOT NULL,
  adjunto            VARCHAR(255),
  estado             VARCHAR(255) NOT NULL DEFAULT 'Registrada',
  respuesta          TEXT,
  "adjuntoRespuesta" VARCHAR(255),
  "respondidoPor"    VARCHAR(255),
  fecha              DATE NOT NULL,
  "solicitanteId"    INTEGER NOT NULL,                          -- ref. logica a usuarios.id
  solicitante        VARCHAR(255) NOT NULL,
  "rolSolicitante"   VARCHAR(255) NOT NULL,
  "asignadoA"        VARCHAR(255) NOT NULL DEFAULT 'Sin asignar',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pqrs_solicitante ON pqrs ("solicitanteId");

CREATE TABLE IF NOT EXISTS pqrs_historial (
  id        SERIAL PRIMARY KEY,
  "pqrsId"  VARCHAR(255) NOT NULL REFERENCES pqrs (id) ON DELETE CASCADE,
  estado    VARCHAR(255) NOT NULL,
  fecha     DATE NOT NULL,
  por       VARCHAR(255) NOT NULL
);


-- ===========================================================================
-- 3. uajs_reservas  (reservas-service :4003) - catalogo y reservas
-- ===========================================================================
\connect uajs_reservas

CREATE TABLE IF NOT EXISTS pabellones (
  id     VARCHAR(255) PRIMARY KEY,                              -- A, B, C, D
  nombre VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS salones (
  id           VARCHAR(255) PRIMARY KEY,                        -- B05
  "pabellonId" VARCHAR(255) NOT NULL REFERENCES pabellones (id),
  nombre       VARCHAR(255) NOT NULL,
  capacidad    INTEGER NOT NULL CHECK (capacidad > 0)
);

CREATE TABLE IF NOT EXISTS salas_especiales (
  id        VARCHAR(255) PRIMARY KEY,                           -- S01
  nombre    VARCHAR(255) NOT NULL,
  tipo      VARCHAR(255) NOT NULL,
  capacidad INTEGER NOT NULL CHECK (capacidad > 0)
);

CREATE TABLE IF NOT EXISTS salas_biblioteca (
  id        VARCHAR(255) PRIMARY KEY,                           -- B01
  nombre    VARCHAR(255) NOT NULL,
  capacidad INTEGER NOT NULL CHECK (capacidad > 0)
);

CREATE TABLE IF NOT EXISTS equipos (
  codigo VARCHAR(255) PRIMARY KEY,                              -- REC-001 (espejo de recursos-service)
  nombre VARCHAR(255) NOT NULL,
  tipo   VARCHAR(255) NOT NULL,
  stock  INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0)
);

CREATE TABLE IF NOT EXISTS reservas (
  id                  VARCHAR(255) PRIMARY KEY,                 -- RES-0118
  "tipoEspacio"       VARCHAR(255) NOT NULL,                    -- 'espacio' | 'equipo'
  espacio             VARCHAR(255) NOT NULL,
  fecha               DATE NOT NULL,
  "horaInicio"        VARCHAR(255) NOT NULL,                    -- 'HH:MM'
  "horaFin"           VARCHAR(255) NOT NULL,                    -- 'HH:MM'
  motivo              VARCHAR(255) NOT NULL,
  estado              VARCHAR(255) NOT NULL DEFAULT 'Pendiente',
  "solicitanteId"     INTEGER NOT NULL,                         -- ref. logica a usuarios.id
  "solicitanteNombre" VARCHAR(255) NOT NULL,
  "rolSolicitante"    VARCHAR(255) NOT NULL,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_reservas_horas CHECK ("horaFin" > "horaInicio")
);
-- Acelera la deteccion de traslapes (mismo espacio, misma fecha).
CREATE INDEX IF NOT EXISTS idx_reservas_espacio_fecha ON reservas (espacio, fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_solicitante   ON reservas ("solicitanteId");

CREATE TABLE IF NOT EXISTS reservas_historial (
  id          SERIAL PRIMARY KEY,
  "reservaId" VARCHAR(255) NOT NULL REFERENCES reservas (id) ON DELETE CASCADE,
  estado      VARCHAR(255) NOT NULL,
  fecha       DATE NOT NULL,
  por         VARCHAR(255) NOT NULL
);


-- ===========================================================================
-- 4. uajs_recursos  (recursos-service :4004)
-- ===========================================================================
\connect uajs_recursos

DO $$ BEGIN
  CREATE TYPE enum_recursos_estado AS ENUM ('Disponible', 'En mantenimiento', 'Fuera de servicio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS recursos (
  codigo      VARCHAR(255) PRIMARY KEY,                         -- REC-001
  nombre      VARCHAR(255) NOT NULL,
  tipo        VARCHAR(255) NOT NULL,
  ubicacion   VARCHAR(255) NOT NULL,
  descripcion TEXT,
  estado      enum_recursos_estado NOT NULL DEFAULT 'Disponible',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recursos_historial (
  id               SERIAL PRIMARY KEY,
  "recursoCodigo"  VARCHAR(255) NOT NULL,                       -- sin FK: el codigo puede renombrarse
  estado           VARCHAR(255) NOT NULL,
  fecha            DATE NOT NULL,
  por              VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recursos_historial_codigo ON recursos_historial ("recursoCodigo");


-- ===========================================================================
-- 5. uajs_eventos  (eventos-service :4005)
-- ===========================================================================
\connect uajs_eventos

DO $$ BEGIN
  CREATE TYPE enum_eventos_estado AS ENUM ('Activo', 'Inactivo', 'Cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS eventos (
  id            SERIAL PRIMARY KEY,
  titulo        VARCHAR(255) NOT NULL,
  fecha         DATE NOT NULL,
  hora          VARCHAR(255) NOT NULL,
  "horaFin"      VARCHAR(255),                           -- opcional; si existe, debe ser posterior a hora
  lugar         VARCHAR(255) NOT NULL,
  ponente       VARCHAR(255) NOT NULL,
  descripcion   TEXT,
  facultad      VARCHAR(255) NOT NULL DEFAULT 'General / Bienestar Universitario',
  estado        enum_eventos_estado NOT NULL DEFAULT 'Activo',
  "cupoMaximo"  INTEGER CHECK ("cupoMaximo" IS NULL OR "cupoMaximo" > 0),  -- NULL = sin limite
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_eventos_horas CHECK ("horaFin" IS NULL OR "horaFin" > hora)
);

CREATE TABLE IF NOT EXISTS inscripciones (
  id            SERIAL PRIMARY KEY,
  "eventoId"    INTEGER NOT NULL REFERENCES eventos (id) ON DELETE CASCADE,
  "usuarioId"   INTEGER NOT NULL,                               -- ref. logica a usuarios.id
  nombre        VARCHAR(255) NOT NULL,
  rol           VARCHAR(255) NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Un usuario no puede inscribirse dos veces al mismo evento.
CREATE UNIQUE INDEX IF NOT EXISTS inscripciones_evento_id_usuario_id ON inscripciones ("eventoId", "usuarioId");


-- ===========================================================================
-- 6. uajs_notificaciones  (notificaciones-service :4006)
-- ===========================================================================
\connect uajs_notificaciones

CREATE TABLE IF NOT EXISTS notificaciones (
  id          SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL,                                 -- ref. logica a usuarios.id
  categoria   VARCHAR(255) NOT NULL,                            -- tipo: Solicitudes, Reservas, Eventos...
  titulo      VARCHAR(255),                                     -- por defecto igual a la categoria
  entidad     VARCHAR(255),                                     -- entidad relacionada (ej. 'solicitud')
  "entidadId" VARCHAR(255),                                     -- id de la entidad relacionada (ej. 'SOL-0231')
  mensaje     VARCHAR(255) NOT NULL,
  fecha       DATE NOT NULL,
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones ("usuarioId", leida);
