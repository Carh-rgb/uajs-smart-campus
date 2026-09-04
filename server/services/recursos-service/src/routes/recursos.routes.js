import { Router } from 'express'
import { listar, crear, actualizarEstado, eliminar } from '../controllers/recursos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const recursosRouter = Router()

const puedeAdministrar = requireRole('Administrativo', 'Administrador del sistema')

recursosRouter.get('/', requireAuth, listar)
recursosRouter.post('/', requireAuth, puedeAdministrar, crear)
recursosRouter.patch('/:codigo/estado', requireAuth, puedeAdministrar, actualizarEstado)
recursosRouter.delete('/:codigo', requireAuth, puedeAdministrar, eliminar)
