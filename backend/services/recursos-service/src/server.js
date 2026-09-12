import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { recursosRouter } from './routes/recursos.routes.js'
import { seed } from './seed/seed.js'

const app = express()
const PORT = process.env.PORT || 4004

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'recursos-service' }))

app.use('/recursos', recursosRouter)

app.use((err, req, res, next) => {
  console.error('[recursos-service]', err)
  res.status(500).json({ error: 'Error interno del servicio de recursos.' })
})

async function start() {
  await sequelize.authenticate()
  await sequelize.sync()
  await seed()
  app.listen(PORT, () => console.log(`[recursos-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[recursos-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
