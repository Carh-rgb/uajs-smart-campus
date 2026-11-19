// Catalogos institucionales para los formularios de usuarios.
// Los programas son los que publica la Corporacion en su acuerdo de derechos
// pecuniarios 2026; su agrupacion por facultad la definio el equipo y se
// ajusta aqui en un solo lugar si la universidad la organiza distinto.
export const FACULTADES = [
  {
    nombre: 'Facultad de Ciencias de la Ingeniería',
    programas: ['Ingeniería de Sistemas', 'Ingeniería Electrónica', 'Ingeniería Industrial'],
  },
  {
    nombre: 'Facultad de Ciencias Administrativas, Económicas y Contables',
    programas: ['Administración de Empresas', 'Administración de Negocios Internacionales', 'Contaduría Pública'],
  },
  {
    nombre: 'Facultad de Ciencias Sociales y Educación',
    programas: ['Derecho', 'Psicología', 'Comunicación Social', 'Licenciatura en Matemáticas'],
  },
  {
    nombre: 'Facultad de Ciencias de la Salud',
    programas: ['Fisioterapia', 'Enfermería', 'Seguridad y Salud en el Trabajo'],
  },
]

export const programasDe = (facultad) => FACULTADES.find((f) => f.nombre === facultad)?.programas || []

// Facultad a la que pertenece un programa (para datos guardados sin facultad).
export const facultadDe = (programa) => FACULTADES.find((f) => f.programas.includes(programa))?.nombre || ''

export const DEPENDENCIAS = [
  'Rectoría',
  'Vicerrectoría Académica',
  'Secretaría General',
  'Registro Académico',
  'Admisiones y Mercadeo',
  'Bienestar Universitario',
  'Biblioteca',
  'Dirección Financiera',
  'Talento Humano',
  'Oficina de Tecnología',
  'Investigación',
  'Proyección Social',
]

export const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
