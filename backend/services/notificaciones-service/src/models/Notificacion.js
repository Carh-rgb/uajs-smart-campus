import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Notificacion = sequelize.define(
  'Notificacion',
  {
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    // Tipo de notificacion (Solicitudes, Reservas, Eventos, Institucional...).
    categoria: { type: DataTypes.STRING, allowNull: false },
    // Titulo corto; si no se informa se usa la categoria.
    titulo: { type: DataTypes.STRING, allowNull: true },
    // Entidad del sistema a la que se refiere (ej. 'solicitud' + 'SOL-0231').
    entidad: { type: DataTypes.STRING, allowNull: true },
    entidadId: { type: DataTypes.STRING, allowNull: true },
    mensaje: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'notificaciones', timestamps: true },
)
