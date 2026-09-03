import { Pabellon, Salon, SalaEspecial, SalaBiblioteca, Equipo } from '../models/index.js'

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
