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
-- Data for Name: recursos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.recursos (codigo, nombre, tipo, ubicacion, descripcion, estado, "createdAt", "updatedAt") VALUES ('REC-001', 'Videobeam Epson X400', 'Audiovisual', 'Almacén Pabellón A', NULL, 'Disponible', '2026-10-23 16:00:45.978-05', '2026-10-23 16:00:45.978-05');
INSERT INTO public.recursos (codigo, nombre, tipo, ubicacion, descripcion, estado, "createdAt", "updatedAt") VALUES ('REC-014', 'Portátil Dell Latitude', 'Equipo de cómputo', 'Sala S03', NULL, 'En mantenimiento', '2026-10-23 16:00:45.978-05', '2026-10-23 16:00:45.978-05');
INSERT INTO public.recursos (codigo, nombre, tipo, ubicacion, descripcion, estado, "createdAt", "updatedAt") VALUES ('REC-031', 'Amplificador portátil', 'Audiovisual', 'Sala S01', NULL, 'Disponible', '2026-10-23 16:00:45.978-05', '2026-10-23 16:00:45.978-05');


--
-- Data for Name: recursos_historial; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.recursos_historial (id, "recursoCodigo", estado, fecha, por) VALUES (1, 'REC-001', 'Disponible', '2026-07-15', 'Sistema');
INSERT INTO public.recursos_historial (id, "recursoCodigo", estado, fecha, por) VALUES (2, 'REC-014', 'En mantenimiento', '2026-07-15', 'Sistema');
INSERT INTO public.recursos_historial (id, "recursoCodigo", estado, fecha, por) VALUES (3, 'REC-031', 'Disponible', '2026-07-15', 'Sistema');


--
-- Name: recursos_historial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recursos_historial_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--


