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
    }),
  )
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicios: rutas.map((r) => r.prefijo) })
})

app.listen(PORT, () => {
  console.log(`[gateway] escuchando en http://localhost:${PORT}`)
})
// prueba de commit - Arnovis
