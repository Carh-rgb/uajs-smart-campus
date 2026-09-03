import { Router } from 'express'
import { listar, crear, marcarLeida, marcarTodasLeidas } from '../controllers/notificaciones.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const notificacionesRouter = Router()

notificacionesRouter.get('/', requireAuth, listar)
notificacionesRouter.post('/', requireAuth, crear)
notificacionesRouter.patch('/marcar-todas', requireAuth, marcarTodasLeidas)
notificacionesRouter.patch('/:id/leida', requireAuth, marcarLeida)
