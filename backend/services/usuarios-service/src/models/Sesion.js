import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

// Sesion activa de cada usuario (Entregable 3: sesion unica e inactividad).
//
// Una fila por usuario: al iniciar sesion se reemplaza el identificador
// (sid) y el token anterior, que lleva el sid viejo, deja de servir. Asi una
// cuenta solo puede estar abierta en un dispositivo a la vez.
//
// ultimaActividad se actualiza con cada peticion del usuario (via el API
// Gateway); si pasan mas de SESION_INACTIVIDAD_MIN minutos sin actividad la
// sesion se da por cerrada y hay que volver a iniciar sesion.
//
// Es una tabla nueva a proposito: sequelize.sync() la crea sola en
// instalaciones existentes sin tener que alterar la tabla "usuarios".
export const Sesion = sequelize.define(
  'Sesion',
  {
    usuarioId: { type: DataTypes.INTEGER, primaryKey: true },
    sid: { type: DataTypes.STRING(64), allowNull: false },
    ultimaActividad: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'sesiones',
    timestamps: true,
  },
)
