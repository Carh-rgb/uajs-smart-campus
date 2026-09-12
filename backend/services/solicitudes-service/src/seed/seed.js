import { Solicitud, SolicitudHistorial, Pqrs, PqrsHistorial } from '../models/index.js'

// IDs de usuario asumidos segun el orden de siembra de usuarios-service
// (Camilo=1 Estudiante, Laura=2 Docente, Andres=3 Administrativo, Admin=4).
// En un entorno real se resolverian por correo via el propio servicio de
// usuarios; aqui se fijan para reproducir los mismos datos de demo que
// tenia el frontend con mocks.
const CAMILO = { id: 1, nombre: 'Camilo Ramírez', rol: 'Estudiante' }
const LAURA = { id: 2, nombre: 'Laura Pérez', rol: 'Docente' }
const ANDRES = { id: 3, nombre: 'Andrés Gómez', rol: 'Administrativo' }

const SOLICITUDES_SEED = [
  { id: 'SOL-0231', tipo: 'Certificado académico', dependencia: 'Registro Académico', fecha: '2026-08-18', prioridad: 'Media', estado: 'En revisión', descripcion: 'Solicitud de certificado de notas para trámite externo.', asignadoA: 'Registro Académico', solicitante: CAMILO, historial: [{ estado: 'Registrada', fecha: '2026-08-18', por: CAMILO.nombre }, { estado: 'En revisión', fecha: '2026-08-19', por: ANDRES.nombre }] },
  { id: 'SOL-0229', tipo: 'Corrección de datos personales', dependencia: 'Registro Académico', fecha: '2026-08-15', prioridad: 'Alta', estado: 'Asignada', descripcion: 'Corrección del número de documento registrado.', asignadoA: 'Registro Académico', solicitante: CAMILO, historial: [{ estado: 'Registrada', fecha: '2026-08-15', por: CAMILO.nombre }, { estado: 'Asignada', fecha: '2026-08-16', por: ANDRES.nombre }] },
  { id: 'SOL-0214', tipo: 'Cambio de horario', dependencia: 'Coordinación Académica', fecha: '2026-08-10', prioridad: 'Baja', estado: 'Resuelta', descripcion: 'Solicitud de cambio de grupo por cruce de horario.', asignadoA: 'Coordinación Académica', solicitante: LAURA, historial: [{ estado: 'Registrada', fecha: '2026-08-10', por: LAURA.nombre }, { estado: 'Resuelta', fecha: '2026-08-12', por: ANDRES.nombre }] },
  { id: 'SOL-0198', tipo: 'Constancia de matrícula', dependencia: 'Registro Académico', fecha: '2026-07-30', prioridad: 'Media', estado: 'Cerrada', descripcion: 'Constancia solicitada para entidad bancaria.', asignadoA: 'Registro Académico', solicitante: CAMILO, historial: [{ estado: 'Registrada', fecha: '2026-07-30', por: CAMILO.nombre }, { estado: 'Cerrada', fecha: '2026-08-02', por: ANDRES.nombre }] },
]

const PQRS_SEED = [
  { id: 'PQRS-1042', tipo: 'Petición', dirigidoA: 'Registro Académico', asunto: 'Corrección de nota en acta', descripcion: 'Solicito revisión de la nota registrada en el acta de calificaciones.', estado: 'En gestión', fecha: '2026-08-14', solicitante: CAMILO, asignadoA: LAURA.nombre, historial: [{ estado: 'Registrada', fecha: '2026-08-14', por: CAMILO.nombre }, { estado: 'En gestión', fecha: '2026-08-15', por: ANDRES.nombre }] },
  { id: 'PQRS-1037', tipo: 'Sugerencia', dirigidoA: 'Bienestar Universitario', asunto: 'Ampliar horario de la biblioteca', descripcion: 'Sugiero ampliar el horario de atención los sábados.', estado: 'Resuelta', respuesta: 'Se amplió el horario de la biblioteca los sábados hasta las 4:00 p.m.', fecha: '2026-07-28', solicitante: CAMILO, asignadoA: ANDRES.nombre, historial: [{ estado: 'Registrada', fecha: '2026-07-28', por: CAMILO.nombre }, { estado: 'Resuelta', fecha: '2026-07-30', por: ANDRES.nombre }] },
]

export async function seed() {
  if ((await Solicitud.count()) === 0) {
    for (const s of SOLICITUDES_SEED) {
      await Solicitud.create({
        id: s.id,
        tipo: s.tipo,
        dependencia: s.dependencia,
        fecha: s.fecha,
        prioridad: s.prioridad,
        estado: s.estado,
        descripcion: s.descripcion,
        asignadoA: s.asignadoA,
        solicitanteId: s.solicitante.id,
        solicitanteNombre: s.solicitante.nombre,
        rolSolicitante: s.solicitante.rol,
      })
      await SolicitudHistorial.bulkCreate(s.historial.map((h) => ({ solicitudId: s.id, ...h })))
    }
    console.log(`[solicitudes-service] Sembradas ${SOLICITUDES_SEED.length} solicitudes.`)
  }

  if ((await Pqrs.count()) === 0) {
    for (const p of PQRS_SEED) {
      await Pqrs.create({
        id: p.id,
        tipo: p.tipo,
        dirigidoA: p.dirigidoA,
        asunto: p.asunto,
        descripcion: p.descripcion,
        estado: p.estado,
        respuesta: p.respuesta || null,
        fecha: p.fecha,
        solicitanteId: p.solicitante.id,
        solicitante: p.solicitante.nombre,
        rolSolicitante: p.solicitante.rol,
        asignadoA: p.asignadoA,
      })
      await PqrsHistorial.bulkCreate(p.historial.map((h) => ({ pqrsId: p.id, ...h })))
    }
    console.log(`[solicitudes-service] Sembradas ${PQRS_SEED.length} PQRS.`)
  }
}
