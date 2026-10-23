import 'dotenv/config'
import express from 'express'
// Lleva los errores de los controladores async al manejador central en vez
// de dejar la promesa rechazada (en Express 4 eso tumbaba el servicio).
import 'express-async-errors'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { recursosRouter } from './routes/recursos.routes.js'
import { seed } from './seed/seed.js'
import { normalizarErrores, rutaNoEncontrada, manejadorDeErrores } from './middlewares/errores.js'

const app = express()
const PORT = process.env.PORT || 4004

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(normalizarErrores)
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'recursos-service' }))

app.use('/recursos', recursosRouter)

app.use(rutaNoEncontrada)
app.use(manejadorDeErrores('recursos-service'))

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
