import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const ReservaHistorial = sequelize.define(
  'ReservaHistorial',
  {
    reservaId: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    por: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'reservas_historial', timestamps: false },
)
