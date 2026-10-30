import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Notificacion = sequelize.define(
  'Notificacion',
  {
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    // categoria cumple el papel de "tipo" (Solicitudes, PQRS, Reservas,
    // Eventos, Institucional): el frontend la usa para el icono y el enlace.
    categoria: { type: DataTypes.STRING, allowNull: false },
    // E2-31. titulo admite nulos solo por compatibilidad con datos viejos;
    // la API lo exige al crear.
    titulo: { type: DataTypes.STRING, allowNull: true },
    mensaje: { type: DataTypes.STRING, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // Registro que origino la notificacion (ej. 'solicitud' + 'SOL-0232'),
    // para poder enlazarla. Es una referencia logica a otro servicio.
    entidadRelacionada: { type: DataTypes.STRING, allowNull: true },
    entidadId: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: 'notificaciones', timestamps: true },
)
