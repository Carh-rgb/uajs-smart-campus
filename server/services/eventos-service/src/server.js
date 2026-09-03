import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { eventosRouter } from './routes/eventos.routes.js'
import { seed } from './seed/seed.js'

const app = express()
const PORT = process.env.PORT || 4005

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'eventos-service' }))

app.use('/eventos', eventosRouter)

app.use((err, req, res, next) => {
  console.error('[eventos-service]', err)
  res.status(500).json({ error: 'Error interno del servicio de eventos.' })
})

async function start() {
  await sequelize.authenticate()
  await sequelize.sync()
  await seed()
  app.listen(PORT, () => console.log(`[eventos-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[eventos-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
