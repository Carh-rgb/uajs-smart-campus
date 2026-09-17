#!/usr/bin/env bash
# Prepara los archivos .env necesarios para levantar el proyecto con Docker.
# Se corre UNA sola vez, justo despues de clonar el repo en un servidor nuevo
# (o en tu maquina). No pisa archivos .env que ya existan.
set -e

echo "== Preparando archivos .env =="

# 1) .env de la raiz (PUBLIC_URL: de donde se va a acceder al sistema)
if [ ! -f .env ]; then
  IP_DETECTADA=$(hostname -I 2>/dev/null | awk '{print $1}')
  DEFAULT_URL="http://${IP_DETECTADA:-localhost}"
  read -p "URL publica donde se va a acceder al sistema [$DEFAULT_URL]: " PUBLIC_URL_INPUT
  PUBLIC_URL_INPUT=${PUBLIC_URL_INPUT:-$DEFAULT_URL}
  echo "PUBLIC_URL=$PUBLIC_URL_INPUT" > .env
  echo "  -> Creado .env con PUBLIC_URL=$PUBLIC_URL_INPUT"
else
  echo "  -> .env ya existe, no se toca"
fi

# 2) .env de cada microservicio y el gateway, copiados desde su .env.example
SERVICIOS=(
  "backend/gateway"
  "backend/services/usuarios-service"
  "backend/services/solicitudes-service"
  "backend/services/reservas-service"
  "backend/services/recursos-service"
  "backend/services/eventos-service"
  "backend/services/notificaciones-service"
  "backend/services/busqueda-service"
)

for dir in "${SERVICIOS[@]}"; do
  if [ ! -f "$dir/.env" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "  -> Creado $dir/.env (copiado de .env.example)"
  else
    echo "  -> $dir/.env ya existe, no se toca"
  fi
done

echo ""
echo "== Listo =="
echo "Antes de levantar el sistema, si quieres que funcione la recuperacion"
echo "de contraseña por correo, edita:"
echo "  backend/services/usuarios-service/.env"
echo "y coloca un EMAIL_USER real y un EMAIL_PASS (contraseña de aplicacion"
echo "de Google, no la contraseña normal de la cuenta)."
echo ""
echo "Luego corre:"
echo "  docker compose up -d --build"
