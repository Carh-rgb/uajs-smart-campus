import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Solicitud = sequelize.define(
  'Solicitud',
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    tipo: { type: DataTypes.STRING, allowNull: false },
    dependencia: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    prioridad: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Media' },
    estado: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Registrada' },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    asignadoA: { type: DataTypes.STRING, allowNull: true },
    solicitanteId: { type: DataTypes.INTEGER, allowNull: false },
    solicitanteNombre: { type: DataTypes.STRING, allowNull: false },
    rolSolicitante: { type: DataTypes.STRING, allowNull: false },
    respuesta: { type: DataTypes.TEXT, allowNull: true },
    adjuntoRespuesta: { type: DataTypes.STRING, allowNull: true },
    respondidoPor: { type: DataTypes.STRING, allowNull: true },
    fechaRespuesta: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: 'solicitudes',
    timestamps: true,
  },
)
