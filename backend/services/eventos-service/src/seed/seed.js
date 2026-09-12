import { Evento, Inscripcion } from '../models/index.js'

const CAMILO = { id: 1, nombre: 'Camilo Ramírez', rol: 'Estudiante' }
const LAURA = { id: 2, nombre: 'Laura Pérez', rol: 'Docente' }

const EVENTOS_SEED = [
  {
    titulo: 'Semana de la Ingeniería',
    fecha: '2026-09-02',
    hora: '09:00',
    lugar: 'Sala S01',
    ponente: 'Facultad de Ingeniería',
    descripcion: 'Actividades y charlas durante toda la semana.',
    facultad: 'Facultad de Ciencias de la Ingeniería',
    estado: 'Activo',
    cupoMaximo: null,
  },
  {
    titulo: 'Conferencia: Sistemas Distribuidos en la práctica',
    fecha: '2026-09-05',
    hora: '15:00',
    lugar: 'Salón B10',
    ponente: 'Ing. Marcela Torres',
    descripcion: 'Charla sobre arquitecturas distribuidas aplicadas.',
    facultad: 'Facultad de Ciencias de la Ingeniería',
    estado: 'Activo',
    cupoMaximo: 40,
  },
  {
    titulo: 'Taller de emprendimiento universitario',
    fecha: '2026-09-10',
    hora: '10:00',
    lugar: 'Sala S04',
    ponente: 'Bienestar Universitario',
    descripcion: 'Taller práctico para nuevos emprendedores UAJS.',
    facultad: 'General / Bienestar Universitario',
    estado: 'Activo',
    cupoMaximo: 25,
  },
]

export async function seed() {
  if ((await Evento.count()) === 0) {
    const creados = await Evento.bulkCreate(EVENTOS_SEED, { returning: true })
    console.log(`[eventos-service] Sembrados ${creados.length} eventos.`)

    await Inscripcion.bulkCreate([
      { eventoId: creados[0].id, usuarioId: CAMILO.id, nombre: CAMILO.nombre, rol: CAMILO.rol },
      { eventoId: creados[1].id, usuarioId: LAURA.id, nombre: LAURA.nombre, rol: LAURA.rol },
    ])
    console.log('[eventos-service] Sembradas inscripciones iniciales.')
  }
}
