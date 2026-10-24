import { Router } from 'express'
import { listar, obtener, crear, actualizar, actualizarEstado, historial, eliminar } from '../controllers/recursos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const recursosRouter = Router()

const puedeAdministrar = requireRole('Administrativo', 'Administrador del sistema')

// Convencion de la API: PUT reemplaza los campos editables de un registro;
// PATCH ejecuta una accion o cambio parcial (estado). PATCH /:codigo se
// conserva como alias de PUT por compatibilidad con el frontend.
recursosRouter.get('/', requireAuth, ah(listar))
recursosRouter.post('/', requireAuth, puedeAdministrar, ah(crear))
recursosRouter.get('/:codigo', requireAuth, ah(obtener))
recursosRouter.put('/:codigo', requireAuth, puedeAdministrar, ah(actualizar))
recursosRouter.patch('/:codigo', requireAuth, puedeAdministrar, ah(actualizar))
recursosRouter.patch('/:codigo/estado', requireAuth, puedeAdministrar, ah(actualizarEstado))
recursosRouter.get('/:codigo/historial', requireAuth, puedeAdministrar, ah(historial))
recursosRouter.delete('/:codigo', requireAuth, puedeAdministrar, ah(eliminar))
