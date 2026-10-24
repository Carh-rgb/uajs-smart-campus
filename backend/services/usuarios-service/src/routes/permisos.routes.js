import { Router } from 'express'
import { listar, alternarModulo } from '../controllers/permisos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const permisosRouter = Router()

permisosRouter.get('/', requireAuth, ah(listar))
permisosRouter.patch(
  '/:rol',
  requireAuth,
  requireRole('Administrador del sistema'),
  ah(alternarModulo),
)
