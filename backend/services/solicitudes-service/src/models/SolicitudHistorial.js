import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const SolicitudHistorial = sequelize.define(
  'SolicitudHistorial',
  {
    solicitudId: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    por: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'solicitudes_historial',
    timestamps: false,
  },
)
