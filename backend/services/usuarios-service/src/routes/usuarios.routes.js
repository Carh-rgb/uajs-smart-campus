import { Router } from 'express'
import {
  listar,
  obtener,
  crear,
  actualizar,
  listarResponsables,
  actualizarEstado,
  actualizarRol,
  eliminar,
} from '../controllers/usuarios.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const usuariosRouter = Router()

const soloAdmin = requireRole('Administrador del sistema')

// Convencion de la API: PUT reemplaza los campos editables de un registro;
// PATCH ejecuta una accion o cambio parcial (estado, rol).
usuariosRouter.get('/', requireAuth, soloAdmin, ah(listar))
usuariosRouter.post('/', requireAuth, soloAdmin, ah(crear))
usuariosRouter.get('/responsables', requireAuth, ah(listarResponsables))
usuariosRouter.get('/:id', requireAuth, ah(obtener))
usuariosRouter.put('/:id', requireAuth, soloAdmin, ah(actualizar))
usuariosRouter.patch('/:id/estado', requireAuth, soloAdmin, ah(actualizarEstado))
usuariosRouter.patch('/:id/rol', requireAuth, soloAdmin, ah(actualizarRol))
usuariosRouter.delete('/:id', requireAuth, soloAdmin, ah(eliminar))
