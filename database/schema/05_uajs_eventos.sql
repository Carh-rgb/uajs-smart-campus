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
-- Name: enum_eventos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_eventos_estado AS ENUM (
    'Activo',
    'Inactivo',
    'Cancelado'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    fecha date NOT NULL,
    hora character varying(255) NOT NULL,
    "horaFin" character varying(255),
    lugar character varying(255) NOT NULL,
    ponente character varying(255) NOT NULL,
    descripcion text,
    facultad character varying(255) DEFAULT 'General / Bienestar Universitario'::character varying NOT NULL,
    estado public.enum_eventos_estado DEFAULT 'Activo'::public.enum_eventos_estado NOT NULL,
    "cupoMaximo" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eventos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eventos_id_seq OWNED BY public.eventos.id;


--
-- Name: inscripciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscripciones (
    id integer NOT NULL,
    "eventoId" integer NOT NULL,
    "usuarioId" integer NOT NULL,
    nombre character varying(255) NOT NULL,
    rol character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: inscripciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscripciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscripciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscripciones_id_seq OWNED BY public.inscripciones.id;


--
-- Name: eventos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id SET DEFAULT nextval('public.eventos_id_seq'::regclass);


--
-- Name: inscripciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones ALTER COLUMN id SET DEFAULT nextval('public.inscripciones_id_seq'::regclass);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: inscripciones inscripciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_pkey PRIMARY KEY (id);


--
-- Name: inscripciones_evento_id_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inscripciones_evento_id_usuario_id ON public.inscripciones USING btree ("eventoId", "usuarioId");


--
-- Name: inscripciones inscripciones_eventoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT "inscripciones_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES public.eventos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


