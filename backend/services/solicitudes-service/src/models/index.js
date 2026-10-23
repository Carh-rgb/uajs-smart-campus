import { Solicitud } from './Solicitud.js'
import { SolicitudHistorial } from './SolicitudHistorial.js'
import { Pqrs } from './Pqrs.js'
import { PqrsHistorial } from './PqrsHistorial.js'

// Llaves foraneas (Entregable 2, seccion 6.1): relaciones entre tablas de esta
// misma base. ON DELETE CASCADE porque el historial o detalle no tiene
// sentido sin su registro padre. Solo se relacionan tablas del mismo
// microservicio: los datos de otros dominios (usuarios, recursos) se
// referencian por id sin llave foranea, porque viven en otra base.
Solicitud.hasMany(SolicitudHistorial, { foreignKey: { name: 'solicitudId', allowNull: false }, as: 'historial', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
SolicitudHistorial.belongsTo(Solicitud, { foreignKey: { name: 'solicitudId', allowNull: false }, as: 'solicitud', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Pqrs.hasMany(PqrsHistorial, { foreignKey: { name: 'pqrsId', allowNull: false }, as: 'historial', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
PqrsHistorial.belongsTo(Pqrs, { foreignKey: { name: 'pqrsId', allowNull: false }, as: 'pqrs', onDelete: 'CASCADE', onUpdate: 'CASCADE' })

export { Solicitud, SolicitudHistorial, Pqrs, PqrsHistorial }
