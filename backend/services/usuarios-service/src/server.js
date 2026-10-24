import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { authRouter } from './routes/auth.routes.js'
import { usuariosRouter } from './routes/usuarios.routes.js'
import { permisosRouter } from './routes/permisos.routes.js'
import { seed } from './seed/seed.js'
import { rutaNoEncontrada, manejadorErrores } from './utils/errores.js'

const app = express()
const PORT = process.env.PORT || 4001

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
// Limite elevado porque la foto de perfil viaja como data URL (base64)
// en el cuerpo del PATCH de perfil.
app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'usuarios-service' }))

app.use('/auth', authRouter)
app.use('/usuarios', usuariosRouter)
app.use('/permisos', permisosRouter)

// 404 para rutas inexistentes y manejador central de errores (ver utils/errores.js).
app.use(rutaNoEncontrada)
app.use(manejadorErrores('usuarios'))

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
