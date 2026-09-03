import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { solicitudesRouter } from './routes/solicitudes.routes.js'
import { pqrsRouter } from './routes/pqrs.routes.js'
import { seed } from './seed/seed.js'

const app = express()
const PORT = process.env.PORT || 4002

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'solicitudes-service' }))

app.use('/solicitudes', solicitudesRouter)
app.use('/pqrs', pqrsRouter)

app.use((err, req, res, next) => {
  console.error('[solicitudes-service]', err)
  res.status(500).json({ error: 'Error interno del servicio de solicitudes.' })
})

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
