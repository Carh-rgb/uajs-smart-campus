# Etapa 1: build de la app React con Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# La API se llama por ruta relativa /api (el proxy de nginx la reenvia al
# gateway internamente). Asi el build NO depende de conocer de antemano la
# IP del servidor donde se despliegue.
ENV VITE_API_URL=/api
RUN npm run build

# Etapa 2: servir los estaticos + proxy hacia el gateway, con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
