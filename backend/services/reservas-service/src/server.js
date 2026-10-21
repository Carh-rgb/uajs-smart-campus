import 'dotenv/config'
import express from 'express'
// Lleva los errores de los controladores async al manejador central en vez
// de dejar la promesa rechazada (en Express 4 eso tumbaba el servicio).
import 'express-async-errors'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { reservasRouter } from './routes/reservas.routes.js'
import { seed } from './seed/seed.js'
import { normalizarErrores, rutaNoEncontrada, manejadorDeErrores } from './middlewares/errores.js'

const app = express()
const PORT = process.env.PORT || 4003

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(normalizarErrores)
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'reservas-service' }))

app.use('/reservas', reservasRouter)

app.use(rutaNoEncontrada)
app.use(manejadorDeErrores('reservas-service'))

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
