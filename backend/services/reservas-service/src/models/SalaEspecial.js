import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const SalaEspecial = sequelize.define(
  'SalaEspecial',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'salas_especiales', timestamps: false },
)
