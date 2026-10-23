-- UAJS Smart Campus: una base de datos por microservicio (Entregable 2, 6.2).
-- Se ejecuta conectado a la base "postgres" con psql. Solo crea las bases que
-- falten, así que se puede correr aunque Docker ya haya creado uajs_usuarios
-- (POSTGRES_DB) y las demás (backend/db/init.sql).
SELECT format('CREATE DATABASE %I', nombre)
FROM unnest(ARRAY[
  'uajs_usuarios',
  'uajs_solicitudes',
  'uajs_reservas',
  'uajs_recursos',
  'uajs_eventos',
  'uajs_notificaciones'
]) AS nombre
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = nombre)
\gexec
