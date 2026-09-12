import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Recurso = sequelize.define(
  'Recurso',
  {
    codigo: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    ubicacion: { type: DataTypes.STRING, allowNull: false },
    estado: {
      type: DataTypes.ENUM('Disponible', 'En mantenimiento', 'Fuera de servicio'),
      allowNull: false,
      defaultValue: 'Disponible',
    },
  },
  { tableName: 'recursos', timestamps: true },
)
