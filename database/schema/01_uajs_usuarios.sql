--
-- PostgreSQL database dump
--



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_permisos_rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_permisos_rol AS ENUM (
    'Estudiante',
    'Docente',
    'Administrativo'
);


--
-- Name: enum_usuarios_rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_usuarios_rol AS ENUM (
    'Estudiante',
    'Docente',
    'Administrativo',
    'Administrador del sistema'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    rol public.enum_permisos_rol NOT NULL,
    "modulosActivos" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    correo character varying(255) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    rol public.enum_usuarios_rol NOT NULL,
    programa character varying(255),
    activo boolean DEFAULT true NOT NULL,
    "correoRecuperacion" character varying(255),
    "fotoPerfil" text,
    telefono character varying(255),
    direccion character varying(255),
    "fechaNacimiento" date,
    genero character varying(255),
    "tipoDocumento" character varying(255),
    "numeroDocumento" character varying(255),
    "codigoEstudiantil" character varying(255),
    semestre character varying(255),
    area character varying(255),
    asignaturas character varying(255),
    cargo character varying(255),
    oficina character varying(255),
    extension character varying(255),
    "contactoEmergenciaNombre" character varying(255),
    "contactoEmergenciaRelacion" character varying(255),
    "contactoEmergenciaTelefono" character varying(255),
    "resetToken" character varying(255),
    "resetTokenExpira" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_rol_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_rol_key UNIQUE (rol);


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--


