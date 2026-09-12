import jwt from 'jsonwebtoken'
import { es, INDICE } from '../config/elastic.js'

// Token de servicio (mismo patron que recursos-service -> reservas-service):
// firmado con el JWT_SECRET compartido, con rol Administrador del sistema
// para poder leer el catalogo completo de cada microservicio al arrancar.
function tokenServicio() {
  return jwt.sign(
    { id: 0, nombre: 'busqueda-service', rol: 'Administrador del sistema' },
    process.env.JWT_SECRET,
    { expiresIn: '2m' },
  )
}

const URL_USUARIOS = process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001'
const URL_SOLICITUDES = process.env.SOLICITUDES_SERVICE_URL || 'http://localhost:4002'
const URL_RESERVAS = process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003'
const URL_RECURSOS = process.env.RECURSOS_SERVICE_URL || 'http://localhost:4004'
const URL_EVENTOS = process.env.EVENTOS_SERVICE_URL || 'http://localhost:4005'

async function obtener(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`${url} respondio ${res.status}`)
  return res.json()
}

// Indexado inicial en bloque de todo lo que ya existia antes de que este
// servicio arrancara por primera vez. De ahi en adelante cada microservicio
// mantiene el indice al dia el mismo via PUT/DELETE /buscar/documento.
export async function backfill() {
  const token = tokenServicio()
  const operaciones = []

  try {
    const solicitudes = await obtener(`${URL_SOLICITUDES}/solicitudes`, token)
    for (const s of solicitudes) {
      operaciones.push(
        { index: { _index: INDICE, _id: `solicitud-${s.id}` } },
        {
          tipo: 'solicitud',
          entidadId: s.id,
          titulo: `${s.id} · ${s.tipo}`,
          subtitulo: s.descripcion || s.dependencia,
          texto: [s.descripcion, s.respuesta].filter(Boolean).join(' '),
          estado: s.estado,
          ownerId: s.solicitanteId,
          asignadoA: null,
          ruta: `/app/solicitudes/${s.id}`,
        },
      )
    }
  } catch (err) {
    console.error('[busqueda-service] backfill de solicitudes fallo:', err.message)
  }

  try {
    const pqrs = await obtener(`${URL_SOLICITUDES}/pqrs`, token)
    for (const p of pqrs) {
      operaciones.push(
        { index: { _index: INDICE, _id: `pqrs-${p.id}` } },
        {
          tipo: 'pqrs',
          entidadId: p.id,
          titulo: `${p.id} · ${p.asunto || p.tipo}`,
          subtitulo: p.tipo,
          texto: [p.descripcion, p.respuesta].filter(Boolean).join(' '),
          estado: p.estado,
          ownerId: p.solicitanteId,
          asignadoA: p.asignadoA,
          ruta: '/app/pqrs',
        },
      )
    }
  } catch (err) {
    console.error('[busqueda-service] backfill de PQRS fallo:', err.message)
  }

  try {
    const reservas = await obtener(`${URL_RESERVAS}/reservas`, token)
    for (const r of reservas) {
      operaciones.push(
        { index: { _index: INDICE, _id: `reserva-${r.id}` } },
        {
          tipo: 'reserva',
          entidadId: r.id,
          titulo: `${r.id} · ${r.espacio}`,
          subtitulo: `${r.fecha} · ${r.estado}`,
          texto: r.motivo || '',
          estado: r.estado,
          ownerId: r.solicitanteId,
          asignadoA: null,
          ruta: '/app/reservas',
        },
      )
    }
  } catch (err) {
    console.error('[busqueda-service] backfill de reservas fallo:', err.message)
  }

  try {
    const eventos = await obtener(`${URL_EVENTOS}/eventos`, token)
    for (const e of eventos) {
      operaciones.push(
        { index: { _index: INDICE, _id: `evento-${e.id}` } },
        {
          tipo: 'evento',
          entidadId: e.id,
          titulo: e.titulo,
          subtitulo: `${e.fecha} · ${e.lugar}`,
          texto: [e.descripcion, e.ponente].filter(Boolean).join(' '),
          estado: null,
          ownerId: null,
          asignadoA: null,
          ruta: '/app/eventos',
        },
      )
    }
  } catch (err) {
    console.error('[busqueda-service] backfill de eventos fallo:', err.message)
  }

  try {
    const recursos = await obtener(`${URL_RECURSOS}/recursos`, token)
    for (const r of recursos) {
      operaciones.push(
        { index: { _index: INDICE, _id: `recurso-${r.codigo}` } },
        {
          tipo: 'recurso',
          entidadId: r.codigo,
          titulo: `${r.codigo} · ${r.nombre}`,
          subtitulo: `${r.tipo} · ${r.ubicacion}`,
          texto: r.estado || '',
          estado: r.estado,
          ownerId: null,
          asignadoA: null,
          ruta: '/app/recursos',
        },
      )
    }
  } catch (err) {
    console.error('[busqueda-service] backfill de recursos fallo:', err.message)
  }

  try {
    const usuarios = await obtener(`${URL_USUARIOS}/usuarios`, token)
    for (const u of usuarios) {
      operaciones.push(
        { index: { _index: INDICE, _id: `usuario-${u.id}` } },
        {
          tipo: 'usuario',
          entidadId: u.id,
          titulo: u.nombre,
          subtitulo: `${u.correo} · ${u.rol}`,
          texto: u.programa || '',
          estado: u.activo ? 'Activo' : 'Inactivo',
          ownerId: u.id,
          asignadoA: null,
          ruta: '/app/usuarios',
        },
      )
    }
  } catch (err) {
    console.error('[busqueda-service] backfill de usuarios fallo:', err.message)
  }

  if (operaciones.length) {
    await es.bulk({ operations: operaciones, refresh: true })
    console.log(`[busqueda-service] backfill inicial: ${operaciones.length / 2} documentos indexados.`)
  }
}
