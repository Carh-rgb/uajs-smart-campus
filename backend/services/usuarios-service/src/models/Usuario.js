import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Usuario = sequelize.define(
  'Usuario',
  {
    nombre: { type: DataTypes.STRING, allowNull: false },
    correo: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    rol: {
      type: DataTypes.ENUM('Estudiante', 'Docente', 'Administrativo', 'Administrador del sistema'),
      allowNull: false,
    },
    programa: { type: DataTypes.STRING, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    correoRecuperacion: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
    // Foto de perfil como data URL (base64), redimensionada/comprimida
    // desde el navegador antes de subirla. Evita montar almacenamiento
    // de archivos aparte para algo tan chico como un avatar.
    fotoPerfil: { type: DataTypes.TEXT, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    direccion: { type: DataTypes.STRING, allowNull: true },
    fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: true },
    genero: { type: DataTypes.STRING, allowNull: true },
    tipoDocumento: { type: DataTypes.STRING, allowNull: true },
    numeroDocumento: { type: DataTypes.STRING, allowNull: true },
    // Registro academico/laboral: lo fija el Administrador del sistema al
    // crear la cuenta, segun el rol. No es autoeditable desde el perfil.
    // Ver PENDIENTES-EQUIPO.md: idea para generarlo automaticamente a partir
    // del documento de identidad + programa + año de ingreso.
    codigoEstudiantil: { type: DataTypes.STRING, allowNull: true },
    semestre: { type: DataTypes.STRING, allowNull: true },
    area: { type: DataTypes.STRING, allowNull: true },
    asignaturas: { type: DataTypes.STRING, allowNull: true },
    cargo: { type: DataTypes.STRING, allowNull: true },
    oficina: { type: DataTypes.STRING, allowNull: true },
    extension: { type: DataTypes.STRING, allowNull: true },
    contactoEmergenciaNombre: { type: DataTypes.STRING, allowNull: true },
    contactoEmergenciaRelacion: { type: DataTypes.STRING, allowNull: true },
    contactoEmergenciaTelefono: { type: DataTypes.STRING, allowNull: true },
    resetToken: { type: DataTypes.STRING, allowNull: true },
    resetTokenExpira: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'usuarios',
    timestamps: true,
  },
)
