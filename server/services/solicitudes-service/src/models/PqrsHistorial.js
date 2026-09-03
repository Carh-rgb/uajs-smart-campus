import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const PqrsHistorial = sequelize.define(
  'PqrsHistorial',
  {
    pqrsId: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    por: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'pqrs_historial',
    timestamps: false,
  },
)
