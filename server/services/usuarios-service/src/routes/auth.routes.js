import { Router } from 'express'
import {
  login,
  registrar,
  perfil,
  solicitarReset,
  restablecerPassword,
  actualizarPerfil,
  actualizarCorreoRecuperacion,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const authRouter = Router()

authRouter.post('/login', login)
authRouter.post('/register', registrar)
authRouter.get('/me', requireAuth, perfil)
authRouter.post('/forgot-password', solicitarReset)
authRouter.post('/reset-password', restablecerPassword)
authRouter.patch('/perfil', requireAuth, actualizarPerfil)
authRouter.patch('/correo-recuperacion', requireAuth, actualizarCorreoRecuperacion)
