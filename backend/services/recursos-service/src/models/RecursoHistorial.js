import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const RecursoHistorial = sequelize.define(
  'RecursoHistorial',
  {
    recursoCodigo: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    por: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'recursos_historial', timestamps: false },
)
