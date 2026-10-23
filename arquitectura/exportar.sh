#!/usr/bin/env bash
# Exporta cada diagrama Mermaid de arquitectura/README.md a PNG en
# arquitectura/img/ (para el documento técnico PDF).
# Uso, desde la raíz del repo:  bash arquitectura/exportar.sh
# Requiere Node.js; la primera vez npx descarga mermaid-cli (y su navegador).
# Opcional: MMDC_PUPPETEER=ruta/a/config.json para usar un Chromium propio,
#           MMDC="mmdc" si ya tienes mermaid-cli instalado.
set -euo pipefail

MMDC="${MMDC:-npx -y @mermaid-js/mermaid-cli@11.4.2}"

DIR="$(cd "$(dirname "$0")" && pwd)"
NOMBRES=(01-arquitectura-capas 02-comunicacion-servicios 03-secuencia-login 04-secuencia-crear-reserva 05-secuencia-estado-solicitud 06-secuencia-stock-recursos)
TMP="$(mktemp -d)"
mkdir -p "$DIR/img"

# Separa cada bloque ```mermaid ... ``` en un archivo .mmd numerado.
awk -v dir="$TMP" '
  /^```mermaid$/ { n++; dentro=1; next }
  /^```$/ && dentro { dentro=0; next }
  dentro { print > (dir "/" n ".mmd") }
' "$DIR/README.md"

EXTRA=()
if [ -n "${MMDC_PUPPETEER:-}" ]; then EXTRA=(-p "$MMDC_PUPPETEER"); fi

for i in "${!NOMBRES[@]}"; do
  n=$((i + 1))
  $MMDC "${EXTRA[@]}" -i "$TMP/$n.mmd" -o "$DIR/img/${NOMBRES[$i]}.png" -b white -s 2 >/dev/null
  echo "ok  img/${NOMBRES[$i]}.png"
done
rm -rf "$TMP"
