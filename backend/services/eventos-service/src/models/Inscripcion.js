import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Inscripcion = sequelize.define(
  'Inscripcion',
  {
    eventoId: { type: DataTypes.INTEGER, allowNull: false },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: false },
    rol: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'inscripciones',
    timestamps: true,
    indexes: [{ unique: true, fields: ['eventoId', 'usuarioId'] }],
  },
)
