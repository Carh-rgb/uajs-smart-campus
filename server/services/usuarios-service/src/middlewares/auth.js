import jwt from 'jsonwebtoken'

// Verifica el JWT emitido por usuarios-service (POST /auth/login) y expone
// { id, nombre, rol } en req.user. Cada microservicio valida el mismo
// token de forma independiente (mismo JWT_SECRET), sin llamar de vuelta
// a usuarios-service en cada peticion.
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

export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion.' })
    }
    next()
  }
}
