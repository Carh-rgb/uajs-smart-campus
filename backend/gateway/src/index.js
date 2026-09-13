import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
const PORT = process.env.PORT || 4000

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicios: rutas.map((r) => r.prefijo) })
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

app.listen(PORT, () => {
  console.log(`[gateway] escuchando en http://localhost:${PORT}`)
})
