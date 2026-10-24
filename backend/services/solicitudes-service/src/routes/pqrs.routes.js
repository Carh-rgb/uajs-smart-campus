import { Router } from 'express'
import { listar, obtener, crear, actualizar, responder, asignar, historial, eliminar } from '../controllers/pqrs.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const pqrsRouter = Router()

pqrsRouter.get('/', requireAuth, ah(listar))
pqrsRouter.get('/:id', requireAuth, ah(obtener))
pqrsRouter.post('/', requireAuth, ah(crear))
pqrsRouter.put('/:id', requireAuth, ah(actualizar))
pqrsRouter.patch('/:id/responder', requireAuth, ah(responder))
pqrsRouter.patch('/:id/asignar', requireAuth, requireRole('Administrativo', 'Administrador del sistema'), ah(asignar))
pqrsRouter.get('/:id/historial', requireAuth, ah(historial))
pqrsRouter.delete('/:id', requireAuth, ah(eliminar))
