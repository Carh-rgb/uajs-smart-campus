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
-- Data for Name: pqrs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pqrs (id, tipo, "dirigidoA", asunto, descripcion, adjunto, estado, respuesta, "adjuntoRespuesta", "respondidoPor", fecha, "solicitanteId", solicitante, "rolSolicitante", "asignadoA", "createdAt", "updatedAt") VALUES ('PQRS-1042', 'Petición', 'Registro Académico', 'Corrección de nota en acta', 'Solicito revisión de la nota registrada en el acta de calificaciones.', NULL, 'En gestión', NULL, NULL, NULL, '2026-08-14', 1, 'Camilo Ramírez', 'Estudiante', 'Laura Pérez', '2026-10-23 16:00:45.948-05', '2026-10-23 16:00:45.948-05');
INSERT INTO public.pqrs (id, tipo, "dirigidoA", asunto, descripcion, adjunto, estado, respuesta, "adjuntoRespuesta", "respondidoPor", fecha, "solicitanteId", solicitante, "rolSolicitante", "asignadoA", "createdAt", "updatedAt") VALUES ('PQRS-1037', 'Sugerencia', 'Bienestar Universitario', 'Ampliar horario de la biblioteca', 'Sugiero ampliar el horario de atención los sábados.', NULL, 'Resuelta', 'Se amplió el horario de la biblioteca los sábados hasta las 4:00 p.m.', NULL, NULL, '2026-07-28', 1, 'Camilo Ramírez', 'Estudiante', 'Andrés Gómez', '2026-10-23 16:00:45.956-05', '2026-10-23 16:00:45.956-05');


--
-- Data for Name: pqrs_historial; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pqrs_historial (id, "pqrsId", estado, fecha, por) VALUES (1, 'PQRS-1042', 'Registrada', '2026-08-14', 'Camilo Ramírez');
INSERT INTO public.pqrs_historial (id, "pqrsId", estado, fecha, por) VALUES (2, 'PQRS-1042', 'En gestión', '2026-08-15', 'Andrés Gómez');
INSERT INTO public.pqrs_historial (id, "pqrsId", estado, fecha, por) VALUES (3, 'PQRS-1037', 'Registrada', '2026-07-28', 'Camilo Ramírez');
INSERT INTO public.pqrs_historial (id, "pqrsId", estado, fecha, por) VALUES (4, 'PQRS-1037', 'Resuelta', '2026-07-30', 'Andrés Gómez');


--
-- Data for Name: solicitudes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.solicitudes (id, tipo, dependencia, fecha, prioridad, estado, descripcion, "asignadoA", "solicitanteId", "solicitanteNombre", "rolSolicitante", respuesta, "adjuntoRespuesta", "respondidoPor", "fechaRespuesta", "createdAt", "updatedAt") VALUES ('SOL-0231', 'Certificado académico', 'Registro Académico', '2026-08-18', 'Media', 'En revisión', 'Solicitud de certificado de notas para trámite externo.', 'Registro Académico', 1, 'Camilo Ramírez', 'Estudiante', NULL, NULL, NULL, NULL, '2026-10-23 16:00:45.906-05', '2026-10-23 16:00:45.906-05');
INSERT INTO public.solicitudes (id, tipo, dependencia, fecha, prioridad, estado, descripcion, "asignadoA", "solicitanteId", "solicitanteNombre", "rolSolicitante", respuesta, "adjuntoRespuesta", "respondidoPor", "fechaRespuesta", "createdAt", "updatedAt") VALUES ('SOL-0229', 'Corrección de datos personales', 'Registro Académico', '2026-08-15', 'Alta', 'Asignada', 'Corrección del número de documento registrado.', 'Registro Académico', 1, 'Camilo Ramírez', 'Estudiante', NULL, NULL, NULL, NULL, '2026-10-23 16:00:45.926-05', '2026-10-23 16:00:45.926-05');
INSERT INTO public.solicitudes (id, tipo, dependencia, fecha, prioridad, estado, descripcion, "asignadoA", "solicitanteId", "solicitanteNombre", "rolSolicitante", respuesta, "adjuntoRespuesta", "respondidoPor", "fechaRespuesta", "createdAt", "updatedAt") VALUES ('SOL-0214', 'Cambio de horario', 'Coordinación Académica', '2026-08-10', 'Baja', 'Resuelta', 'Solicitud de cambio de grupo por cruce de horario.', 'Coordinación Académica', 2, 'Laura Pérez', 'Docente', NULL, NULL, NULL, NULL, '2026-10-23 16:00:45.935-05', '2026-10-23 16:00:45.935-05');
INSERT INTO public.solicitudes (id, tipo, dependencia, fecha, prioridad, estado, descripcion, "asignadoA", "solicitanteId", "solicitanteNombre", "rolSolicitante", respuesta, "adjuntoRespuesta", "respondidoPor", "fechaRespuesta", "createdAt", "updatedAt") VALUES ('SOL-0198', 'Constancia de matrícula', 'Registro Académico', '2026-07-30', 'Media', 'Cerrada', 'Constancia solicitada para entidad bancaria.', 'Registro Académico', 1, 'Camilo Ramírez', 'Estudiante', NULL, NULL, NULL, NULL, '2026-10-23 16:00:45.94-05', '2026-10-23 16:00:45.94-05');


--
-- Data for Name: solicitudes_historial; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (1, 'SOL-0231', 'Registrada', '2026-08-18', 'Camilo Ramírez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (2, 'SOL-0231', 'En revisión', '2026-08-19', 'Andrés Gómez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (3, 'SOL-0229', 'Registrada', '2026-08-15', 'Camilo Ramírez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (4, 'SOL-0229', 'Asignada', '2026-08-16', 'Andrés Gómez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (5, 'SOL-0214', 'Registrada', '2026-08-10', 'Laura Pérez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (6, 'SOL-0214', 'Resuelta', '2026-08-12', 'Andrés Gómez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (7, 'SOL-0198', 'Registrada', '2026-07-30', 'Camilo Ramírez');
INSERT INTO public.solicitudes_historial (id, "solicitudId", estado, fecha, por) VALUES (8, 'SOL-0198', 'Cerrada', '2026-08-02', 'Andrés Gómez');


--
-- Name: pqrs_historial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pqrs_historial_id_seq', 4, true);


--
-- Name: solicitudes_historial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.solicitudes_historial_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--


