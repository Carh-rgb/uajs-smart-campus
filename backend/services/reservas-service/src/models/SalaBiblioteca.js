import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const SalaBiblioteca = sequelize.define(
  'SalaBiblioteca',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'salas_biblioteca', timestamps: false },
)
