import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/index.js'
import { enviarCorreoReset } from '../utils/mailer.js'
import { indexarUsuario } from '../utils/busquedaClient.js'
import { HttpError } from '../middlewares/errores.js'
import { siguienteCodigoEstudiantil, conBloqueoDeCodigo } from '../utils/codigoEstudiantil.js'
import { abrirSesion, cerrarSesion, verificarSesion, MINUTOS_INACTIVIDAD } from '../utils/sesiones.js'

// El token lleva el identificador de la sesion (sid). Al iniciar sesion en
// otro dispositivo se genera un sid nuevo y este token deja de valer.
function firmarToken(usuario, sid) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, correo: usuario.correo, sid },
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
export const CAMPOS_REGISTRO_INSTITUCIONAL = [
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

export function serializar(usuario) {
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
  if (typeof correo !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'El correo y la contrasena deben ser texto.' })
  }

  const usuario = await Usuario.findOne({ where: { correo: correo.toLowerCase() } })
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales invalidas o usuario inactivo.' })
  }

  const claveValida = await bcrypt.compare(password, usuario.passwordHash)
  if (!claveValida) {
    return res.status(401).json({ error: 'Credenciales invalidas.' })
  }

  const sid = await abrirSesion(usuario.id)
  const token = firmarToken(usuario, sid)
  res.json({ token, usuario: serializar(usuario), inactividadMinutos: MINUTOS_INACTIVIDAD })
}

// GET /auth/sesion: lo usa el API Gateway antes de reenviar cada peticion
// autenticada, y el frontend para enterarse a tiempo de que la sesion se
// cerro. Con la cabecera "X-Sesion-Pasiva: 1" solo consulta, sin contar
// como actividad del usuario.
export async function estadoSesion(req, res) {
  const pasiva = req.get('x-sesion-pasiva') === '1'
  const resultado = await verificarSesion(req.user, { registrarActividad: !pasiva })
  if (!resultado.ok) {
    return res.status(401).json({ error: resultado.message, code: resultado.code })
  }
  res.json({ activa: true, inactividadMinutos: MINUTOS_INACTIVIDAD })
}

// POST /auth/logout: cierra la sesion en el servidor (solo si el token es
// el de la sesion vigente, para que un dispositivo viejo no cierre la nueva).
export async function cerrarSesionActual(req, res) {
  const resultado = await verificarSesion(req.user, { registrarActividad: false })
  if (resultado.ok) await cerrarSesion(req.user.id)
  res.status(204).send()
}

// Roles validos (mismos valores del ENUM de Usuario.rol).
export const ROLES = ['Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema']

// Crea una cuenta validando los datos. La usan el registro publico
// (rolForzado = 'Estudiante') y el Administrador desde POST /usuarios
// (rol elegido, validado contra ROLES). Lanza HttpError si algo no cuadra.
export async function crearCuenta(datos, { rolForzado } = {}) {
  const { nombre, correo, password, programa } = datos
  const rol = rolForzado || datos.rol
  if ([nombre, correo, password, rol].some((v) => v != null && typeof v !== 'string')) {
    throw new HttpError(400, 'nombre, correo, password y rol deben ser texto.')
  }
  if (!nombre?.trim() || !correo?.trim() || !password || !rol) {
    throw new HttpError(400, 'nombre, correo, password y rol son obligatorios.')
  }
  if (!/^[^\s@]+@uajs\.edu\.co$/i.test(correo)) {
    throw new HttpError(400, 'El correo debe pertenecer al dominio @uajs.edu.co')
  }
  if (!ROLES.includes(rol)) {
    throw new HttpError(400, `Rol invalido. Valores permitidos: ${ROLES.join(', ')}.`, 'INVALID_ROLE')
  }
  if (String(password).length < 6) {
    throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres.')
  }

  const existente = await Usuario.findOne({ where: { correo: correo.toLowerCase() } })
  if (existente) {
    throw new HttpError(409, 'Ya existe un usuario con ese correo.', 'DUPLICATE')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const registroInstitucional = {}
  for (const campo of CAMPOS_REGISTRO_INSTITUCIONAL) {
    if (datos[campo]) registroInstitucional[campo] = datos[campo]
  }

  // El codigo estudiantil lo genera el sistema (ver utils/codigoEstudiantil.js);
  // si llega uno en el cuerpo se ignora.
  delete registroInstitucional.codigoEstudiantil

  const usuario = await conBloqueoDeCodigo(async (transaction) =>
    Usuario.create(
      {
        nombre: nombre.trim(),
        correo: correo.toLowerCase(),
        passwordHash,
        rol,
        programa: programa || null,
        ...registroInstitucional,
        codigoEstudiantil: rol === 'Estudiante' ? await siguienteCodigoEstudiantil(transaction) : null,
      },
      { transaction },
    ),
  )
  indexarUsuario(usuario)
  return usuario
}

// Registro publico (E2-10): siempre crea un Estudiante, sin importar el
// "rol" que venga en el cuerpo. Antes cualquiera podia registrarse como
// "Administrador del sistema". Las cuentas de otros roles las crea el
// Administrador con POST /usuarios.
export async function registrar(req, res) {
  const usuario = await crearCuenta(req.body, { rolForzado: 'Estudiante' })
  const sid = await abrirSesion(usuario.id)
  const token = firmarToken(usuario, sid)
  res.status(201).json({ token, usuario: serializar(usuario), inactividadMinutos: MINUTOS_INACTIVIDAD })
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
  // Por seguridad, al cambiar la contraseña se cierra la sesion abierta.
  await cerrarSesion(usuario.id)

  res.json({ mensaje: 'Contraseña actualizada correctamente.' })
}
