// Datos ficticios iniciales para UAJS Smart Campus.
// No corresponden a información real de estudiantes, docentes o funcionarios.

const pabellonesBase = ['A', 'B', 'C', 'D']

export const pabellones = pabellonesBase.map((letra) => ({
  id: letra,
  nombre: `Pabellón ${letra}`,
  salones: Array.from({ length: 17 }, (_, i) => {
    const numero = String(i + 1).padStart(2, '0')
    return {
      id: `${letra}${numero}`,
      nombre: `Salón ${letra}${numero}`,
      capacidad: 30 + ((i % 4) * 10),
    }
  }),
}))

export const salasEspeciales = [
  { id: 'S01', nombre: 'Sala S01', tipo: 'Auditorio', capacidad: 80 },
  { id: 'S02', nombre: 'Sala S02', tipo: 'Sala de juntas', capacidad: 20 },
  { id: 'S03', nombre: 'Sala S03', tipo: 'Laboratorio', capacidad: 25 },
  { id: 'S04', nombre: 'Sala S04', tipo: 'Sala múltiple', capacidad: 40 },
]

export const usuarios = [
  { id: 1, nombre: 'Camilo Ramírez', rol: 'Estudiante', programa: 'Ingeniería de Sistemas', correo: 'camilo.ramirez@uajs.edu.co', estado: 'Activo' },
  { id: 2, nombre: 'Laura Pérez', rol: 'Docente', programa: 'Facultad de Ingeniería', correo: 'laura.perez@uajs.edu.co', estado: 'Activo' },
  { id: 3, nombre: 'Andrés Gómez', rol: 'Administrativo', programa: 'Bienestar Universitario', correo: 'andres.gomez@uajs.edu.co', estado: 'Activo' },
]

// Dependencias / responsables a los que se puede asignar una solicitud
export const dependencias = [
  'Registro Académico',
  'Recursos Tecnológicos',
  'Coordinación Académica',
  'Bienestar Universitario',
  'Sin asignar',
]

export const estadosSolicitud = [
  'Registrada',
  'En revisión',
  'Asignada',
  'En proceso',
  'Resuelta',
  'Cerrada',
]

export const tiposSolicitud = [
  'Certificado académico',
  'Cambio de horario',
  'Constancia de matrícula',
  'Homologación de asignatura',
  'Corrección de datos personales',
  'Carta de presentación',
  'Otro',
]

export const solicitudesIniciales = [
  { id: 'SOL-0231', tipo: 'Certificado académico', dependencia: 'Registro Académico', fecha: '2026-08-18', prioridad: 'Media', estado: 'En revisión', descripcion: 'Solicitud de certificado de notas para trámite externo.', asignadoA: 'Registro Académico', solicitante: 'Camilo Ramírez', rolSolicitante: 'Estudiante', historial: [{ estado: 'Registrada', fecha: '2026-08-18', por: 'Camilo Ramírez' }, { estado: 'En revisión', fecha: '2026-08-19', por: 'Andrés Gómez' }] },
  { id: 'SOL-0229', tipo: 'Corrección de datos personales', dependencia: 'Registro Académico', fecha: '2026-08-15', prioridad: 'Alta', estado: 'Asignada', descripcion: 'Corrección del número de documento registrado.', asignadoA: 'Registro Académico', solicitante: 'Camilo Ramírez', rolSolicitante: 'Estudiante', historial: [{ estado: 'Registrada', fecha: '2026-08-15', por: 'Camilo Ramírez' }, { estado: 'Asignada', fecha: '2026-08-16', por: 'Andrés Gómez' }] },
  { id: 'SOL-0214', tipo: 'Cambio de horario', dependencia: 'Coordinación Académica', fecha: '2026-08-10', prioridad: 'Baja', estado: 'Resuelta', descripcion: 'Solicitud de cambio de grupo por cruce de horario.', asignadoA: 'Coordinación Académica', solicitante: 'Laura Pérez', rolSolicitante: 'Docente', historial: [{ estado: 'Registrada', fecha: '2026-08-10', por: 'Laura Pérez' }, { estado: 'Resuelta', fecha: '2026-08-12', por: 'Andrés Gómez' }] },
  { id: 'SOL-0198', tipo: 'Constancia de matrícula', dependencia: 'Registro Académico', fecha: '2026-07-30', prioridad: 'Media', estado: 'Cerrada', descripcion: 'Constancia solicitada para entidad bancaria.', asignadoA: 'Registro Académico', solicitante: 'Camilo Ramírez', rolSolicitante: 'Estudiante', historial: [{ estado: 'Registrada', fecha: '2026-07-30', por: 'Camilo Ramírez' }, { estado: 'Cerrada', fecha: '2026-08-02', por: 'Andrés Gómez' }] },
]

