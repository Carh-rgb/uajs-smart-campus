import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/index.js'
import { enviarCorreoReset } from '../utils/mailer.js'
import { indexarUsuario } from '../utils/busquedaClient.js'

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, correo: usuario.correo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  )
}

// Campos de perfil que el propio usuario puede editar: datos de contacto
// personal, sin implicaciones de seguridad ni de registro institucional.
// Nombre, correo, rol, genero, documento de identidad, programa y el
// registro academico/laboral quedan fuera: solo los fija el
// Administrador del sistema (al crear la cuenta o desde Usuarios).
const CAMPOS_PERFIL_EDITABLES = [
  'fotoPerfil',
  'telefono',
  'direccion',
  'fechaNacimiento',
  'contactoEmergenciaNombre',
  'contactoEmergenciaRelacion',
  'contactoEmergenciaTelefono',
]

// Datos de registro institucional que solo se capturan al crear la
// cuenta (ver registrar()); el propio usuario no puede modificarlos.
const CAMPOS_REGISTRO_INSTITUCIONAL = [
  'genero',
  'tipoDocumento',
  'numeroDocumento',
  'codigoEstudiantil',
  'semestre',
  'area',
  'asignaturas',
  'cargo',
  'oficina',
  'extension',
]

function serializar(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    programa: usuario.programa,
    activo: usuario.activo,
    correoRecuperacion: usuario.correoRecuperacion,
    fotoPerfil: usuario.fotoPerfil,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    fechaNacimiento: usuario.fechaNacimiento,
    genero: usuario.genero,
    tipoDocumento: usuario.tipoDocumento,
    numeroDocumento: usuario.numeroDocumento,
    codigoEstudiantil: usuario.codigoEstudiantil,
    semestre: usuario.semestre,
    area: usuario.area,
    asignaturas: usuario.asignaturas,
    cargo: usuario.cargo,
    oficina: usuario.oficina,
    extension: usuario.extension,
    contactoEmergenciaNombre: usuario.contactoEmergenciaNombre,
    contactoEmergenciaRelacion: usuario.contactoEmergenciaRelacion,
    contactoEmergenciaTelefono: usuario.contactoEmergenciaTelefono,
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
  const registroInstitucional = {}
  for (const campo of CAMPOS_REGISTRO_INSTITUCIONAL) {
    if (req.body[campo]) registroInstitucional[campo] = req.body[campo]
  }

  const usuario = await Usuario.create({
    nombre,
    correo: correo.toLowerCase(),
    passwordHash,
    rol,
    programa: programa || null,
    ...registroInstitucional,
  })
  indexarUsuario(usuario)

  const token = firmarToken(usuario)
  res.status(201).json({ token, usuario: serializar(usuario) })
}

export async function perfil(req, res) {
  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })
  res.json(serializar(usuario))
}

export async function actualizarPerfil(req, res) {
  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })

  for (const campo of CAMPOS_PERFIL_EDITABLES) {
    if (campo in req.body) {
      usuario[campo] = req.body[campo] || null
    }
  }
  await usuario.save()

  res.json(serializar(usuario))
}

export async function actualizarCorreoRecuperacion(req, res) {
  const { correoRecuperacion } = req.body
  if (!correoRecuperacion || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoRecuperacion)) {
    return res.status(400).json({ error: 'Ingresa un correo de recuperación válido.' })
  }

  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' })

  usuario.correoRecuperacion = correoRecuperacion.toLowerCase()
  await usuario.save()

  res.json(serializar(usuario))
}

export async function solicitarReset(req, res) {
  const { correo } = req.body
  if (!correo) {
    return res.status(400).json({ error: 'El correo es obligatorio.' })
  }

  const usuario = await Usuario.findOne({ where: { correo: correo.toLowerCase() } })

  // La respuesta es la misma exista o no el usuario, para no revelar que
  // correos estan registrados en el sistema. El enlace se envia al correo
  // de recuperacion configurado en el perfil, no al correo institucional
  // de acceso, para no depender de un buzon que el usuario puede no revisar.
  if (usuario && usuario.activo && usuario.correoRecuperacion) {
    usuario.resetToken = crypto.randomBytes(32).toString('hex')
    usuario.resetTokenExpira = new Date(Date.now() + 60 * 60 * 1000)
    await usuario.save()

    const enlace = `${process.env.FRONTEND_URL || 'http://localhost:5183'}/reset-password?token=${usuario.resetToken}`
    try {
      await enviarCorreoReset(usuario.correoRecuperacion, usuario.nombre, enlace)
    } catch (err) {
      console.error('[usuarios-service] no se pudo enviar el correo de reset:', err.message)
    }
  }

  res.json({ mensaje: 'Si el correo esta registrado, recibiras un enlace para restablecer tu contraseña.' })
}

export async function restablecerPassword(req, res) {
  const { token, nuevaPassword } = req.body
  if (!token || !nuevaPassword) {
    return res.status(400).json({ error: 'token y nuevaPassword son obligatorios.' })
  }
  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  }

  const usuario = await Usuario.findOne({ where: { resetToken: token } })
  if (!usuario || !usuario.resetTokenExpira || usuario.resetTokenExpira < new Date()) {
    return res.status(400).json({ error: 'El enlace es invalido o ha expirado.' })
  }

  usuario.passwordHash = await bcrypt.hash(nuevaPassword, 10)
  usuario.resetToken = null
  usuario.resetTokenExpira = null
  await usuario.save()

  res.json({ mensaje: 'Contraseña actualizada correctamente.' })
}
