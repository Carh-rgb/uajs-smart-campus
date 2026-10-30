import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado.' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado.' })
  }
}

// Endpoints internos: solo los aceptan tokens de servicio (servicio: true),
// que firman los demas microservicios con el JWT_SECRET compartido. El token
// de un usuario, aunque sea Administrador, recibe 403. Va despues de requireAuth.
export function requireServicio(req, res, next) {
  if (!req.user?.servicio) {
    return res.status(403).json({ error: 'Este endpoint es solo para comunicacion entre servicios.', code: 'SERVICE_ONLY' })
  }
  next()
}
