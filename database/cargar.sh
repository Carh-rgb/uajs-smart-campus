#!/usr/bin/env bash
# Crea las 6 bases desde cero con los scripts SQL (estructura + datos de prueba).
# Requiere las bases VACÍAS: si los servicios ya arrancaron antes, primero
#   cd backend && docker compose down -v && docker compose up -d
# Uso (desde la raíz del repo, en Git Bash o Linux):  bash database/cargar.sh
# Con un PostgreSQL local:  PSQL="psql -h localhost -U uajs" bash database/cargar.sh
set -euo pipefail

PSQL="${PSQL:-docker exec -i uajs-postgres psql -U uajs}"
DIR="$(cd "$(dirname "$0")" && pwd)"

$PSQL -v ON_ERROR_STOP=1 -q -d postgres < "$DIR/00_crear_bases.sql" > /dev/null
for archivo in "$DIR"/schema/*.sql; do
  nombre=$(basename "$archivo" .sql)   # ej. 02_uajs_solicitudes
  base=${nombre#*_}                    # ej. uajs_solicitudes
  $PSQL -v ON_ERROR_STOP=1 -q -d "$base" < "$archivo" > /dev/null
  $PSQL -v ON_ERROR_STOP=1 -q -d "$base" < "$DIR/seed/$nombre.sql" > /dev/null
  echo "ok  $base (estructura + datos de prueba)"
done
