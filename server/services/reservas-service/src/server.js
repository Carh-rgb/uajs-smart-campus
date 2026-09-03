import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { reservasRouter } from './routes/reservas.routes.js'
import { seed } from './seed/seed.js'

const app = express()
const PORT = process.env.PORT || 4003

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'reservas-service' }))

app.use('/reservas', reservasRouter)

app.use((err, req, res, next) => {
  console.error('[reservas-service]', err)
  res.status(500).json({ error: 'Error interno del servicio de reservas.' })
})

async function start() {
  await sequelize.authenticate()
  await sequelize.sync()
  await seed()
  app.listen(PORT, () => console.log(`[reservas-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[reservas-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
