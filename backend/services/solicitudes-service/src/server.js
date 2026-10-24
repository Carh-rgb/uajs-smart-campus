import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { solicitudesRouter } from './routes/solicitudes.routes.js'
import { pqrsRouter } from './routes/pqrs.routes.js'
import { seed } from './seed/seed.js'
import { rutaNoEncontrada, manejadorErrores } from './utils/errores.js'

const app = express()
const PORT = process.env.PORT || 4002

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'solicitudes-service' }))

app.use('/solicitudes', solicitudesRouter)
app.use('/pqrs', pqrsRouter)

// 404 para rutas inexistentes y manejador central de errores (ver utils/errores.js).
app.use(rutaNoEncontrada)
app.use(manejadorErrores('solicitudes'))

async function start() {
  await sequelize.authenticate()
  await sequelize.sync()
  await seed()
  app.listen(PORT, () => console.log(`[solicitudes-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[solicitudes-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
