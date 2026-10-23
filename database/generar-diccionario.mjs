/**
 * Genera database/MODELO-DATOS.md: diagrama entidad-relación (Mermaid) y
 * diccionario de datos de las 6 bases, leídos de la estructura real
 * (information_schema), no escritos a mano. Así el documento no se
 * desactualiza: después de cambiar un modelo se vuelve a correr.
 *
 * Uso (desde la raíz del repo, con las bases creadas):
 *   node database/generar-diccionario.mjs
 * Conexión: PGHOST, PGPORT, PGUSER, PGPASSWORD (por defecto localhost:5432,
 * uajs / uajs_dev_pass, igual que backend/docker-compose.yml).
 *
 * Usa el paquete "pg" que ya está instalado en backend/node_modules.
 */
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(aqui, '../backend/package.json'))
const { Client } = require('pg')

const BASES = [
  { base: 'uajs_usuarios', servicio: 'usuarios-service (4001)' },
  { base: 'uajs_solicitudes', servicio: 'solicitudes-service (4002)' },
  { base: 'uajs_reservas', servicio: 'reservas-service (4003)' },
  { base: 'uajs_recursos', servicio: 'recursos-service (4004)' },
  { base: 'uajs_eventos', servicio: 'eventos-service (4005)' },
  { base: 'uajs_notificaciones', servicio: 'notificaciones-service (4006)' },
]

// Qué guarda cada tabla (lo único escrito a mano en este generador).
const DESCRIPCION_TABLA = {
  usuarios: 'Cuentas de la plataforma: datos personales, rol, registro académico/laboral y token de recuperación de contraseña.',
  permisos: 'Módulos habilitados para cada rol gestionable. El Administrador del sistema siempre tiene acceso total y no aparece aquí.',
  solicitudes: 'Trámites académicos radicados (certificados, constancias, cambios de horario, etc.) con su estado y respuesta oficial.',
  solicitudes_historial: 'Cada cambio de estado de una solicitud: quién lo hizo y cuándo.',
  pqrs: 'Peticiones, quejas, reclamos y sugerencias, con el responsable asignado y la respuesta.',
  pqrs_historial: 'Cada cambio de estado de una PQRS.',
  pabellones: 'Bloques físicos del campus que agrupan salones.',
  salones: 'Salones de clase reservables, con su capacidad.',
  salas_especiales: 'Salas reservables con un uso particular (auditorio, sala de juntas, laboratorios).',
  salas_biblioteca: 'Salas de estudio de la biblioteca.',
  equipos: 'Catálogo de equipos reservables y sus unidades disponibles; se sincroniza con recursos-service.',
  reservas: 'Reservas de espacios o equipos: espacio, fecha, franja horaria, motivo y estado.',
  reservas_historial: 'Cada cambio de estado de una reserva.',
  recursos: 'Inventario de recursos físicos y tecnológicos con su ubicación y estado.',
  recursos_historial: 'Cada cambio de estado de un recurso.',
  eventos: 'Agenda institucional: eventos por facultad, con cupo máximo opcional y estado.',
  inscripciones: 'Inscripción de un usuario a un evento (un usuario solo se inscribe una vez por evento).',
  notificaciones: 'Avisos para un usuario, con su categoría y si ya fueron leídos.',
}

const SQL_COLUMNAS = `
  SELECT c.table_name, c.column_name, c.ordinal_position, c.is_nullable,
         c.column_default, c.data_type, c.udt_name, c.character_maximum_length
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ORDER BY c.table_name, c.ordinal_position`

const SQL_RESTRICCIONES = `
  SELECT rel.relname AS tabla, con.contype AS tipo,
         array_agg(att.attname::text ORDER BY k.ord) AS columnas,
         frel.relname AS tabla_ref,
         con.confdeltype AS al_borrar
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = rel.relnamespace AND ns.nspname = 'public'
  CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = k.attnum
  LEFT JOIN pg_class frel ON frel.oid = con.confrelid
  WHERE con.contype IN ('p', 'u', 'f')
  GROUP BY rel.relname, con.contype, frel.relname, con.confdeltype, con.oid`

// Índices UNIQUE de varias columnas que Sequelize crea como índice, no como constraint.
const SQL_INDICES_UNICOS = `
  SELECT t.relname AS tabla, array_agg(a.attname::text ORDER BY k.ord) AS columnas
  FROM pg_index i
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
  CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
  WHERE i.indisunique AND NOT i.indisprimary
    AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
  GROUP BY t.relname, i.indexrelid`

const SQL_ENUMS = `
  SELECT t.typname, array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS valores
  FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
  GROUP BY t.typname`

const AL_BORRAR = { c: 'CASCADE', r: 'RESTRICT', n: 'SET NULL', a: 'NO ACTION', d: 'SET DEFAULT' }

function tipoLegible(col, enums) {
  if (col.data_type === 'USER-DEFINED' && enums[col.udt_name]) return 'ENUM'
  if (col.data_type === 'character varying') return `VARCHAR(${col.character_maximum_length})`
  if (col.data_type === 'timestamp with time zone') return 'TIMESTAMPTZ'
  return col.data_type.toUpperCase()
}

// Mermaid no acepta espacios ni paréntesis en el tipo.
function tipoMermaid(col, enums) {
  return tipoLegible(col, enums).replace(/\(.*\)/, '').replace(/\s+/g, '_').toLowerCase()
}

function pipe(texto) {
  return String(texto).replace(/\|/g, '\\|')
}

