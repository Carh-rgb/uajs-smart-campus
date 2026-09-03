import { Router } from 'express'
import { listar, crear, inscritos, inscribir } from '../controllers/eventos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const eventosRouter = Router()

const puedeAdministrar = requireRole('Administrativo', 'Administrador del sistema')

eventosRouter.get('/', requireAuth, listar)
eventosRouter.post('/', requireAuth, puedeAdministrar, crear)
eventosRouter.get('/:id/inscritos', requireAuth, puedeAdministrar, inscritos)
eventosRouter.post('/:id/inscribir', requireAuth, requireRole('Estudiante', 'Docente'), inscribir)
