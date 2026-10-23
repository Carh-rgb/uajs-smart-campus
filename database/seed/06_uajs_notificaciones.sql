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
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notificaciones (id, "usuarioId", categoria, mensaje, fecha, leida, "createdAt", "updatedAt") VALUES (1, 1, 'Solicitudes', 'Tu solicitud SOL-0229 cambió a estado Asignada.', '2026-08-20', false, '2026-10-21 15:44:26.502-05', '2026-10-21 15:44:26.502-05');
INSERT INTO public.notificaciones (id, "usuarioId", categoria, mensaje, fecha, leida, "createdAt", "updatedAt") VALUES (2, 1, 'Reservas', 'Reserva aprobada para Salón B05 el 19 de agosto.', '2026-08-18', false, '2026-10-21 15:44:26.502-05', '2026-10-21 15:44:26.502-05');
INSERT INTO public.notificaciones (id, "usuarioId", categoria, mensaje, fecha, leida, "createdAt", "updatedAt") VALUES (3, 1, 'Institucional', 'Recuerda inscribirte a la Semana de la Ingeniería.', '2026-08-17', true, '2026-10-21 15:44:26.502-05', '2026-10-21 15:44:26.502-05');
INSERT INTO public.notificaciones (id, "usuarioId", categoria, mensaje, fecha, leida, "createdAt", "updatedAt") VALUES (4, 1, 'Solicitudes', 'Tu solicitud SOL-0214 fue resuelta.', '2026-08-11', true, '2026-10-21 15:44:26.502-05', '2026-10-21 15:44:26.502-05');


--
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificaciones_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--


