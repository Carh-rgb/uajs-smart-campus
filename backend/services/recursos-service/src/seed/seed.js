import { Recurso, RecursoHistorial } from '../models/index.js'

const RECURSOS_SEED = [
  { codigo: 'REC-001', nombre: 'Videobeam Epson X400', tipo: 'Audiovisual', ubicacion: 'Almacén Pabellón A', estado: 'Disponible' },
  { codigo: 'REC-014', nombre: 'Portátil Dell Latitude', tipo: 'Equipo de cómputo', ubicacion: 'Sala S03', estado: 'En mantenimiento' },
  { codigo: 'REC-031', nombre: 'Amplificador portátil', tipo: 'Audiovisual', ubicacion: 'Sala S01', estado: 'Disponible' },
]

export async function seed() {
  if ((await Recurso.count()) === 0) {
    await Recurso.bulkCreate(RECURSOS_SEED)
    await RecursoHistorial.bulkCreate(
      RECURSOS_SEED.map((r) => ({ recursoCodigo: r.codigo, estado: r.estado, fecha: '2026-07-15', por: 'Sistema' })),
    )
    console.log(`[recursos-service] Sembrados ${RECURSOS_SEED.length} recursos.`)
  }
}
