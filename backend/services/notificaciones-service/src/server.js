import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { notificacionesRouter } from './routes/notificaciones.routes.js'
import { seed } from './seed/seed.js'
import { rutaNoEncontrada, manejadorErrores } from './utils/errores.js'

const app = express()
const PORT = process.env.PORT || 4006

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notificaciones-service' }))

app.use('/notificaciones', notificacionesRouter)

// 404 para rutas inexistentes y manejador central de errores (ver utils/errores.js).
app.use(rutaNoEncontrada)
app.use(manejadorErrores('notificaciones'))

async function start() {
  await sequelize.authenticate()
  // alter:true: la tabla notificaciones ya existia antes de agregar titulo/entidad
  // y el proyecto no usa una herramienta de migraciones aparte de sync().
  await sequelize.sync({ alter: true })
  await seed()
  app.listen(PORT, () => console.log(`[notificaciones-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[notificaciones-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
