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
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.permisos (id, rol, "modulosActivos", "createdAt", "updatedAt") VALUES (1, 'Estudiante', '["inicio", "perfil", "solicitudes", "reservas", "eventos", "notificaciones", "pqrs"]', '2026-10-23 16:00:46.092-05', '2026-10-23 16:00:46.092-05');
INSERT INTO public.permisos (id, rol, "modulosActivos", "createdAt", "updatedAt") VALUES (2, 'Docente', '["inicio", "perfil", "solicitudes", "reservas", "eventos", "notificaciones", "pqrs"]', '2026-10-23 16:00:46.092-05', '2026-10-23 16:00:46.092-05');
INSERT INTO public.permisos (id, rol, "modulosActivos", "createdAt", "updatedAt") VALUES (3, 'Administrativo', '["inicio", "perfil", "solicitudes", "reservas", "recursos", "eventos", "notificaciones", "pqrs", "reportes"]', '2026-10-23 16:00:46.092-05', '2026-10-23 16:00:46.092-05');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usuarios (id, nombre, correo, "passwordHash", rol, programa, activo, "correoRecuperacion", "fotoPerfil", telefono, direccion, "fechaNacimiento", genero, "tipoDocumento", "numeroDocumento", "codigoEstudiantil", semestre, area, asignaturas, cargo, oficina, extension, "contactoEmergenciaNombre", "contactoEmergenciaRelacion", "contactoEmergenciaTelefono", "resetToken", "resetTokenExpira", "createdAt", "updatedAt") VALUES (1, 'Camilo Ramírez', 'camilo.ramirez@uajs.edu.co', '$2a$10$3UbHcsdNqRzRgZuX04cq5uupBkY6ozpJCJEAC3.IHpEY9xr4ILifG', 'Estudiante', 'Ingeniería de Sistemas', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-23 16:00:46.084-05', '2026-10-23 16:00:46.084-05');
INSERT INTO public.usuarios (id, nombre, correo, "passwordHash", rol, programa, activo, "correoRecuperacion", "fotoPerfil", telefono, direccion, "fechaNacimiento", genero, "tipoDocumento", "numeroDocumento", "codigoEstudiantil", semestre, area, asignaturas, cargo, oficina, extension, "contactoEmergenciaNombre", "contactoEmergenciaRelacion", "contactoEmergenciaTelefono", "resetToken", "resetTokenExpira", "createdAt", "updatedAt") VALUES (2, 'Laura Pérez', 'laura.perez@uajs.edu.co', '$2a$10$3UbHcsdNqRzRgZuX04cq5uupBkY6ozpJCJEAC3.IHpEY9xr4ILifG', 'Docente', 'Facultad de Ingeniería', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-23 16:00:46.084-05', '2026-10-23 16:00:46.084-05');
INSERT INTO public.usuarios (id, nombre, correo, "passwordHash", rol, programa, activo, "correoRecuperacion", "fotoPerfil", telefono, direccion, "fechaNacimiento", genero, "tipoDocumento", "numeroDocumento", "codigoEstudiantil", semestre, area, asignaturas, cargo, oficina, extension, "contactoEmergenciaNombre", "contactoEmergenciaRelacion", "contactoEmergenciaTelefono", "resetToken", "resetTokenExpira", "createdAt", "updatedAt") VALUES (3, 'Andrés Gómez', 'andres.gomez@uajs.edu.co', '$2a$10$3UbHcsdNqRzRgZuX04cq5uupBkY6ozpJCJEAC3.IHpEY9xr4ILifG', 'Administrativo', 'Bienestar Universitario', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-23 16:00:46.084-05', '2026-10-23 16:00:46.084-05');
INSERT INTO public.usuarios (id, nombre, correo, "passwordHash", rol, programa, activo, "correoRecuperacion", "fotoPerfil", telefono, direccion, "fechaNacimiento", genero, "tipoDocumento", "numeroDocumento", "codigoEstudiantil", semestre, area, asignaturas, cargo, oficina, extension, "contactoEmergenciaNombre", "contactoEmergenciaRelacion", "contactoEmergenciaTelefono", "resetToken", "resetTokenExpira", "createdAt", "updatedAt") VALUES (4, 'Admin UAJS', 'admin@uajs.edu.co', '$2a$10$3UbHcsdNqRzRgZuX04cq5uupBkY6ozpJCJEAC3.IHpEY9xr4ILifG', 'Administrador del sistema', 'Oficina de Tecnología', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-23 16:00:46.084-05', '2026-10-23 16:00:46.084-05');


--
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permisos_id_seq', 3, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--


