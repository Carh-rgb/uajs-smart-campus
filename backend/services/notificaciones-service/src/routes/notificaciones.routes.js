// Define los endpoints disponibles para el servicio de notificaciones
import { Router } from 'express'
import { listar, obtener, crear, actualizar, marcarLeida, marcarTodasLeidas, eliminar } from '../controllers/notificaciones.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const notificacionesRouter = Router()

// Convencion de la API: PUT reemplaza los campos editables de un registro;
// PATCH ejecuta una accion o cambio parcial (marcar como leida).
notificacionesRouter.get('/', requireAuth, ah(listar))
notificacionesRouter.post('/', requireAuth, ah(crear))
notificacionesRouter.patch('/marcar-todas', requireAuth, ah(marcarTodasLeidas))
notificacionesRouter.get('/:id', requireAuth, ah(obtener))
notificacionesRouter.put('/:id', requireAuth, requireRole('Administrador del sistema'), ah(actualizar))
notificacionesRouter.patch('/:id/leida', requireAuth, ah(marcarLeida))
notificacionesRouter.delete('/:id', requireAuth, ah(eliminar))
