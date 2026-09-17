/**
 * Smoke test del Gateway y los 7 microservicios.
 *
 * Golpea /health del gateway (que a su vez chequea a cada microservicio) y
 * ademas cada microservicio directo, para poder distinguir dos casos
 * distintos:
 *   - El microservicio esta caido de verdad.
 *   - El microservicio esta vivo pero el gateway no lo esta enrutando bien.
 *
 * Uso (con el backend corriendo en otra terminal):
 *   node scripts/smoke-test.js
 *
 * Sale con codigo 0 si todo esta bien, o 1 si algo fallo (util para usarlo
 * luego en un pipeline de CI).
 */
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000'

const MICROSERVICIOS = [
  { nombre: 'usuarios', url: process.env.USUARIOS_SERVICE_URL || 'http://localhost:4001' },
  { nombre: 'solicitudes', url: process.env.SOLICITUDES_SERVICE_URL || 'http://localhost:4002' },
  { nombre: 'reservas', url: process.env.RESERVAS_SERVICE_URL || 'http://localhost:4003' },
  { nombre: 'recursos', url: process.env.RECURSOS_SERVICE_URL || 'http://localhost:4004' },
  { nombre: 'eventos', url: process.env.EVENTOS_SERVICE_URL || 'http://localhost:4005' },
  { nombre: 'notificaciones', url: process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:4006' },
  { nombre: 'busqueda', url: process.env.BUSQUEDA_SERVICE_URL || 'http://localhost:4007' },
]

const TIMEOUT_MS = 3000

async function probar(nombre, url) {
  const inicio = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const respuesta = await fetch(url, { signal: controller.signal })
    const ms = Date.now() - inicio
    return { nombre, ok: respuesta.ok, status: respuesta.status, ms }
  } catch (err) {
    return { nombre, ok: false, error: err.message, ms: Date.now() - inicio }
  } finally {
    clearTimeout(timeout)
  }
}

function imprimir({ nombre, ok, status, ms, error }) {
  const icono = ok ? '✅' : '❌'
  const detalle = ok ? `${status} en ${ms}ms` : `${error} (${ms}ms)`
  console.log(`${icono} ${nombre.padEnd(16)} ${detalle}`)
}

async function main() {
  console.log(`\nSmoke test — Gateway: ${GATEWAY_URL}\n`)

  console.log('Microservicios (directo, sin pasar por el gateway):')
  const resultadosDirectos = await Promise.all(
    MICROSERVICIOS.map(({ nombre, url }) => probar(nombre, `${url}/health`)),
  )
  resultadosDirectos.forEach(imprimir)

  console.log('\nGateway:')
  const resultadoGateway = await probar('gateway /health', `${GATEWAY_URL}/health`)
  imprimir(resultadoGateway)

  const todoOk = resultadosDirectos.every((r) => r.ok) && resultadoGateway.ok
  console.log(todoOk ? '\nTodo respondiendo correctamente.\n' : '\nAlgo esta fallando, revisa arriba.\n')
  process.exit(todoOk ? 0 : 1)
}

main()
