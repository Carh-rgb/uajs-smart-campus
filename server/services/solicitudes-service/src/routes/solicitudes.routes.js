import { Router } from 'express'
import { listar, obtener, crear, responder } from '../controllers/solicitudes.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const solicitudesRouter = Router()

const puedeGestionar = requireRole('Administrativo', 'Administrador del sistema')

solicitudesRouter.get('/', requireAuth, listar)
solicitudesRouter.get('/:id', requireAuth, obtener)
solicitudesRouter.post('/', requireAuth, crear)
solicitudesRouter.patch('/:id/responder', requireAuth, puedeGestionar, responder)
