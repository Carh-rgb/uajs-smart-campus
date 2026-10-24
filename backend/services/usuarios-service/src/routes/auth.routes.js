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
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const authRouter = Router()

authRouter.post('/login', ah(login))
// Solo el Administrador crea cuentas (la pantalla de Usuarios); no hay registro publico.
authRouter.post('/register', requireAuth, requireRole('Administrador del sistema'), ah(registrar))
authRouter.get('/me', requireAuth, ah(perfil))
authRouter.post('/forgot-password', ah(solicitarReset))
authRouter.post('/reset-password', ah(restablecerPassword))
authRouter.patch('/perfil', requireAuth, ah(actualizarPerfil))
authRouter.patch('/correo-recuperacion', requireAuth, ah(actualizarCorreoRecuperacion))
