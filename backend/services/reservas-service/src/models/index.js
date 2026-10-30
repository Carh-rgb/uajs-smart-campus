import { Pabellon } from './Pabellon.js'
import { Salon } from './Salon.js'
import { SalaEspecial } from './SalaEspecial.js'
import { SalaBiblioteca } from './SalaBiblioteca.js'
import { Equipo } from './Equipo.js'
import { Reserva } from './Reserva.js'
import { ReservaHistorial } from './ReservaHistorial.js'

// Llaves foraneas (Entregable 2, seccion 6.1): relaciones entre tablas de esta
// misma base. ON DELETE CASCADE porque el historial o detalle no tiene
// sentido sin su registro padre. Solo se relacionan tablas del mismo
// microservicio: los datos de otros dominios (usuarios, recursos) se
// referencian por id sin llave foranea, porque viven en otra base.
Pabellon.hasMany(Salon, { foreignKey: { name: 'pabellonId', allowNull: false }, as: 'salones', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Salon.belongsTo(Pabellon, { foreignKey: { name: 'pabellonId', allowNull: false }, as: 'pabellon', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Reserva.hasMany(ReservaHistorial, { foreignKey: { name: 'reservaId', allowNull: false }, as: 'historial', onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ReservaHistorial.belongsTo(Reserva, { foreignKey: { name: 'reservaId', allowNull: false }, as: 'reserva', onDelete: 'CASCADE', onUpdate: 'CASCADE' })

export { Pabellon, Salon, SalaEspecial, SalaBiblioteca, Equipo, Reserva, ReservaHistorial }
