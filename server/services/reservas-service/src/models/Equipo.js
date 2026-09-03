import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Equipo = sequelize.define(
  'Equipo',
  {
    codigo: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'equipos', timestamps: false },
)
