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
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.eventos (id, titulo, fecha, hora, "horaFin", lugar, ponente, descripcion, facultad, estado, "cupoMaximo", "createdAt", "updatedAt") VALUES (1, 'Semana de la Ingeniería', '2026-09-02', '09:00', '12:00', 'Sala S01', 'Facultad de Ingeniería', 'Actividades y charlas durante toda la semana.', 'Facultad de Ciencias de la Ingeniería', 'Activo', NULL, '2026-10-23 16:00:45.88-05', '2026-10-23 16:00:45.88-05');
INSERT INTO public.eventos (id, titulo, fecha, hora, "horaFin", lugar, ponente, descripcion, facultad, estado, "cupoMaximo", "createdAt", "updatedAt") VALUES (2, 'Conferencia: Sistemas Distribuidos en la práctica', '2026-09-05', '15:00', '17:00', 'Salón B10', 'Ing. Marcela Torres', 'Charla sobre arquitecturas distribuidas aplicadas.', 'Facultad de Ciencias de la Ingeniería', 'Activo', 40, '2026-10-23 16:00:45.88-05', '2026-10-23 16:00:45.88-05');
INSERT INTO public.eventos (id, titulo, fecha, hora, "horaFin", lugar, ponente, descripcion, facultad, estado, "cupoMaximo", "createdAt", "updatedAt") VALUES (3, 'Taller de emprendimiento universitario', '2026-09-10', '10:00', '12:00', 'Sala S04', 'Bienestar Universitario', 'Taller práctico para nuevos emprendedores UAJS.', 'General / Bienestar Universitario', 'Activo', 25, '2026-10-23 16:00:45.88-05', '2026-10-23 16:00:45.88-05');


--
-- Data for Name: inscripciones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inscripciones (id, "eventoId", "usuarioId", nombre, rol, "createdAt", "updatedAt") VALUES (1, 1, 1, 'Camilo Ramírez', 'Estudiante', '2026-10-23 16:00:45.9-05', '2026-10-23 16:00:45.9-05');
INSERT INTO public.inscripciones (id, "eventoId", "usuarioId", nombre, rol, "createdAt", "updatedAt") VALUES (2, 2, 2, 'Laura Pérez', 'Docente', '2026-10-23 16:00:45.9-05', '2026-10-23 16:00:45.9-05');


--
-- Name: eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eventos_id_seq', 3, true);


--
-- Name: inscripciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscripciones_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--


