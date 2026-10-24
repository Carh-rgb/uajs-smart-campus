// Crea el `.env` de cada componente a partir de su `.env.example` cuando
// todavia no existe (nunca sobrescribe uno existente). Uso: npm run setup:env
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const carpetas = [
  'gateway',
  ...fs.readdirSync(path.join(raiz, 'services')).map((s) => path.join('services', s)),
  path.join('..', 'frontend'),
]

let creados = 0
for (const carpeta of carpetas) {
  const ejemplo = path.join(raiz, carpeta, '.env.example')
  const destino = path.join(raiz, carpeta, '.env')
  if (!fs.existsSync(ejemplo)) continue
  if (fs.existsSync(destino)) {
    console.log(`= ${path.normalize(carpeta)}/.env ya existe (no se toca)`)
    continue
  }
  fs.copyFileSync(ejemplo, destino)
  console.log(`+ ${path.normalize(carpeta)}/.env creado desde .env.example`)
  creados++
}
console.log(creados ? `\n${creados} archivo(s) .env creados.` : '\nNada que crear: todos los .env ya existen.')
