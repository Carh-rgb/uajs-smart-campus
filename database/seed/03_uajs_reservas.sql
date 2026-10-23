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
-- Data for Name: equipos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.equipos (codigo, nombre, tipo, stock) VALUES ('REC-001', 'Videobeam Epson X400', 'Audiovisual', 4);
INSERT INTO public.equipos (codigo, nombre, tipo, stock) VALUES ('REC-014', 'Portátil Dell Latitude', 'Equipo de cómputo', 8);
INSERT INTO public.equipos (codigo, nombre, tipo, stock) VALUES ('REC-031', 'Amplificador portátil', 'Audiovisual', 2);


--
-- Data for Name: pabellones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pabellones (id, nombre) VALUES ('A', 'Pabellón A');
INSERT INTO public.pabellones (id, nombre) VALUES ('B', 'Pabellón B');
INSERT INTO public.pabellones (id, nombre) VALUES ('C', 'Pabellón C');
INSERT INTO public.pabellones (id, nombre) VALUES ('D', 'Pabellón D');


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reservas (id, "tipoEspacio", espacio, fecha, "horaInicio", "horaFin", motivo, estado, "solicitanteId", "solicitanteNombre", "rolSolicitante", "createdAt", "updatedAt") VALUES ('RES-0118', 'espacio', 'Salón B05', '2026-08-19', '08:00', '10:00', 'Clase de Bases de Datos', 'Confirmada', 2, 'Laura Pérez', 'Docente', '2026-10-21 15:44:26.634-05', '2026-10-21 15:44:26.634-05');
INSERT INTO public.reservas (id, "tipoEspacio", espacio, fecha, "horaInicio", "horaFin", motivo, estado, "solicitanteId", "solicitanteNombre", "rolSolicitante", "createdAt", "updatedAt") VALUES ('RES-0121', 'espacio', 'Sala S02', '2026-08-22', '14:00', '16:00', 'Reunión de semillero de investigación', 'Pendiente', 2, 'Laura Pérez', 'Docente', '2026-10-21 15:44:26.652-05', '2026-10-21 15:44:26.652-05');
INSERT INTO public.reservas (id, "tipoEspacio", espacio, fecha, "horaInicio", "horaFin", motivo, estado, "solicitanteId", "solicitanteNombre", "rolSolicitante", "createdAt", "updatedAt") VALUES ('RES-0102', 'espacio', 'Sala S02', '2026-08-12', '09:00', '11:00', 'Taller de emprendimiento', 'Cancelada', 3, 'Andrés Gómez', 'Administrativo', '2026-10-21 15:44:26.657-05', '2026-10-21 15:44:26.657-05');
INSERT INTO public.reservas (id, "tipoEspacio", espacio, fecha, "horaInicio", "horaFin", motivo, estado, "solicitanteId", "solicitanteNombre", "rolSolicitante", "createdAt", "updatedAt") VALUES ('RES-0130', 'equipo', 'Portátil Dell Latitude', '2026-08-23', '10:00', '12:00', 'Sustentación de proyecto final', 'Pendiente', 1, 'Camilo Ramírez', 'Estudiante', '2026-10-21 15:44:26.662-05', '2026-10-21 15:44:26.662-05');


--
-- Data for Name: reservas_historial; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reservas_historial (id, "reservaId", estado, fecha, por) VALUES (1, 'RES-0118', 'Pendiente', '2026-08-17', 'Laura Pérez');
INSERT INTO public.reservas_historial (id, "reservaId", estado, fecha, por) VALUES (2, 'RES-0118', 'Confirmada', '2026-08-17', 'Andrés Gómez');
INSERT INTO public.reservas_historial (id, "reservaId", estado, fecha, por) VALUES (3, 'RES-0121', 'Pendiente', '2026-08-20', 'Laura Pérez');
INSERT INTO public.reservas_historial (id, "reservaId", estado, fecha, por) VALUES (4, 'RES-0102', 'Pendiente', '2026-08-10', 'Andrés Gómez');
INSERT INTO public.reservas_historial (id, "reservaId", estado, fecha, por) VALUES (5, 'RES-0102', 'Cancelada', '2026-08-11', 'Andrés Gómez');
INSERT INTO public.reservas_historial (id, "reservaId", estado, fecha, por) VALUES (6, 'RES-0130', 'Pendiente', '2026-08-21', 'Camilo Ramírez');


