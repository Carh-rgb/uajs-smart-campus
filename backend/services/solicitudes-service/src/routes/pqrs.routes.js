import { Router } from 'express'
import { listar, crear, responder, asignar, historial, eliminar } from '../controllers/pqrs.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const pqrsRouter = Router()

pqrsRouter.get('/', requireAuth, listar)
pqrsRouter.post('/', requireAuth, crear)
pqrsRouter.patch('/:id/responder', requireAuth, responder)
pqrsRouter.patch('/:id/asignar', requireAuth, requireRole('Administrativo', 'Administrador del sistema'), asignar)
pqrsRouter.get('/:id/historial', requireAuth, historial)
pqrsRouter.delete('/:id', requireAuth, eliminar)
