import 'dotenv/config'
import express from 'express'
// Lleva los errores de los controladores async al manejador central en vez
// de dejar la promesa rechazada (en Express 4 eso tumbaba el servicio).
import 'express-async-errors'
import cors from 'cors'
import { asegurarIndice } from './config/elastic.js'
import { buscarRouter } from './routes/buscar.routes.js'
import { backfill } from './seed/backfill.js'
import { normalizarErrores, rutaNoEncontrada, manejadorDeErrores } from './middlewares/errores.js'

const app = express()
const PORT = process.env.PORT || 4007

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(normalizarErrores)
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'busqueda-service' }))

app.use('/buscar', buscarRouter)

app.use(rutaNoEncontrada)
app.use(manejadorDeErrores('busqueda-service'))

async function start() {
  await asegurarIndice()
  app.listen(PORT, () => console.log(`[busqueda-service] escuchando en http://localhost:${PORT}`))
  // No bloquea el arranque: si algun otro servicio todavia no esta listo,
  // el indice queda parcial y se completa con la indexacion incremental
  // normal a medida que se usa la app.
  backfill().catch((err) => console.error('[busqueda-service] fallo el backfill inicial:', err.message))
}

start().catch((err) => {
  console.error('[busqueda-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
