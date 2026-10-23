// Define los endpoints disponibles para el servicio de notificaciones
import { Router } from 'express'
import { listar, obtener, crear, crearInterna, marcarLeida, marcarTodasLeidas, eliminar } from '../controllers/notificaciones.controller.js'
import { requireAuth, requireServicio } from '../middlewares/auth.js'

export const notificacionesRouter = Router()

notificacionesRouter.get('/', requireAuth, listar)
notificacionesRouter.post('/', requireAuth, crear)
notificacionesRouter.post('/interna', requireAuth, requireServicio, crearInterna)
notificacionesRouter.patch('/marcar-todas', requireAuth, marcarTodasLeidas)
notificacionesRouter.get('/:id', requireAuth, obtener)
notificacionesRouter.patch('/:id/leida', requireAuth, marcarLeida)
notificacionesRouter.delete('/:id', requireAuth, eliminar)
