// Define los endpoints disponibles para el servicio de reservas
import { Router } from 'express'
import { obtenerCatalogo, sincronizarEquipo } from '../controllers/catalogo.controller.js'
import { listar, crear, actualizarEstado, historial, eliminar } from '../controllers/reservas.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const reservasRouter = Router()

reservasRouter.get('/catalogo', requireAuth, obtenerCatalogo)
reservasRouter.patch(
  '/equipos/sync',
  requireAuth,
  requireRole('Administrador del sistema'),
  sincronizarEquipo,
)
reservasRouter.get('/', requireAuth, listar)
reservasRouter.post('/', requireAuth, crear)
reservasRouter.patch(
  '/:id/estado',
  requireAuth,
  requireRole('Administrativo', 'Administrador del sistema'),
  actualizarEstado,
)
reservasRouter.get('/:id/historial', requireAuth, historial)
reservasRouter.delete('/:id', requireAuth, eliminar)
