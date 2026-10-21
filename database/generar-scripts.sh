#!/usr/bin/env bash
# Regenera database/schema/*.sql y database/seed/*.sql a partir de las bases
# que crean los microservicios (Sequelize sync + seed al arrancar).
#
# Cuándo correrlo: después de cambiar un modelo (campo nuevo, restricción,
# relación) o los datos de prueba de un seed.js.
#
# Pasos:
#   1. Bases vacías: docker compose down -v && docker compose up -d   (en backend/)
#   2. Arrancar los servicios una vez (npm run dev en backend/) para que creen
#      las tablas y siembren los datos; luego detenerlos.
#   3. Desde la raíz del repo:  bash database/generar-scripts.sh
#
# Por defecto usa el pg_dump del contenedor uajs-postgres. Para usar un
# PostgreSQL local:  PG_DUMP="pg_dump -h localhost -U uajs" bash database/generar-scripts.sh
set -euo pipefail

PG_DUMP="${PG_DUMP:-docker exec uajs-postgres pg_dump -U uajs}"
DIR="$(cd "$(dirname "$0")" && pwd)"
BASES=(uajs_usuarios uajs_solicitudes uajs_reservas uajs_recursos uajs_eventos uajs_notificaciones)

mkdir -p "$DIR/schema" "$DIR/seed"

# Quita lo que cambia en cada ejecución (versión de pg_dump y la llave
# aleatoria de \restrict) para que los archivos solo cambien cuando cambie
# el modelo, y para que se puedan correr en pgAdmin/DBeaver, no solo en psql.
limpiar() { sed -e '/^\\restrict /d' -e '/^\\unrestrict /d' -e '/^-- Dumped from/d' -e '/^-- Dumped by/d'; }

i=1
for base in "${BASES[@]}"; do
  n=$(printf '%02d' "$i")
  $PG_DUMP -d "$base" --schema-only --no-owner --no-privileges | limpiar > "$DIR/schema/${n}_${base}.sql"
  $PG_DUMP -d "$base" --data-only --column-inserts --no-owner --no-privileges | limpiar > "$DIR/seed/${n}_${base}.sql"
  echo "ok  $base"
  i=$((i + 1))
done
