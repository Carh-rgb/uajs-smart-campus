import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

// Un registro por rol gestionable, con la lista de ids de modulo activos.
// El rol "Administrador del sistema" siempre tiene acceso total y no vive aqui.
export const Permiso = sequelize.define(
  'Permiso',
  {
    rol: {
      type: DataTypes.ENUM('Estudiante', 'Docente', 'Administrativo'),
      allowNull: false,
      unique: true,
    },
    modulosActivos: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  {
    tableName: 'permisos',
    timestamps: true,
  },
)
