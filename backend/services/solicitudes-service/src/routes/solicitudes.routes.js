import { Router } from 'express'
import { listar, obtener, historial, crear, actualizar, responder, eliminar } from '../controllers/solicitudes.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const solicitudesRouter = Router()

const puedeGestionar = requireRole('Administrativo', 'Administrador del sistema')

// Convencion de la API: PUT reemplaza los campos editables de un registro;
// PATCH ejecuta una accion o cambio parcial (estado, respuesta, asignacion).
solicitudesRouter.get('/', requireAuth, ah(listar))
solicitudesRouter.get('/:id', requireAuth, ah(obtener))
solicitudesRouter.get('/:id/historial', requireAuth, ah(historial))
solicitudesRouter.post('/', requireAuth, ah(crear))
solicitudesRouter.put('/:id', requireAuth, ah(actualizar))
solicitudesRouter.patch('/:id/responder', requireAuth, puedeGestionar, ah(responder))
solicitudesRouter.patch('/:id/estado', requireAuth, puedeGestionar, ah(responder))
solicitudesRouter.delete('/:id', requireAuth, ah(eliminar))
