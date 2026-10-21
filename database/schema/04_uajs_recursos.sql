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
-- Name: enum_recursos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_recursos_estado AS ENUM (
    'Disponible',
    'En mantenimiento',
    'Fuera de servicio'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: recursos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recursos (
    codigo character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo character varying(255) NOT NULL,
    ubicacion character varying(255) NOT NULL,
    estado public.enum_recursos_estado DEFAULT 'Disponible'::public.enum_recursos_estado NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: recursos_historial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recursos_historial (
    id integer NOT NULL,
    "recursoCodigo" character varying(255) NOT NULL,
    estado character varying(255) NOT NULL,
    fecha date NOT NULL,
    por character varying(255) NOT NULL
);


--
-- Name: recursos_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recursos_historial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recursos_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recursos_historial_id_seq OWNED BY public.recursos_historial.id;


--
-- Name: recursos_historial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_historial ALTER COLUMN id SET DEFAULT nextval('public.recursos_historial_id_seq'::regclass);


--
-- Name: recursos_historial recursos_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_historial
    ADD CONSTRAINT recursos_historial_pkey PRIMARY KEY (id);


--
-- Name: recursos recursos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos
    ADD CONSTRAINT recursos_pkey PRIMARY KEY (codigo);


--
-- Name: recursos_historial recursos_historial_recursoCodigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_historial
    ADD CONSTRAINT "recursos_historial_recursoCodigo_fkey" FOREIGN KEY ("recursoCodigo") REFERENCES public.recursos(codigo) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


