import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { authRouter } from './routes/auth.routes.js'
import { usuariosRouter } from './routes/usuarios.routes.js'
import { permisosRouter } from './routes/permisos.routes.js'
import { seed } from './seed/seed.js'

const app = express()
const PORT = process.env.PORT || 4001

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'usuarios-service' }))

app.use('/auth', authRouter)
app.use('/usuarios', usuariosRouter)
app.use('/permisos', permisosRouter)

app.use((err, req, res, next) => {
  console.error('[usuarios-service]', err)
  res.status(500).json({ error: 'Error interno del servicio de usuarios.' })
})

async function start() {
  await sequelize.authenticate()
  await sequelize.sync()
  await seed()
  app.listen(PORT, () => console.log(`[usuarios-service] escuchando en http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('[usuarios-service] no se pudo iniciar:', err.message)
  process.exit(1)
})
