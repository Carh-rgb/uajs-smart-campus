import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Salon = sequelize.define(
  'Salon',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    pabellonId: { type: DataTypes.STRING, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: false },
    capacidad: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'salones', timestamps: false },
)
