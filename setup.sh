#!/usr/bin/env bash
# Prepara el archivo .env de la raíz que usa docker-compose.yml.
# Se corre UNA sola vez en un servidor nuevo (o en tu PC). No pisa un .env
# que ya exista.
#
#   bash setup.sh
#   docker compose up -d --build
#
# Genera secretos aleatorios para JWT_SECRET y la contraseña de Postgres,
# así el despliegue no usa los valores de relleno públicos de los .env.example.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  echo ".env ya existe; no se toca. Bórralo si quieres generarlo de nuevo."
  exit 0
fi

aleatorio() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

IP_DETECTADA=$(hostname -I 2>/dev/null | awk '{print $1}')
URL_POR_DEFECTO="http://${IP_DETECTADA:-localhost}"
read -r -p "URL pública donde se abrirá el sistema [$URL_POR_DEFECTO]: " PUBLIC_URL
PUBLIC_URL=${PUBLIC_URL:-$URL_POR_DEFECTO}
read -r -p "Puerto HTTP del servidor [80]: " HTTP_PORT
HTTP_PORT=${HTTP_PORT:-80}

cat > .env <<EOF
# Generado por setup.sh el $(date '+%Y-%m-%d %H:%M'). NO subir a GitHub.

# Dónde se abre el sistema (se usa para CORS y para los enlaces de correo).
PUBLIC_URL=$PUBLIC_URL
HTTP_PORT=$HTTP_PORT

# Secretos generados al azar para este servidor.
JWT_SECRET=$(aleatorio 32)
POSTGRES_PASSWORD=$(aleatorio 16)

# Contraseña de los usuarios de prueba que crea el seed.
SEED_PASSWORD=uajs2026
JWT_EXPIRES_IN=8h

# Opcional: recuperación de contraseña por correo (contraseña de aplicación de Google).
EMAIL_USER=
EMAIL_PASS=
EOF
chmod 600 .env

echo ""
echo "Listo: .env creado con PUBLIC_URL=$PUBLIC_URL y secretos nuevos."
echo "Ahora corre:  docker compose up -d --build"
