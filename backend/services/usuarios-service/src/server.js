import 'dotenv/config'
import express from 'express'
// Lleva los errores de los controladores async al manejador central en vez
// de dejar la promesa rechazada (en Express 4 eso tumbaba el servicio).
import 'express-async-errors'
import cors from 'cors'
import { sequelize } from './config/database.js'
import { authRouter } from './routes/auth.routes.js'
import { usuariosRouter } from './routes/usuarios.routes.js'
import { permisosRouter } from './routes/permisos.routes.js'
import { seed } from './seed/seed.js'
import { normalizarErrores, rutaNoEncontrada, manejadorDeErrores } from './middlewares/errores.js'

const app = express()
const PORT = process.env.PORT || 4001

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5183' }))
app.use(normalizarErrores)
// Limite elevado porque la foto de perfil viaja como data URL (base64)
// en el cuerpo del PATCH de perfil.
app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'usuarios-service' }))

app.use('/auth', authRouter)
app.use('/usuarios', usuariosRouter)
app.use('/permisos', permisosRouter)

app.use(rutaNoEncontrada)
app.use(manejadorDeErrores('usuarios-service'))

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
