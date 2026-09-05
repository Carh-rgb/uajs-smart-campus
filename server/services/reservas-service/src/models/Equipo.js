import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Equipo = sequelize.define(
  'Equipo',
  {
    codigo: { type: DataTypes.STRING, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    // Cantidad total de unidades disponibles de este equipo. Solo lo ve
    // el personal (Administrativo/Administrador del sistema), no quien
    // hace la reserva.
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  { tableName: 'equipos', timestamps: false },
)
