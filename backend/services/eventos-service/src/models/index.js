import { Evento } from './Evento.js'
import { Inscripcion } from './Inscripcion.js'

// Llaves foraneas (Entregable 2, seccion 6.1): relaciones entre tablas de esta
// misma base. ON DELETE CASCADE porque el historial o detalle no tiene
// sentido sin su registro padre. Solo se relacionan tablas del mismo
// microservicio: los datos de otros dominios (usuarios, recursos) se
// referencian por id sin llave foranea, porque viven en otra base.
Evento.hasMany(Inscripcion, { foreignKey: { name: 'eventoId', allowNull: false }, as: 'inscripciones', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Inscripcion.belongsTo(Evento, { foreignKey: { name: 'eventoId', allowNull: false }, as: 'evento', onDelete: 'CASCADE', onUpdate: 'CASCADE' })

export { Evento, Inscripcion }
