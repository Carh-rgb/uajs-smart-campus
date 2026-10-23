import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Recurso = sequelize.define(
  'Recurso',
  {
    codigo: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    ubicacion: { type: DataTypes.STRING, allowNull: false },
    // Detalle libre del recurso (marca, accesorios, observaciones). E2-23.
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    estado: {
      type: DataTypes.ENUM('Disponible', 'En mantenimiento', 'Fuera de servicio'),
      allowNull: false,
      defaultValue: 'Disponible',
    },
  },
  { tableName: 'recursos', timestamps: true },
)
