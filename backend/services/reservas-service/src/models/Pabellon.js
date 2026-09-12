import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Pabellon = sequelize.define(
  'Pabellon',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'pabellones', timestamps: false },
)
