import { Pabellon, Salon, SalaEspecial, SalaBiblioteca, Equipo } from '../models/index.js'

// Llamado por recursos-service cuando se crea/elimina un Recurso, o
// cambia su disponibilidad (Disponible <-> En mantenimiento/Fuera de
// servicio), para que el catalogo de equipos reservables refleje siempre
// el numero real de unidades disponibles. Se agrupa por nombre (varios
// recursos con el mismo nombre = varias unidades del mismo equipo).
//
// "eliminarSiVacio" solo lo manda recursos-service al ELIMINAR un
// recurso: si ese era la ultima unidad, el equipo desaparece del todo
// del catalogo (ya no existe ningun recurso real detras). En cambio,
// quedarse sin stock por mantenimiento o por una reserva confirmada es
// temporal, asi que el equipo se queda en el catalogo con 0 unidades.
export async function sincronizarEquipo(req, res) {
  const { codigo, nombre, tipo, delta, eliminarSiVacio } = req.body
  if (!nombre || typeof delta !== 'number') {
    return res.status(400).json({ error: 'nombre y delta son obligatorios.' })
  }

  let equipo = await Equipo.findOne({ where: { nombre } })
  if (equipo) {
    const nuevoStock = equipo.stock + delta
    if (eliminarSiVacio && nuevoStock <= 0) {
      await equipo.destroy()
      return res.json({ ok: true, eliminado: true })
    }
    equipo.stock = Math.max(0, nuevoStock)
    await equipo.save()
  } else if (delta > 0) {
    equipo = await Equipo.create({
      codigo: codigo || `EQ-${Date.now()}`,
      nombre,
      tipo: tipo || 'Equipo de cómputo',
      stock: delta,
    })
  }

  res.json(equipo || { ok: true })
}

export async function obtenerCatalogo(req, res) {
  const [pabellones, salones, salasEspeciales, salasBiblioteca, equipos] = await Promise.all([
    Pabellon.findAll({ order: [['id', 'ASC']] }),
    Salon.findAll({ order: [['id', 'ASC']] }),
    SalaEspecial.findAll({ order: [['id', 'ASC']] }),
    SalaBiblioteca.findAll({ order: [['id', 'ASC']] }),
    Equipo.findAll({ order: [['codigo', 'ASC']] }),
  ])

  const pabellonesConSalones = pabellones.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    salones: salones.filter((s) => s.pabellonId === p.id),
  }))

  res.json({ pabellones: pabellonesConSalones, salasEspeciales, salasBiblioteca, equipos })
}
