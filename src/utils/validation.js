export const DOMINIO_INSTITUCIONAL = '@uajs.edu.co'

export function esCorreoInstitucional(correo) {
  return /^[^\s@]+@uajs\.edu\.co$/i.test((correo || '').trim())
}
