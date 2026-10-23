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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: equipos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipos (
    codigo character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo character varying(255) NOT NULL,
    stock integer DEFAULT 1 NOT NULL
);


--
-- Name: pabellones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pabellones (
    id character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL
);


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas (
    id character varying(255) NOT NULL,
    "tipoEspacio" character varying(255) NOT NULL,
    espacio character varying(255) NOT NULL,
    fecha date NOT NULL,
    "horaInicio" character varying(255) NOT NULL,
    "horaFin" character varying(255) NOT NULL,
    motivo character varying(255) NOT NULL,
    estado character varying(255) DEFAULT 'Pendiente'::character varying NOT NULL,
    "solicitanteId" integer NOT NULL,
    "solicitanteNombre" character varying(255) NOT NULL,
    "rolSolicitante" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_historial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_historial (
    id integer NOT NULL,
    "reservaId" character varying(255) NOT NULL,
    estado character varying(255) NOT NULL,
    fecha date NOT NULL,
    por character varying(255) NOT NULL
);


--
-- Name: reservas_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_historial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_historial_id_seq OWNED BY public.reservas_historial.id;


--
-- Name: salas_biblioteca; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salas_biblioteca (
    id character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    capacidad integer NOT NULL
);


--
-- Name: salas_especiales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salas_especiales (
    id character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo character varying(255) NOT NULL,
    capacidad integer NOT NULL
);


--
-- Name: salones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salones (
    id character varying(255) NOT NULL,
    "pabellonId" character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    capacidad integer NOT NULL
);


--
-- Name: reservas_historial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_historial ALTER COLUMN id SET DEFAULT nextval('public.reservas_historial_id_seq'::regclass);


--
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (codigo);


--
-- Name: pabellones pabellones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pabellones
    ADD CONSTRAINT pabellones_pkey PRIMARY KEY (id);


--
-- Name: reservas_historial reservas_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_historial
    ADD CONSTRAINT reservas_historial_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: salas_biblioteca salas_biblioteca_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas_biblioteca
    ADD CONSTRAINT salas_biblioteca_pkey PRIMARY KEY (id);


--
-- Name: salas_especiales salas_especiales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas_especiales
    ADD CONSTRAINT salas_especiales_pkey PRIMARY KEY (id);


--
-- Name: salones salones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones
    ADD CONSTRAINT salones_pkey PRIMARY KEY (id);


--
-- Name: reservas_historial reservas_historial_reservaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_historial
    ADD CONSTRAINT "reservas_historial_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: salones salones_pabellonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones
    ADD CONSTRAINT "salones_pabellonId_fkey" FOREIGN KEY ("pabellonId") REFERENCES public.pabellones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


