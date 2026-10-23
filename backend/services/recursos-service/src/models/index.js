import { Recurso } from './Recurso.js'
import { RecursoHistorial } from './RecursoHistorial.js'

// Llaves foraneas (Entregable 2, seccion 6.1): relaciones entre tablas de esta
// misma base. ON DELETE CASCADE porque el historial o detalle no tiene
// sentido sin su registro padre. Solo se relacionan tablas del mismo
// microservicio: los datos de otros dominios (usuarios, recursos) se
// referencian por id sin llave foranea, porque viven en otra base.
Recurso.hasMany(RecursoHistorial, { foreignKey: { name: 'recursoCodigo', allowNull: false }, as: 'historial', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
RecursoHistorial.belongsTo(Recurso, { foreignKey: { name: 'recursoCodigo', allowNull: false }, as: 'recurso', onDelete: 'CASCADE', onUpdate: 'CASCADE' })

export { Recurso, RecursoHistorial }
