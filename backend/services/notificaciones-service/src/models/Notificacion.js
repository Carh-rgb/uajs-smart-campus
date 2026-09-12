import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Notificacion = sequelize.define(
  'Notificacion',
  {
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    categoria: { type: DataTypes.STRING, allowNull: false },
    mensaje: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'notificaciones', timestamps: true },
)
