import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { asegurarIndice } from './config/elastic.js'
import { buscarRouter } from './routes/buscar.routes.js'
import { backfill } from './seed/backfill.js'

const app = express()
const PORT = process.env.PORT || 4007

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'busqueda-service' }))

app.use('/buscar', buscarRouter)

app.use((err, req, res, next) => {
  console.error('[busqueda-service]', err)
  res.status(500).json({ error: 'Error interno del servicio de busqueda.' })
})

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
