import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Evento = sequelize.define(
  'Evento',
  {
    titulo: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.STRING, allowNull: false },
    lugar: { type: DataTypes.STRING, allowNull: false },
    ponente: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'eventos', timestamps: true },
)
