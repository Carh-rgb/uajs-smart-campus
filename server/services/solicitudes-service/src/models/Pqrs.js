import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Pqrs = sequelize.define(
  'Pqrs',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    tipo: { type: DataTypes.STRING, allowNull: false },
    dirigidoA: { type: DataTypes.STRING, allowNull: false },
    asunto: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    adjunto: { type: DataTypes.STRING, allowNull: true },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Registrada' },
    respuesta: { type: DataTypes.TEXT, allowNull: true },
    adjuntoRespuesta: { type: DataTypes.STRING, allowNull: true },
    respondidoPor: { type: DataTypes.STRING, allowNull: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    solicitanteId: { type: DataTypes.INTEGER, allowNull: false },
    solicitante: { type: DataTypes.STRING, allowNull: false },
    rolSolicitante: { type: DataTypes.STRING, allowNull: false },
    asignadoA: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Sin asignar' },
  },
  {
    tableName: 'pqrs',
    timestamps: true,
  },
)
