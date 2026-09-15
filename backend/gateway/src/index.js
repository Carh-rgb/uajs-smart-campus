/**
 * API Gateway — UAJS Smart Campus
 * ================================
 * Punto de entrada unico para el frontend (puerto 5183). Todo lo que el
 * frontend llama bajo /api/* pasa por aqui y se reenvia (proxy) al
 * microservicio que corresponda segun el prefijo de la ruta.
 *
 * Que SI hace este archivo:
 *  - Enrutar cada prefijo /api/<algo> hacia el microservicio dueño de ese
 *    dominio (ver el arreglo "rutas" mas abajo).
 *  - Manejar errores de conexion hacia los microservicios (502 en vez de
 *    dejar la peticion colgada).
 *  - Exponer /health, que ahora chequea en vivo los 7 microservicios.
 *  - Loggear cada peticion que pasa por el gateway.
 *
 * Que NO hace (a proposito):
 *  - No valida JWT ni sesiones: cada microservicio protege sus propias
 *    rutas de forma independiente.
 *  - No contiene logica de negocio: es solo enrutamiento.
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
const PORT = process.env.PORT || 4000

// Variables que se esperan en el .env (ver gateway/.env.example). Si falta
// alguna, el gateway igual arranca (usa localhost:<puerto> por defecto),
// pero avisamos por consola para que no sea una sorpresa mas adelante si
// alguien despliega en un servidor real donde localhost no sirve.
const VARIABLES_ESPERADAS = [
  'PORT',
  'FRONTEND_ORIGIN',
  'USUARIOS_SERVICE_URL',
  'SOLICITUDES_SERVICE_URL',
  'RESERVAS_SERVICE_URL',
  'RECURSOS_SERVICE_URL',
  'EVENTOS_SERVICE_URL',
  'NOTIFICACIONES_SERVICE_URL',
  'BUSQUEDA_SERVICE_URL',
]

function validarVariablesDeEntorno() {
  const faltantes = VARIABLES_ESPERADAS.filter((nombre) => !process.env[nombre])
  if (faltantes.length > 0) {
    console.warn(
      `[gateway] Aviso: faltan estas variables en tu .env (se usara un valor por defecto de localhost): ${faltantes.join(', ')}`,
    )
  }
}
validarVariablesDeEntorno()

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183',
  }),
)

// Logging simple de cada peticion que entra al gateway. No se agrega una
// dependencia extra (ej. morgan) porque el proyecto ya no la usa en ningun
// otro servicio y esto cubre lo que necesitamos: metodo, ruta, status y
// tiempo de respuesta.
app.use((req, res, next) => {
  const inicio = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - inicio
    console.log(`[gateway] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`)
  })
  next()
})

// El Gateway es un enrutador puro: no valida JWT ni contiene logica de
// negocio. Cada microservicio protege sus propias rutas.
const rutas = [
  { prefijo: '/api/auth', destino: process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001' },
  { prefijo: '/api/usuarios', destino: process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001' },
  { prefijo: '/api/permisos', destino: process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001' },
  { prefijo: '/api/pqrs', destino: process.env.SOLICITUDES_SERVICE_URL || 'http://localhost:4002' },
  { prefijo: '/api/solicitudes', destino: process.env.SOLICITUDES_SERVICE_URL || 'http://localhost:4002' },
  { prefijo: '/api/reservas', destino: process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003' },
  { prefijo: '/api/recursos', destino: process.env.RECURSOS_SERVICE_URL || 'http://localhost:4004' },
  { prefijo: '/api/eventos', destino: process.env.EVENTOS_SERVICE_URL || 'http://localhost:4005' },
  { prefijo: '/api/notificaciones', destino: process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:4006' },
  { prefijo: '/api/buscar', destino: process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007' },
]

for (const { prefijo, destino } of rutas) {
  // Se monta en la raiz (sin prefijo en app.use) para que Express NO recorte
  // el prefijo de req.url antes de llegar al proxy: http-proxy-middleware v3
  // ya no lo vuelve a anteponer por si solo. pathFilter decide que peticiones
  // le tocan a este proxy, y pathRewrite quita solo el "/api" para que cada
  // microservicio reciba la ruta que realmente expone (ej. /solicitudes/...).
  app.use(
    createProxyMiddleware({
      target: destino,
      changeOrigin: true,
      pathFilter: prefijo,
      pathRewrite: { '^/api': '' },
      on: {
        // Sin esto, si un microservicio esta caido o tarda demasiado, la
        // peticion se queda colgada hasta que el cliente hace timeout y el
        // error solo queda en la consola del gateway. Respondemos 502 para
        // que el frontend pueda mostrar algo util en vez de esperar.
        error: (err, req, res) => {
          console.error(`[gateway] error de proxy hacia ${destino} (${prefijo}):`, err.message)
          if (!res.headersSent) {
            res.status(502).json({
              error: `El servicio detras de ${prefijo} no esta disponible en este momento.`,
            })
          }
        },
      },
    }),
  )
}

// Lista de microservicios unicos (varios prefijos de "rutas" pueden apuntar
// al mismo microservicio, ej. /api/auth y /api/usuarios van los dos a
// usuarios-service) para poder chequear la salud de cada uno una sola vez.
const microservicios = [
  { nombre: 'usuarios', url: process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001' },
  { nombre: 'solicitudes', url: process.env.SOLICITUDES_SERVICE_URL || 'http://localhost:4002' },
  { nombre: 'reservas', url: process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003' },
  { nombre: 'recursos', url: process.env.RECURSOS_SERVICE_URL || 'http://localhost:4004' },
  { nombre: 'eventos', url: process.env.EVENTOS_SERVICE_URL || 'http://localhost:4005' },
  { nombre: 'notificaciones', url: process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:4006' },
  { nombre: 'busqueda', url: process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007' },
]

// Tiempo maximo de espera para cada chequeo individual, para que un
// microservicio colgado no deje /health del gateway esperando indefinido.
const HEALTH_CHECK_TIMEOUT_MS = 2000

async function chequearServicio({ nombre, url }) {
  const inicio = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)
  try {
    const respuesta = await fetch(`${url}/health`, { signal: controller.signal })
    return { servicio: nombre, ok: respuesta.ok, ms: Date.now() - inicio }
  } catch (err) {
    return { servicio: nombre, ok: false, error: err.message, ms: Date.now() - inicio }
  } finally {
    clearTimeout(timeout)
  }
}

// /health ya no es un simple "estoy vivo": pregunta el /health real de cada
// uno de los 7 microservicios en paralelo y arma un reporte agregado. Con
// esto se puede confirmar de un vistazo si todos estan respondiendo, sin
// tener que golpear puerto por puerto a mano.
app.get('/health', async (req, res) => {
  const resultados = await Promise.all(microservicios.map(chequearServicio))
  const todosOk = resultados.every((r) => r.ok)
  res.status(todosOk ? 200 : 503).json({
    status: todosOk ? 'ok' : 'degradado',
    microservicios: resultados,
  })
})

// Cualquier ruta /api/* que no haya calzado con ninguno de los prefijos de
// arriba (ej. un typo) cae aqui en vez de devolver el HTML por defecto de
// Express o quedarse sin respuesta.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta no reconocida: ${req.originalUrl}` })
})

// Manejador de errores general. Cualquier excepcion sincrona lanzada en un
// middleware anterior (fuera del proxy, que ya maneja los suyos arriba)
// termina aqui en vez de tumbar el proceso.
app.use((err, req, res, next) => {
  console.error('[gateway] error no manejado:', err)
  res.status(500).json({ error: 'Error interno del gateway.' })
})

// Apagado ordenado: al recibir Ctrl+C (SIGINT) o una señal de terminacion
// (SIGTERM, la que manda Docker/un orquestador al detener el contenedor),
// dejamos de aceptar conexiones nuevas y cerramos las que ya estaban en
// curso antes de salir, en vez de cortar todo de golpe a mitad de una
// peticion. Si algo no cierra en 5s, forzamos la salida igual.
const servidor = app.listen(PORT, () => {
  console.log(`[gateway] escuchando en http://localhost:${PORT}`)
})

function apagarOrdenadamente(señal) {
  console.log(`[gateway] recibido ${señal}, cerrando ordenadamente...`)
  servidor.close(() => {
    console.log('[gateway] servidor cerrado correctamente.')
    process.exit(0)
  })
  setTimeout(() => {
    console.warn('[gateway] no cerro a tiempo, forzando salida.')
    process.exit(1)
  }, 5000).unref()
}

process.on('SIGINT', () => apagarOrdenadamente('SIGINT'))
process.on('SIGTERM', () => apagarOrdenadamente('SIGTERM'))
