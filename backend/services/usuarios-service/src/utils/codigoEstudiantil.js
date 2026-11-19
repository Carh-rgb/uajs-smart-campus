import { Op } from 'sequelize'
import { Usuario } from '../models/index.js'
import { sequelize } from '../config/database.js'

// El codigo estudiantil lo asigna el sistema, no se digita: año de ingreso
// (año en que se crea la cuenta) + consecutivo de 4 digitos dentro de ese
// año. Ejemplo: 20260001, 20260002, ...
// Todos los codigos de un mismo año tienen la misma longitud, asi que el
// orden alfabetico coincide con el numerico y basta con tomar el mayor.
export async function siguienteCodigoEstudiantil(transaction) {
  const prefijo = String(new Date().getFullYear())
  const ultimo = await Usuario.findOne({
    where: { codigoEstudiantil: { [Op.like]: `${prefijo}____` } },
    order: [['codigoEstudiantil', 'DESC']],
    transaction,
  })
  const consecutivo = ultimo ? Number(ultimo.codigoEstudiantil.slice(prefijo.length)) + 1 : 1
  return `${prefijo}${String(consecutivo).padStart(4, '0')}`
}

// Serializa la asignacion con un bloqueo de PostgreSQL para que dos
// estudiantes creados al mismo tiempo no reciban el mismo codigo.
export function conBloqueoDeCodigo(trabajo) {
  return sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('usuarios-service:codigo-estudiantil'))", { transaction })
    return trabajo(transaction)
  })
}

// Estudiantes que existian sin codigo (datos semilla o cuentas anteriores a
// esta regla): se les asigna uno al arrancar el servicio.
export async function asignarCodigosFaltantes() {
  const sinCodigo = await Usuario.findAll({
    where: { rol: 'Estudiante', [Op.or]: [{ codigoEstudiantil: null }, { codigoEstudiantil: '' }] },
    order: [['id', 'ASC']],
  })
  for (const usuario of sinCodigo) {
    await conBloqueoDeCodigo(async (transaction) => {
      usuario.codigoEstudiantil = await siguienteCodigoEstudiantil(transaction)
      await usuario.save({ transaction })
    })
  }
  if (sinCodigo.length) console.log(`[usuarios-service] Codigos estudiantiles asignados: ${sinCodigo.length}.`)
}
