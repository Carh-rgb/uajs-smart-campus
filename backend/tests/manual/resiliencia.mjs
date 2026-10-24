// Prueba MANUAL de resiliencia (T12 persistencia tras reinicio y T14 error de conexion).
// Detiene y reinicia procesos reales, por eso no forma parte de 'npm test'.
// Requiere Windows (usa Get-NetTCPConnection/taskkill) y 'npm run dev' corriendo.
// Uso (desde backend/):  node tests/manual/resiliencia.mjs
import { execSync } from 'node:child_process'
import fs from 'node:fs'
const BASE = 'http://localhost:4000/api'
const j = async (m, p, t, b) => { const r = await fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t && { Authorization: 'Bearer ' + t }) }, body: b && JSON.stringify(b) }); const x = await r.text(); let d; try { d = JSON.parse(x) } catch { d = x } return { s: r.status, d } }
const login = async (c) => (await j('POST', '/auth/login', null, { correo: c, password: 'uajs2026' })).d.token
const pidEn = (puerto) => execSync(`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${puerto} -State Listen).OwningProcess"`).toString().trim()
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const est = await login('camilo.ramirez@uajs.edu.co'), adm = await login('andres.gomez@uajs.edu.co')

console.log('=== T12: persistencia tras reiniciar recursos-service ===')
const creado = await j('POST', '/recursos', adm, { nombre: 'Recurso persistencia T12', tipo: 'Mobiliario', ubicacion: 'Bodega T12' })
console.log('crear ->', creado.s, creado.d.codigo)
fs.utimesSync('services/recursos-service/src/server.js', new Date(), new Date()) // nodemon reinicia el servicio
await esperar(7000)
const tras = await j('GET', `/recursos/${creado.d.codigo}`, est)
console.log('consultar tras reinicio ->', tras.s, tras.d.nombre, '|', tras.d.ubicacion)
await j('DELETE', `/recursos/${creado.d.codigo}`, adm)

console.log('\n=== T14: error de conexion (usuarios-service detenido) ===')
const pid = pidEn(4001)
console.log('deteniendo usuarios-service, PID', pid)
execSync(`taskkill /PID ${pid} /F`)
await esperar(1500)
const health = await j('GET', '/../health')
console.log('gateway /health ->', health.s, health.d.status ?? '(raw)')
const lista = await j('GET', '/usuarios', adm)
console.log('GET /api/usuarios (servicio caido) ->', lista.s, JSON.stringify(lista.d))
const antes = (await j('GET', '/reservas', adm)).d.length
const reserva = await j('POST', '/reservas', est, { tipoEspacio: 'espacio', espacio: 'Sala S01', fecha: '2035-03-03', horaInicio: '08:00', horaFin: '09:00', motivo: 'T14 sin usuarios-service' })
console.log('POST /api/reservas (no se puede verificar al usuario) ->', reserva.s, JSON.stringify(reserva.d))
const despues = (await j('GET', '/reservas', adm)).d.length
console.log('reservas antes/despues:', antes, '/', despues, despues === antes ? '(no se creo nada inconsistente)' : '(!!)')
const otros = await j('GET', '/recursos', est)
console.log('otro servicio (recursos) sigue respondiendo ->', otros.s)

console.log('\nreiniciando usuarios-service...')
fs.utimesSync('services/usuarios-service/src/server.js', new Date(), new Date())
await esperar(8000)
const ok = await j('POST', '/auth/login', null, { correo: 'camilo.ramirez@uajs.edu.co', password: 'uajs2026' })
console.log('login tras recuperar el servicio ->', ok.s)
