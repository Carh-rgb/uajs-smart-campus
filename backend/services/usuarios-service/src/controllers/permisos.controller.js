import { Permiso } from '../models/index.js'

export async function listar(req, res) {
  const permisos = await Permiso.findAll()
  const mapa = {}
  for (const p of permisos) mapa[p.rol] = p.modulosActivos
  res.json(mapa)
}

export async function alternarModulo(req, res) {
  const { rol } = req.params
  const { moduloId } = req.body
  if (rol === 'Administrador del sistema') {
    return res.status(400).json({ error: 'El Administrador del sistema siempre tiene acceso total.' })
  }

  const [permiso] = await Permiso.findOrCreate({ where: { rol }, defaults: { modulosActivos: [] } })
  const activos = permiso.modulosActivos || []
  const yaLoTiene = activos.includes(moduloId)
  permiso.modulosActivos = yaLoTiene ? activos.filter((id) => id !== moduloId) : [...activos, moduloId]
  await permiso.save()

  res.json({ rol, modulosActivos: permiso.modulosActivos })
}
