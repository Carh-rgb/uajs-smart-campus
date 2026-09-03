import { Router } from 'express'
import { obtenerCatalogo } from '../controllers/catalogo.controller.js'
import { listar, crear, actualizarEstado, historial } from '../controllers/reservas.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const reservasRouter = Router()

reservasRouter.get('/catalogo', requireAuth, obtenerCatalogo)
reservasRouter.get('/', requireAuth, listar)
reservasRouter.post('/', requireAuth, crear)
reservasRouter.patch(
  '/:id/estado',
  requireAuth,
  requireRole('Administrativo', 'Administrador del sistema'),
  actualizarEstado,
)
reservasRouter.get('/:id/historial', requireAuth, historial)
