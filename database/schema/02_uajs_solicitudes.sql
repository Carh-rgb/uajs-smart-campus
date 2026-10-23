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
-- Name: pqrs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pqrs (
    id character varying(255) NOT NULL,
    tipo character varying(255) NOT NULL,
    "dirigidoA" character varying(255) NOT NULL,
    asunto character varying(255) NOT NULL,
    descripcion text NOT NULL,
    adjunto character varying(255),
    estado character varying(255) DEFAULT 'Registrada'::character varying NOT NULL,
    respuesta text,
    "adjuntoRespuesta" character varying(255),
    "respondidoPor" character varying(255),
    fecha date NOT NULL,
    "solicitanteId" integer NOT NULL,
    solicitante character varying(255) NOT NULL,
    "rolSolicitante" character varying(255) NOT NULL,
    "asignadoA" character varying(255) DEFAULT 'Sin asignar'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: pqrs_historial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pqrs_historial (
    id integer NOT NULL,
    "pqrsId" character varying(255) NOT NULL,
    estado character varying(255) NOT NULL,
    fecha date NOT NULL,
    por character varying(255) NOT NULL
);


--
-- Name: pqrs_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pqrs_historial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pqrs_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pqrs_historial_id_seq OWNED BY public.pqrs_historial.id;


--
-- Name: solicitudes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes (
    id character varying(255) NOT NULL,
    tipo character varying(255) NOT NULL,
    dependencia character varying(255) NOT NULL,
    fecha date NOT NULL,
    prioridad character varying(255) DEFAULT 'Media'::character varying NOT NULL,
    estado character varying(255) DEFAULT 'Registrada'::character varying NOT NULL,
    descripcion text NOT NULL,
    "asignadoA" character varying(255),
    "solicitanteId" integer NOT NULL,
    "solicitanteNombre" character varying(255) NOT NULL,
    "rolSolicitante" character varying(255) NOT NULL,
    respuesta text,
    "adjuntoRespuesta" character varying(255),
    "respondidoPor" character varying(255),
    "fechaRespuesta" date,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: solicitudes_historial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_historial (
    id integer NOT NULL,
    "solicitudId" character varying(255) NOT NULL,
    estado character varying(255) NOT NULL,
    fecha date NOT NULL,
    por character varying(255) NOT NULL
);


--
-- Name: solicitudes_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitudes_historial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solicitudes_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitudes_historial_id_seq OWNED BY public.solicitudes_historial.id;


--
-- Name: pqrs_historial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pqrs_historial ALTER COLUMN id SET DEFAULT nextval('public.pqrs_historial_id_seq'::regclass);


--
-- Name: solicitudes_historial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_historial ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_historial_id_seq'::regclass);


--
-- Name: pqrs_historial pqrs_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pqrs_historial
    ADD CONSTRAINT pqrs_historial_pkey PRIMARY KEY (id);


--
-- Name: pqrs pqrs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pqrs
    ADD CONSTRAINT pqrs_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_historial solicitudes_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_historial
    ADD CONSTRAINT solicitudes_historial_pkey PRIMARY KEY (id);


--
-- Name: solicitudes solicitudes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_pkey PRIMARY KEY (id);


--
-- Name: pqrs_historial pqrs_historial_pqrsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pqrs_historial
    ADD CONSTRAINT "pqrs_historial_pqrsId_fkey" FOREIGN KEY ("pqrsId") REFERENCES public.pqrs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: solicitudes_historial solicitudes_historial_solicitudId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_historial
    ADD CONSTRAINT "solicitudes_historial_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES public.solicitudes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


