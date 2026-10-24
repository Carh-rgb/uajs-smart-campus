import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/index.js'
import { enviarCorreoReset } from '../utils/mailer.js'
import { indexarUsuario } from '../utils/busquedaClient.js'
import { ErrorApi } from '../utils/errores.js'
import { validar } from '../utils/validaciones.js'

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
  const { correo, password } = validar(req.body, {
    correo: { tipo: 'correo', requerido: true, etiqueta: 'El correo' },
    password: { tipo: 'texto', requerido: true, max: 72, etiqueta: 'La contraseña' },
  })

  const usuario = await Usuario.findOne({ where: { correo } })
  if (!usuario || !usuario.activo) {
    throw new ErrorApi(401, 'Credenciales invalidas o usuario inactivo.', 'CREDENCIALES_INVALIDAS')
  }

  const claveValida = await bcrypt.compare(password, usuario.passwordHash)
  if (!claveValida) {
    throw new ErrorApi(401, 'Credenciales invalidas.', 'CREDENCIALES_INVALIDAS')
  }

  const token = firmarToken(usuario)
  res.json({ token, usuario: serializar(usuario) })
}

export async function registrar(req, res) {
  const { nombre, correo, password, rol, programa } = validar(req.body, {
    nombre: { tipo: 'texto', requerido: true, min: 3, max: 120, etiqueta: 'El nombre' },
    correo: { tipo: 'correo', requerido: true, etiqueta: 'El correo' },
    password: { tipo: 'texto', requerido: true, min: 6, max: 72, etiqueta: 'La contraseña' },
    rol: { tipo: 'texto', requerido: true, valores: ['Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema'], etiqueta: 'El rol' },
    programa: { tipo: 'texto', max: 120, etiqueta: 'El programa' },
  })
  if (!/^[^\s@]+@uajs\.edu\.co$/i.test(correo)) {
    throw new ErrorApi(400, 'El correo debe pertenecer al dominio @uajs.edu.co', 'VALIDACION')
  }

  const existente = await Usuario.findOne({ where: { correo } })
  if (existente) {
    throw new ErrorApi(409, 'Ya existe un usuario con ese correo.', 'CONFLICTO')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const registroInstitucional = {}
  for (const campo of CAMPOS_REGISTRO_INSTITUCIONAL) {
    if (req.body[campo]) registroInstitucional[campo] = req.body[campo]
  }

  const usuario = await Usuario.create({
    nombre,
    correo,
    passwordHash,
    rol,
    programa: programa || null,
    ...registroInstitucional,
  })
  indexarUsuario(usuario)

  res.status(201).json({ usuario: serializar(usuario) })
}

export async function perfil(req, res) {
  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) throw new ErrorApi(404, 'Usuario no encontrado.', 'NO_ENCONTRADO')
  res.json(serializar(usuario))
}

export async function actualizarPerfil(req, res) {
  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) throw new ErrorApi(404, 'Usuario no encontrado.', 'NO_ENCONTRADO')

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
    throw new ErrorApi(400, 'Ingresa un correo de recuperación válido.', 'VALIDACION')
  }

  const usuario = await Usuario.findByPk(req.user.id)
  if (!usuario) throw new ErrorApi(404, 'Usuario no encontrado.', 'NO_ENCONTRADO')

  usuario.correoRecuperacion = correoRecuperacion.toLowerCase()
  await usuario.save()

  res.json(serializar(usuario))
}

export async function solicitarReset(req, res) {
  const { correo } = req.body
  if (!correo) {
    throw new ErrorApi(400, 'El correo es obligatorio.', 'VALIDACION')
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
    throw new ErrorApi(400, 'token y nuevaPassword son obligatorios.', 'VALIDACION')
  }
  if (nuevaPassword.length < 6) {
    throw new ErrorApi(400, 'La contraseña debe tener al menos 6 caracteres.', 'VALIDACION')
  }

  const usuario = await Usuario.findOne({ where: { resetToken: token } })
  if (!usuario || !usuario.resetTokenExpira || usuario.resetTokenExpira < new Date()) {
    throw new ErrorApi(400, 'El enlace es invalido o ha expirado.', 'VALIDACION')
  }

  usuario.passwordHash = await bcrypt.hash(nuevaPassword, 10)
  usuario.resetToken = null
  usuario.resetTokenExpira = null
  await usuario.save()

  res.json({ mensaje: 'Contraseña actualizada correctamente.' })
}
