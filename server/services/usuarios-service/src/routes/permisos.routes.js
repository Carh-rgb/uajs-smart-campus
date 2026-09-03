import { Router } from 'express'
import { listar, alternarModulo } from '../controllers/permisos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const permisosRouter = Router()

permisosRouter.get('/', requireAuth, listar)
permisosRouter.patch(
  '/:rol',
  requireAuth,
  requireRole('Administrador del sistema'),
  alternarModulo,
)
