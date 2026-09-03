import { Pabellon, Salon, SalaEspecial, SalaBiblioteca, Equipo, Reserva, ReservaHistorial } from '../models/index.js'

const CAMILO = { id: 1, nombre: 'Camilo Ramírez', rol: 'Estudiante' }
const LAURA = { id: 2, nombre: 'Laura Pérez', rol: 'Docente' }
const ANDRES = { id: 3, nombre: 'Andrés Gómez', rol: 'Administrativo' }

const PABELLONES = ['A', 'B', 'C', 'D']

const SALAS_ESPECIALES = [
  { id: 'S01', nombre: 'Sala S01', tipo: 'Auditorio', capacidad: 80 },
  { id: 'S02', nombre: 'Sala S02', tipo: 'Sala de juntas', capacidad: 20 },
  { id: 'S03', nombre: 'Sala S03', tipo: 'Laboratorio', capacidad: 25 },
  { id: 'S04', nombre: 'Sala S04', tipo: 'Sala múltiple', capacidad: 40 },
]

const SALAS_BIBLIOTECA = [
  { id: 'B01', nombre: 'Sala de lectura 1', capacidad: 6 },
  { id: 'B02', nombre: 'Sala de lectura 2', capacidad: 6 },
  { id: 'B03', nombre: 'Sala de estudio grupal', capacidad: 10 },
]

const EQUIPOS = [
  { codigo: 'REC-001', nombre: 'Videobeam Epson X400', tipo: 'Audiovisual' },
  { codigo: 'REC-014', nombre: 'Portátil Dell Latitude', tipo: 'Equipo de cómputo' },
  { codigo: 'REC-031', nombre: 'Amplificador portátil', tipo: 'Audiovisual' },
]

const RESERVAS_SEED = [
  { id: 'RES-0118', tipoEspacio: 'espacio', espacio: 'Salón B05', fecha: '2026-08-19', horaInicio: '08:00', horaFin: '10:00', motivo: 'Clase de Bases de Datos', estado: 'Confirmada', solicitante: LAURA, historial: [{ estado: 'Pendiente', fecha: '2026-08-17', por: LAURA.nombre }, { estado: 'Confirmada', fecha: '2026-08-17', por: ANDRES.nombre }] },
  { id: 'RES-0121', tipoEspacio: 'espacio', espacio: 'Sala S02', fecha: '2026-08-22', horaInicio: '14:00', horaFin: '16:00', motivo: 'Reunión de semillero de investigación', estado: 'Pendiente', solicitante: LAURA, historial: [{ estado: 'Pendiente', fecha: '2026-08-20', por: LAURA.nombre }] },
  { id: 'RES-0102', tipoEspacio: 'espacio', espacio: 'Sala S02', fecha: '2026-08-12', horaInicio: '09:00', horaFin: '11:00', motivo: 'Taller de emprendimiento', estado: 'Cancelada', solicitante: ANDRES, historial: [{ estado: 'Pendiente', fecha: '2026-08-10', por: ANDRES.nombre }, { estado: 'Cancelada', fecha: '2026-08-11', por: ANDRES.nombre }] },
  { id: 'RES-0130', tipoEspacio: 'equipo', espacio: 'Portátil Dell Latitude', fecha: '2026-08-23', horaInicio: '10:00', horaFin: '12:00', motivo: 'Sustentación de proyecto final', estado: 'Pendiente', solicitante: CAMILO, historial: [{ estado: 'Pendiente', fecha: '2026-08-21', por: CAMILO.nombre }] },
]

export async function seed() {
  if ((await Pabellon.count()) === 0) {
    await Pabellon.bulkCreate(PABELLONES.map((letra) => ({ id: letra, nombre: `Pabellón ${letra}` })))

    const salones = []
    for (const letra of PABELLONES) {
      for (let i = 0; i < 17; i++) {
        const numero = String(i + 1).padStart(2, '0')
        salones.push({
          id: `${letra}${numero}`,
          pabellonId: letra,
          nombre: `Salón ${letra}${numero}`,
          capacidad: 30 + (i % 4) * 10,
        })
      }
    }
    await Salon.bulkCreate(salones)
    await SalaEspecial.bulkCreate(SALAS_ESPECIALES)
    await SalaBiblioteca.bulkCreate(SALAS_BIBLIOTECA)
    await Equipo.bulkCreate(EQUIPOS)
    console.log('[reservas-service] Sembrado catálogo de pabellones, salas y equipos.')
  }

  if ((await Reserva.count()) === 0) {
    for (const r of RESERVAS_SEED) {
      await Reserva.create({
        id: r.id,
        tipoEspacio: r.tipoEspacio,
        espacio: r.espacio,
        fecha: r.fecha,
        horaInicio: r.horaInicio,
        horaFin: r.horaFin,
        motivo: r.motivo,
        estado: r.estado,
        solicitanteId: r.solicitante.id,
        solicitanteNombre: r.solicitante.nombre,
        rolSolicitante: r.solicitante.rol,
      })
      await ReservaHistorial.bulkCreate(r.historial.map((h) => ({ reservaId: r.id, ...h })))
    }
    console.log(`[reservas-service] Sembradas ${RESERVAS_SEED.length} reservas.`)
  }
}
