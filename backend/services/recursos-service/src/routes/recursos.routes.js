import { Router } from 'express'
import { listar, crear, actualizar, actualizarEstado, historial, eliminar } from '../controllers/recursos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const recursosRouter = Router()

const puedeAdministrar = requireRole('Administrativo', 'Administrador del sistema')

recursosRouter.get('/', requireAuth, listar)
recursosRouter.post('/', requireAuth, puedeAdministrar, crear)
recursosRouter.patch('/:codigo', requireAuth, puedeAdministrar, actualizar)
recursosRouter.patch('/:codigo/estado', requireAuth, puedeAdministrar, actualizarEstado)
recursosRouter.get('/:codigo/historial', requireAuth, puedeAdministrar, historial)
recursosRouter.delete('/:codigo', requireAuth, puedeAdministrar, eliminar)
