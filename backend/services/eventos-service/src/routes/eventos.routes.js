import { Router } from 'express'
import {
  listar,
  obtener,
  crear,
  actualizar,
  actualizarEstado,
  inscritos,
  inscribir,
  cancelarInscripcion,
  eliminar,
} from '../controllers/eventos.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const eventosRouter = Router()

const puedeAdministrar = requireRole('Administrativo', 'Administrador del sistema')

// Convencion de la API: PUT reemplaza los campos editables de un registro;
// PATCH ejecuta una accion o cambio parcial (estado). PATCH /:id se conserva
// como alias de PUT por compatibilidad con el frontend.
eventosRouter.get('/', requireAuth, ah(listar))
eventosRouter.post('/', requireAuth, puedeAdministrar, ah(crear))
eventosRouter.get('/:id', requireAuth, ah(obtener))
eventosRouter.put('/:id', requireAuth, puedeAdministrar, ah(actualizar))
eventosRouter.patch('/:id', requireAuth, puedeAdministrar, ah(actualizar))
eventosRouter.patch('/:id/estado', requireAuth, puedeAdministrar, ah(actualizarEstado))
eventosRouter.get('/:id/inscritos', requireAuth, puedeAdministrar, ah(inscritos))
eventosRouter.post('/:id/inscribir', requireAuth, requireRole('Estudiante', 'Docente'), ah(inscribir))
eventosRouter.delete('/:id/inscripcion', requireAuth, requireRole('Estudiante', 'Docente'), ah(cancelarInscripcion))
eventosRouter.delete('/:id', requireAuth, puedeAdministrar, ah(eliminar))
