// Define los endpoints disponibles para el servicio de notificaciones
import { Router } from 'express'
import { listar, crear, marcarLeida, marcarTodasLeidas, eliminar } from '../controllers/notificaciones.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const notificacionesRouter = Router()

notificacionesRouter.get('/', requireAuth, listar)
notificacionesRouter.post('/', requireAuth, crear)
notificacionesRouter.patch('/marcar-todas', requireAuth, marcarTodasLeidas)
notificacionesRouter.patch('/:id/leida', requireAuth, marcarLeida)
notificacionesRouter.delete('/:id', requireAuth, eliminar)
