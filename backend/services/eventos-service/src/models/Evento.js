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
    // Facultad/dependencia responsable del evento. "General / Bienestar
    // Universitario" cubre eventos institucionales que no pertenecen a una
    // sola facultad (ver seed y mockData.js para la lista completa).
    facultad: { type: DataTypes.STRING, allowNull: false, defaultValue: 'General / Bienestar Universitario' },
    estado: {
      type: DataTypes.ENUM('Activo', 'Inactivo', 'Cancelado'),
      allowNull: false,
      defaultValue: 'Activo',
    },
    // Cupo maximo de inscritos; null = sin limite.
    cupoMaximo: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'eventos', timestamps: true },
)
