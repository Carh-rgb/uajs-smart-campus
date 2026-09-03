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
  },
  {
    tableName: 'usuarios',
    timestamps: true,
  },
)