// Catalogo de salas de biblioteca reservables
export const salasBiblioteca = [
  { id: 'B01', nombre: 'Sala de lectura 1', capacidad: 6 },
  { id: 'B02', nombre: 'Sala de lectura 2', capacidad: 6 },
  { id: 'B03', nombre: 'Sala de estudio grupal', capacidad: 10 },
]

// Catalogo de equipos reservables (usado tanto en Recursos como en Reservas)
export const equiposReservables = [
  { codigo: 'REC-001', nombre: 'Videobeam Epson X400', tipo: 'Audiovisual' },
  { codigo: 'REC-014', nombre: 'Portátil Dell Latitude', tipo: 'Equipo de cómputo' },
  { codigo: 'REC-031', nombre: 'Amplificador portátil', tipo: 'Audiovisual' },
]

export const recursos = [
  { codigo: 'REC-001', nombre: 'Videobeam Epson X400', tipo: 'Audiovisual', ubicacion: 'Almacén Pabellón A', estado: 'Disponible' },
  { codigo: 'REC-014', nombre: 'Portátil Dell Latitude', tipo: 'Equipo de cómputo', ubicacion: 'Sala S03', estado: 'En mantenimiento' },
  { codigo: 'REC-031', nombre: 'Amplificador portátil', tipo: 'Audiovisual', ubicacion: 'Sala S01', estado: 'Disponible' },
]

export const tiposRecurso = ['Audiovisual', 'Equipo de cómputo', 'Mobiliario', 'Instrumento de laboratorio', 'Otro']
export const estadosRecurso = ['Disponible', 'En mantenimiento', 'Fuera de servicio']

export const estadosReserva = ['Pendiente', 'Confirmada', 'Cancelada', 'Denegada']

export const reservasIniciales = [
  { id: 'RES-0118', tipoEspacio: 'espacio', espacio: 'Salón B05', fecha: '2026-08-19', horaInicio: '08:00', horaFin: '10:00', motivo: 'Clase de Bases de Datos', estado: 'Confirmada', solicitante: 'Laura Pérez', rolSolicitante: 'Docente', historial: [{ estado: 'Pendiente', fecha: '2026-08-17', por: 'Laura Pérez' }, { estado: 'Confirmada', fecha: '2026-08-17', por: 'Andrés Gómez' }] },
  { id: 'RES-0121', tipoEspacio: 'espacio', espacio: 'Sala S02', fecha: '2026-08-22', horaInicio: '14:00', horaFin: '16:00', motivo: 'Reunión de semillero de investigación', estado: 'Pendiente', solicitante: 'Laura Pérez', rolSolicitante: 'Docente', historial: [{ estado: 'Pendiente', fecha: '2026-08-20', por: 'Laura Pérez' }] },
  { id: 'RES-0102', tipoEspacio: 'espacio', espacio: 'Sala S02', fecha: '2026-08-12', horaInicio: '09:00', horaFin: '11:00', motivo: 'Taller de emprendimiento', estado: 'Cancelada', solicitante: 'Andrés Gómez', rolSolicitante: 'Administrativo', historial: [{ estado: 'Pendiente', fecha: '2026-08-10', por: 'Andrés Gómez' }, { estado: 'Cancelada', fecha: '2026-08-11', por: 'Andrés Gómez' }] },
  { id: 'RES-0130', tipoEspacio: 'equipo', espacio: 'Portátil Dell Latitude', fecha: '2026-08-23', horaInicio: '10:00', horaFin: '12:00', motivo: 'Sustentación de proyecto final', estado: 'Pendiente', solicitante: 'Camilo Ramírez', rolSolicitante: 'Estudiante', historial: [{ estado: 'Pendiente', fecha: '2026-08-21', por: 'Camilo Ramírez' }] },
]

