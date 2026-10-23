// Define los endpoints disponibles para el servicio de busqueda
import { Router } from 'express'
import { requireAuth, requireServicio } from '../middlewares/auth.js'
import { buscar, indexar, eliminarDocumento } from '../controllers/buscar.controller.js'

export const buscarRouter = Router()

buscarRouter.get('/', requireAuth, buscar)
// Los otros microservicios llaman a estos dos endpoints (fire-and-forget,
// igual que recursos-service -> reservas-service) para mantener el indice
// al dia cuando crean, editan o borran algo indexable.
buscarRouter.put('/documento', requireAuth, requireServicio, indexar)
buscarRouter.delete('/documento/:tipo/:entidadId', requireAuth, requireServicio, eliminarDocumento)
