import { Router } from 'express'
import { obtenerCatalogo, sincronizarEquipo } from '../controllers/catalogo.controller.js'
import {
  listar,
  obtener,
  disponibilidad,
  usoDeEquipo,
  crear,
  actualizar,
  actualizarEstado,
  cancelar,
  historial,
  eliminar,
} from '../controllers/reservas.controller.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { asyncHandler as ah } from '../utils/errores.js'

export const reservasRouter = Router()

// Convencion de la API: PUT reemplaza los campos editables de un registro;
// PATCH ejecuta una accion o cambio parcial (estado, cancelar, sync).
reservasRouter.get('/catalogo', requireAuth, ah(obtenerCatalogo))
reservasRouter.get('/disponibilidad', requireAuth, ah(disponibilidad))
reservasRouter.patch(
  '/equipos/sync',
  requireAuth,
  requireRole('Administrador del sistema'),
  ah(sincronizarEquipo),
)
reservasRouter.get('/equipos/uso', requireAuth, requireRole('Administrativo', 'Administrador del sistema'), ah(usoDeEquipo))
reservasRouter.get('/', requireAuth, ah(listar))
reservasRouter.post('/', requireAuth, ah(crear))
reservasRouter.get('/:id', requireAuth, ah(obtener))
reservasRouter.put('/:id', requireAuth, ah(actualizar))
reservasRouter.patch(
  '/:id/estado',
  requireAuth,
  requireRole('Administrativo', 'Administrador del sistema'),
  ah(actualizarEstado),
)
reservasRouter.patch('/:id/cancelar', requireAuth, ah(cancelar))
reservasRouter.get('/:id/historial', requireAuth, ah(historial))
reservasRouter.delete('/:id', requireAuth, ah(eliminar))
