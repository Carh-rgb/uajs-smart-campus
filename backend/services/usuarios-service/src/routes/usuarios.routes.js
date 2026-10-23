import { Router } from 'express'
import {
  listar,
  listarResponsables,
  obtener,
  crear,
  actualizar,
  actualizarEstado,
  actualizarRol,
  eliminar,
} from '../controllers/usuarios.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'

export const usuariosRouter = Router()

const soloAdmin = requireRole('Administrador del sistema')

usuariosRouter.get('/', requireAuth, soloAdmin, listar)
usuariosRouter.get('/responsables', requireAuth, listarResponsables)
usuariosRouter.post('/', requireAuth, soloAdmin, crear)
usuariosRouter.get('/:id', requireAuth, obtener)
usuariosRouter.patch('/:id', requireAuth, soloAdmin, actualizar)
usuariosRouter.patch('/:id/estado', requireAuth, soloAdmin, actualizarEstado)
usuariosRouter.patch('/:id/rol', requireAuth, soloAdmin, actualizarRol)
usuariosRouter.delete('/:id', requireAuth, soloAdmin, eliminar)
