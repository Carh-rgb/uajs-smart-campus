import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Reserva = sequelize.define(
  'Reserva',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    tipoEspacio: { type: DataTypes.STRING, allowNull: false },
    espacio: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    horaInicio: { type: DataTypes.STRING, allowNull: false },
    horaFin: { type: DataTypes.STRING, allowNull: false },
    motivo: { type: DataTypes.STRING, allowNull: false },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pendiente' },
    solicitanteId: { type: DataTypes.INTEGER, allowNull: false },
    solicitanteNombre: { type: DataTypes.STRING, allowNull: false },
    rolSolicitante: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'reservas', timestamps: true },
)
