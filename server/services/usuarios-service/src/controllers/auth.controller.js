import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/index.js'

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, correo: usuario.correo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  )
}

function serializar(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    programa: usuario.programa,
    activo: usuario.activo,
  }
}

export async function login(req, res) {
  const { correo, password } = req.body
  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contrasena son obligatorios.' })
  }

  const usuario = await Usuario.findOne({ where: { correo: correo.toLowerCase() } })
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales invalidas o usuario inactivo.' })
  }

  const claveValida = await bcrypt.compare(password, usuario.passwordHash)
  if (!claveValida) {
    return res.status(401).json({ error: 'Credenciales invalidas.' })
  }

  const token = firmarToken(usuario)
  res.json({ token, usuario: serializar(usuario) })
}

export async function registrar(req, res) {
  const { nombre, correo, password, rol, programa } = req.body
  if (!nombre || !correo || !password || !rol) {
    return res.status(400).json({ error: 'nombre, correo, password y rol son obligatorios.' })
  }
  if (!/^[^\s@]+@uajs\.edu\.co$/i.test(correo)) {
    return res.status(400).json({ error: 'El correo debe pertenecer al dominio @uajs.edu.co' })
  }

  const existente = await Usuario.findOne({ where: { correo: correo.toLowerCase() } })
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese correo.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const usuario = await Usuario.create({
    nombre,
    correo: correo.toLowerCase(),
    passwordHash,
    rol,
    programa: programa || null,
  })

  const token = firmarToken(usuario)
  res.status(201).json({ token, usuario: serializar(usuario) })
}

export async function perfil(req, res) {
  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })
  res.json(serializar(usuario))
}
