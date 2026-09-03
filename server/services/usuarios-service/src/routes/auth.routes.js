import { Router } from 'express'
import { login, registrar, perfil } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const authRouter = Router()

authRouter.post('/login', login)
authRouter.post('/register', registrar)
authRouter.get('/me', requireAuth, perfil)
