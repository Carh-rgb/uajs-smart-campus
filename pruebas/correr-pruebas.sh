#!/usr/bin/env bash
# Corre la colección Postman con newman en 3 pasos (T12 y T14 necesitan
# reiniciar o detener servicios entre corridas) y genera la matriz.
# Requisitos: backend y bases arriba (cd backend && docker compose up -d && npm run dev),
# Node.js y Python 3 con openpyxl (pip install openpyxl).
# Uso, desde la raíz del repo:  bash pruebas/correr-pruebas.sh
set -euo pipefail

COL=postman/UAJS-Smart-Campus.postman_collection.json
ENV=postman/local.postman_environment.json
TMP="$(mktemp -d)"
NEWMAN="npx -y newman@6.2.1"

echo "== Corrida 1: CRUD, reglas de negocio, errores, health y T12 (parte 1)"
$NEWMAN run "$COL" -e "$ENV" \
  --folder "00 · Preparación" --folder "01 · Recursos (CRUD)" --folder "02 · Solicitudes (ciclo de vida)" \
  --folder "03 · Reservas (reglas de negocio)" --folder "04 · Usuarios" --folder "05 · Eventos" \
  --folder "06 · Notificaciones" --folder "07 · Errores y seguridad" --folder "08 · Health checks" \
  --folder "09 · Persistencia (antes de reiniciar)" \
  --reporters cli,json --reporter-json-export "$TMP/corrida1.json"

read -r -p "Reinicia el backend (Ctrl+C en 'npm run dev' y vuelve a correrlo, SIN borrar la base). Enter cuando esté arriba... "
echo "== Corrida 2: T12 (parte 2)"
$NEWMAN run "$COL" -e "$ENV" --folder "00 · Preparación" --folder "10 · Persistencia (después de reiniciar)" \
  --reporters cli,json --reporter-json-export "$TMP/corrida2.json"

read -r -p "Detén solo eventos-service (puerto 4005). Enter cuando esté detenido... "
echo "== Corrida 3: T14"
$NEWMAN run "$COL" -e "$ENV" --folder "00 · Preparación" --folder "11 · Servicio caído" \
  --reporters cli,json --reporter-json-export "$TMP/corrida3.json"

python3 pruebas/generar_matriz.py "$TMP/corrida1.json" "$TMP/corrida2.json" "$TMP/corrida3.json"
rm -rf "$TMP"   # los JSON crudos traen tokens: no se guardan en el repo