export const eventosIniciales = [
  { id: 1, titulo: 'Semana de la Ingeniería', fecha: '2026-09-02', hora: '09:00', lugar: 'Sala S01', ponente: 'Facultad de Ingeniería', descripcion: 'Actividades y charlas durante toda la semana.' },
  { id: 2, titulo: 'Conferencia: Sistemas Distribuidos en la práctica', fecha: '2026-09-05', hora: '15:00', lugar: 'Salón B10', ponente: 'Ing. Marcela Torres', descripcion: 'Charla sobre arquitecturas distribuidas aplicadas.' },
  { id: 3, titulo: 'Taller de emprendimiento universitario', fecha: '2026-09-10', hora: '10:00', lugar: 'Sala S04', ponente: 'Bienestar Universitario', descripcion: 'Taller práctico para nuevos emprendedores UAJS.' },
]

export const inscripcionesIniciales = [
  { eventoId: 1, nombre: 'Camilo Ramírez', rol: 'Estudiante' },
  { eventoId: 2, nombre: 'Laura Pérez', rol: 'Docente' },
]

export const notificacionesIniciales = [
  { id: 1, categoria: 'Solicitudes', mensaje: 'Tu solicitud SOL-0229 cambió a estado Asignada.', fecha: '2026-08-20', leida: false },
  { id: 2, categoria: 'Reservas', mensaje: 'Reserva aprobada para Salón B05 el 19 de agosto.', fecha: '2026-08-18', leida: false },
  { id: 3, categoria: 'Institucional', mensaje: 'Recuerda inscribirte a la Semana de la Ingeniería.', fecha: '2026-08-17', leida: true },
  { id: 4, categoria: 'Solicitudes', mensaje: 'Tu solicitud SOL-0214 fue resuelta.', fecha: '2026-08-11', leida: true },
]

export const tiposPqrs = ['Petición', 'Queja', 'Reclamo', 'Sugerencia']
export const estadosPqrs = ['Registrada', 'En gestión', 'Resuelta']

export const pqrsIniciales = [
  { id: 'PQRS-1042', tipo: 'Petición', dirigidoA: 'Registro Académico', asunto: 'Corrección de nota en acta', descripcion: 'Solicito revisión de la nota registrada en el acta de calificaciones.', estado: 'En gestión', respuesta: '', fecha: '2026-08-14', solicitante: 'Camilo Ramírez', rolSolicitante: 'Estudiante', asignadoA: 'Laura Pérez', historial: [{ estado: 'Registrada', fecha: '2026-08-14', por: 'Camilo Ramírez' }, { estado: 'En gestión', fecha: '2026-08-15', por: 'Andrés Gómez' }] },
  { id: 'PQRS-1037', tipo: 'Sugerencia', dirigidoA: 'Bienestar Universitario', asunto: 'Ampliar horario de la biblioteca', descripcion: 'Sugiero ampliar el horario de atención los sábados.', estado: 'Resuelta', respuesta: 'Se amplió el horario de la biblioteca los sábados hasta las 4:00 p.m.', fecha: '2026-07-28', solicitante: 'Camilo Ramírez', rolSolicitante: 'Estudiante', asignadoA: 'Andrés Gómez', historial: [{ estado: 'Registrada', fecha: '2026-07-28', por: 'Camilo Ramírez' }, { estado: 'Resuelta', fecha: '2026-07-30', por: 'Andrés Gómez' }] },
]
