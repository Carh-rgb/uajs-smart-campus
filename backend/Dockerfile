# Dockerfile generico para el gateway y los 7 microservicios del backend.
# Es un monorepo con npm workspaces, asi que se construye una sola vez
# desde la raiz de backend/ y el build-arg SERVICE_DIR decide que workspace
# se ejecuta en el contenedor final (ej: "gateway" o "services/usuarios-service").
FROM node:20-alpine

WORKDIR /app

# Copiamos primero solo los package.json de cada workspace: si despues solo
# cambia codigo fuente (no dependencias), Docker reusa esta capa cacheada
# y no vuelve a correr "npm ci" (mucho mas rapido en rebuilds).
COPY package.json package-lock.json ./
COPY gateway/package.json gateway/package.json
COPY services/usuarios-service/package.json services/usuarios-service/package.json
COPY services/solicitudes-service/package.json services/solicitudes-service/package.json
COPY services/reservas-service/package.json services/reservas-service/package.json
COPY services/recursos-service/package.json services/recursos-service/package.json
COPY services/eventos-service/package.json services/eventos-service/package.json
COPY services/notificaciones-service/package.json services/notificaciones-service/package.json
COPY services/busqueda-service/package.json services/busqueda-service/package.json

RUN npm ci --omit=dev

# Ahora si copiamos el resto del codigo fuente de todo el backend.
COPY . .

ARG SERVICE_DIR
ENV SERVICE_DIR=${SERVICE_DIR}
WORKDIR /app/${SERVICE_DIR}

# Cada workspace ya define su propio "start" en package.json
# (gateway -> node src/index.js, servicios -> node src/server.js).
CMD ["npm", "start"]
