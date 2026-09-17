# Seguridad — UAJS Smart Campus

Diagnostico honesto del estado de seguridad del sistema, hecho durante la
dockerizacion (rama `feature/maicol-qa-despliegue`). Pensado para la parte
de evaluacion del proyecto que mira ciberseguridad, no solo funcionalidad.

## Lo que ya esta bien hecho

- **Contraseñas**: se guardan con `bcrypt` (hash de un solo sentido, con
  "sal" incluida), costo 10. Nunca se guarda ni se ve la contraseña real,
  ni siquiera el equipo de desarrollo puede recuperarla — solo resetearla.
- **Token de recuperacion de contraseña**: se genera con
  `crypto.randomBytes(32)` (aleatoriedad criptografica real, no un
  `Math.random()` adivinable) y expira en 1 hora.
- **Sesiones (JWT)**: firmadas con una clave secreta que viene de variables
  de entorno (nunca escrita en el codigo), expiran a las 8 horas.
- **Acceso a la base de datos**: todo pasa por el ORM (Sequelize) con
  parametros — no hay SQL armado a mano concatenando texto, que es la
  puerta de entrada clasica a la inyeccion SQL.
- **Secretos fuera de git**: los `.env` con contraseñas y claves reales
  nunca se suben a GitHub (estan en `.gitignore`); solo se suben las
  plantillas `.env.example` con valores de relleno.

## Corregido en esta misma sesion (antes eran criticos)

**Postgres y Elasticsearch quedaban expuestos a cualquiera en la red.**

El `docker-compose.yml` publicaba los puertos 5432 (Postgres) y 9200
(Elasticsearch) directo al host (`0.0.0.0:5432`, `0.0.0.0:9200`). En tu red
de casa eso ya era un riesgo (cualquier dispositivo en la misma WiFi podia
conectarse a la base de datos sin pasar por ningun microservicio ni login).
Si esto se hubiera desplegado tal cual en un VPS con IP publica, habria
quedado **abierto a todo internet** — y Elasticsearch en particular corre
aqui con la seguridad desactivada (`xpack.security.enabled: false`), que es
uno de los vectores de ataque mas escaneados y explotados que existen (bots
que buscan instancias de Elasticsearch abiertas para robar o borrar datos).

Ya se quito esa exposicion: ningun microservicio la necesitaba, porque
todos se hablan por la red interna de Docker usando el nombre del
contenedor (`postgres`, `elasticsearch`), no por el puerto publicado al
host. El cambio no afecta el funcionamiento del sistema en nada.

Si en algun momento necesitas conectarte a la base de datos desde tu propia
maquina con una herramienta como DBeaver o pgAdmin, la forma segura de
hacerlo es entrar al contenedor directamente:
```bash
docker exec -it uajs-postgres psql -U uajs -d uajs_usuarios
```

## Pendiente de decision del equipo (critico, pero requiere coordinar)

**La clave secreta de los JWT (`JWT_SECRET`) sigue siendo el valor de
relleno que trae el repositorio**: `uajs_smart_campus_dev_secret_change_me`.
Ese valor es visible para cualquiera que vea el repositorio (esta en los
`.env.example`), y con el, cualquiera podria fabricar un token valido
diciendo ser "Administrador del sistema" sin necesidad de contraseña —
esto es responsabilidad de todos los que tengan acceso al repo, no algo
que dockerizar resuelva solo.

No lo cambie automaticamente porque tiene que ser el **mismo valor exacto**
en los 8 `.env` (gateway + los 7 microservicios) — si quedan distintos,
nadie puede iniciar sesion. Antes de desplegar en el VPS real (no solo en
el servidor de pruebas de la casa), generen un secreto nuevo asi:

```bash
NUEVO_SECRETO=$(openssl rand -hex 32)
for f in backend/gateway/.env backend/services/*/.env; do
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NUEVO_SECRETO/" "$f"
done
docker compose up -d --build
```

(Esto cierra la sesion de todos los usuarios conectados en ese momento —
tienen que volver a iniciar sesion. Por eso no lo hago sin avisar.)

## Recomendaciones para antes de exponerlo en un VPS con IP publica

Ordenadas por importancia:

1. **HTTPS**: hoy todo viaja por HTTP plano (sin cifrar) entre el navegador
   y el servidor — cualquiera en la misma red podria interceptar el
   trafico y ver contraseñas, tokens, datos personales. En un VPS con un
   dominio propio, esto se resuelve facil y gratis con Let's Encrypt
   (`certbot`) delante del contenedor de nginx, o usando un proveedor que
   ya de HTTPS automatico (Cloudflare, Railway, Render, etc.).
2. **Firewall del VPS**: dejar cerrado todo excepto los puertos 80/443 (y
   22 para SSH, idealmente solo con llave, sin contraseña). La mayoria de
   proveedores de VPS traen un firewall basico (`ufw` en Ubuntu) que se
   configura en un par de comandos.
3. **Limitar intentos de login** (`express-rate-limit` en el gateway o en
   `usuarios-service`): hoy no hay ningun limite a cuantas veces alguien
   puede intentar adivinar una contraseña por segundo. Es una libreria
   chica de agregar y cierra la puerta a ataques de fuerza bruta.
4. **Cabeceras de seguridad HTTP** (`helmet` en Express): agrega
   proteccion contra varios ataques comunes del lado del navegador
   (clickjacking, sniffing de tipo de contenido, etc.) con una linea de
   codigo por servicio.
5. **Contenedores como usuario no-root**: hoy los contenedores de Node
   corren como root por dentro (el Dockerfile no dice lo contrario). No es
   grave por si solo — Docker ya aisla bastante — pero es una capa extra
   de seguridad barata: agregar `USER node` al Dockerfile.
6. **CORS**: quedo en `"*"` (acepta peticiones de cualquier origen) para
   simplificar las pruebas locales. Para el VPS real, restringirlo al
   dominio real de la aplicacion es mas correcto, aunque el riesgo hoy es
   bajo porque el frontend y la API quedan detras del mismo origen (nginx
   hace de proxy).

Ninguno de estos 6 puntos bloquea que el proyecto funcione o se entregue
tal como esta — son mejoras de "endurecimiento" tipicas de un ambiente de
produccion real, y varias (rate limiting, helmet) se pueden agregar en un
rato si el equipo quiere sumar puntos extra en la parte de seguridad de la
evaluacion.