--
-- Data for Name: salas_biblioteca; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.salas_biblioteca (id, nombre, capacidad) VALUES ('B01', 'Sala de lectura 1', 6);
INSERT INTO public.salas_biblioteca (id, nombre, capacidad) VALUES ('B02', 'Sala de lectura 2', 6);
INSERT INTO public.salas_biblioteca (id, nombre, capacidad) VALUES ('B03', 'Sala de estudio grupal', 10);


--
-- Data for Name: salas_especiales; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.salas_especiales (id, nombre, tipo, capacidad) VALUES ('S01', 'Sala S01', 'Auditorio', 80);
INSERT INTO public.salas_especiales (id, nombre, tipo, capacidad) VALUES ('S02', 'Sala S02', 'Sala de juntas', 20);
INSERT INTO public.salas_especiales (id, nombre, tipo, capacidad) VALUES ('S03', 'Sala S03', 'Laboratorio', 25);
INSERT INTO public.salas_especiales (id, nombre, tipo, capacidad) VALUES ('S04', 'Sala S04', 'Sala múltiple', 40);


--
-- Data for Name: salones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A01', 'A', 'Salón A01', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A02', 'A', 'Salón A02', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A03', 'A', 'Salón A03', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A04', 'A', 'Salón A04', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A05', 'A', 'Salón A05', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A06', 'A', 'Salón A06', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A07', 'A', 'Salón A07', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A08', 'A', 'Salón A08', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A09', 'A', 'Salón A09', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A10', 'A', 'Salón A10', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A11', 'A', 'Salón A11', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A12', 'A', 'Salón A12', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A13', 'A', 'Salón A13', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A14', 'A', 'Salón A14', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A15', 'A', 'Salón A15', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A16', 'A', 'Salón A16', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('A17', 'A', 'Salón A17', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B01', 'B', 'Salón B01', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B02', 'B', 'Salón B02', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B03', 'B', 'Salón B03', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B04', 'B', 'Salón B04', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B05', 'B', 'Salón B05', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B06', 'B', 'Salón B06', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B07', 'B', 'Salón B07', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B08', 'B', 'Salón B08', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B09', 'B', 'Salón B09', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B10', 'B', 'Salón B10', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B11', 'B', 'Salón B11', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B12', 'B', 'Salón B12', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B13', 'B', 'Salón B13', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B14', 'B', 'Salón B14', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B15', 'B', 'Salón B15', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B16', 'B', 'Salón B16', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('B17', 'B', 'Salón B17', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C01', 'C', 'Salón C01', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C02', 'C', 'Salón C02', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C03', 'C', 'Salón C03', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C04', 'C', 'Salón C04', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C05', 'C', 'Salón C05', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C06', 'C', 'Salón C06', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C07', 'C', 'Salón C07', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C08', 'C', 'Salón C08', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C09', 'C', 'Salón C09', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C10', 'C', 'Salón C10', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C11', 'C', 'Salón C11', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C12', 'C', 'Salón C12', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C13', 'C', 'Salón C13', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C14', 'C', 'Salón C14', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C15', 'C', 'Salón C15', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C16', 'C', 'Salón C16', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('C17', 'C', 'Salón C17', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D01', 'D', 'Salón D01', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D02', 'D', 'Salón D02', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D03', 'D', 'Salón D03', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D04', 'D', 'Salón D04', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D05', 'D', 'Salón D05', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D06', 'D', 'Salón D06', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D07', 'D', 'Salón D07', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D08', 'D', 'Salón D08', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D09', 'D', 'Salón D09', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D10', 'D', 'Salón D10', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D11', 'D', 'Salón D11', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D12', 'D', 'Salón D12', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D13', 'D', 'Salón D13', 30);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D14', 'D', 'Salón D14', 40);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D15', 'D', 'Salón D15', 50);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D16', 'D', 'Salón D16', 60);
INSERT INTO public.salones (id, "pabellonId", nombre, capacidad) VALUES ('D17', 'D', 'Salón D17', 30);


--
-- Name: reservas_historial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservas_historial_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--


