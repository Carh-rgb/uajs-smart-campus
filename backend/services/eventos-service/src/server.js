import 'dotenv/config'
import express from 'express'
// Lleva los errores de los controladores async al manejador central en vez
// de dejar la promesa rechazada (en Express 4 eso tumbaba el servicio).
import 'express-async-errors'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { eventosRouter } from './routes/eventos.routes.js'
import { seed } from './seed/seed.js'
import { normalizarErrores, rutaNoEncontrada, manejadorDeErrores } from './middlewares/errores.js'

const app = express()
const PORT = process.env.PORT || 4005

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(normalizarErrores)
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'eventos-service' }))

app.use('/eventos', eventosRouter)

app.use(rutaNoEncontrada)
app.use(manejadorDeErrores('eventos-service'))

async function start() {
  await sequelize.authenticate()
  // alter:true (solo aqui, no en los demas servicios): la tabla eventos ya
  // tenia filas antes de agregar facultad/estado/cupoMaximo, y este
  // proyecto no usa una herramienta de migraciones aparte de sync().
  await sequelize.sync({ alter: true })
  await seed()
  app.listen(PORT, () => console.log(`[eventos-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[eventos-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