async function leerBase(base) {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'uajs',
    password: process.env.PGPASSWORD || 'uajs_dev_pass',
    database: base,
  })
  await client.connect()
  try {
    const columnas = await client.query(SQL_COLUMNAS)
    const restricciones = await client.query(SQL_RESTRICCIONES)
    const unicos = await client.query(SQL_INDICES_UNICOS)
    const enums = await client.query(SQL_ENUMS)
    return {
      columnas: columnas.rows,
      restricciones: restricciones.rows,
      unicos: unicos.rows,
      enums: Object.fromEntries(enums.rows.map((r) => [r.typname, r.valores])),
    }
  } finally {
    await client.end()
  }
}

function seccionBase({ base, servicio }, datos) {
  const { columnas, restricciones, unicos, enums } = datos
  const tablas = [...new Set(columnas.map((c) => c.table_name))]
  const pk = new Set()
  const unique = new Set()
  const fk = new Map()
  for (const r of restricciones) {
    for (const col of r.columnas) {
      const clave = `${r.tabla}.${col}`
      if (r.tipo === 'p') pk.add(clave)
      if (r.tipo === 'u' && r.columnas.length === 1) unique.add(clave)
      if (r.tipo === 'f') fk.set(clave, { ref: r.tabla_ref, alBorrar: AL_BORRAR[r.al_borrar] })
    }
  }
  const unicosCompuestos = [
    ...restricciones.filter((r) => r.tipo === 'u' && r.columnas.length > 1).map((r) => r),
    ...unicos.map((u) => ({ tabla: u.tabla, columnas: u.columnas })),
  ]
  for (const u of unicos) if (u.columnas.length === 1) unique.add(`${u.tabla}.${u.columnas[0]}`)

  const lineas = []
  lineas.push(`## \`${base}\` — ${servicio}`, '')

  // Diagrama entidad-relación
  lineas.push('```mermaid', 'erDiagram')
  for (const r of restricciones.filter((x) => x.tipo === 'f')) {
    lineas.push(`  ${r.tabla_ref} ||--o{ ${r.tabla} : "${r.columnas.join(', ')}"`)
  }
  for (const tabla of tablas) {
    lineas.push(`  ${tabla} {`)
    for (const col of columnas.filter((c) => c.table_name === tabla)) {
      const clave = `${tabla}.${col.column_name}`
      const marcas = [pk.has(clave) && 'PK', fk.has(clave) && 'FK', unique.has(clave) && 'UK'].filter(Boolean)
      lineas.push(`    ${tipoMermaid(col, enums)} ${col.column_name}${marcas.length ? ' ' + marcas.join(',') : ''}`)
    }
    lineas.push('  }')
  }
  lineas.push('```', '')

  // Diccionario de datos
  for (const tabla of tablas) {
    lineas.push(`### Tabla \`${tabla}\``, '')
    if (DESCRIPCION_TABLA[tabla]) lineas.push(DESCRIPCION_TABLA[tabla], '')
    lineas.push('| Columna | Tipo | Nulo | Por defecto | Restricciones |', '|---|---|---|---|---|')
    for (const col of columnas.filter((c) => c.table_name === tabla)) {
      const clave = `${tabla}.${col.column_name}`
      const restr = []
      if (pk.has(clave)) restr.push('PK')
      if (unique.has(clave)) restr.push('UNIQUE')
      if (fk.has(clave)) restr.push(`FK → \`${fk.get(clave).ref}\` (ON DELETE ${fk.get(clave).alBorrar})`)
      if (col.data_type === 'USER-DEFINED' && enums[col.udt_name]) restr.push(`Valores: ${enums[col.udt_name].join(', ')}`)
      let porDefecto = col.column_default || ''
      if (porDefecto.startsWith('nextval(')) porDefecto = 'autoincremental'
      porDefecto = porDefecto.replace(/::[\w ."]+/g, '')
      lineas.push(
        `| \`${col.column_name}\` | ${tipoLegible(col, enums)} | ${col.is_nullable === 'YES' ? 'Sí' : 'No'} | ${pipe(porDefecto)} | ${pipe(restr.join('; '))} |`,
      )
    }
    const compuestos = unicosCompuestos.filter((u) => u.tabla === tabla && u.columnas.length > 1)
    for (const u of compuestos) lineas.push('', `Única por combinación: (${u.columnas.map((c) => `\`${c}\``).join(', ')}).`)
    lineas.push('')
  }
  return lineas.join('\n')
}

const ENCABEZADO = `# Modelo de datos — UAJS Smart Campus

> Archivo generado por \`database/generar-diccionario.mjs\` a partir de la
> estructura real de las bases. No editar a mano: cambiar el modelo en el
> microservicio, recrear la base y volver a correr el generador. La parte
> escrita a mano (decisiones de diseño, propiedad de los datos) está en
> \`database/README.md\`.

Seis bases PostgreSQL, una por microservicio de negocio. \`busqueda-service\`
no tiene base relacional: usa un índice de Elasticsearch (\`uajs_buscar\`)
que alimentan los demás servicios.

Convenciones: **PK** llave primaria, **FK** llave foránea, **UK** valor
único. Las llaves foráneas solo existen entre tablas de la misma base; las
referencias a datos de otro microservicio (por ejemplo \`solicitanteId\`, que
apunta a un usuario) son referencias lógicas por id, sin llave foránea,
porque viven en otra base.
`

const secciones = [ENCABEZADO]
for (const b of BASES) {
  secciones.push(seccionBase(b, await leerBase(b.base)))
}
const destino = path.join(aqui, 'MODELO-DATOS.md')
writeFileSync(destino, secciones.join('\n') + '\n')
console.log(`Generado ${path.relative(process.cwd(), destino)}`)
