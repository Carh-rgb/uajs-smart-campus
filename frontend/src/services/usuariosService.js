import { api } from '../api/client.js'

// Cliente HTTP del dominio de usuarios, autenticacion y permisos.
export const usuariosService = {
  listar: () => api.get('/usuarios'),
  responsables: () => api.get('/usuarios/responsables'),
  obtener: (id) => api.get(`/usuarios/${id}`),
  // Crear cuenta: solo el Administrador (POST /auth/register).
  crear: (datos) => api.post('/auth/register', datos),
  actualizar: (id, datos) => api.put(`/usuarios/${id}`, datos),
  alternarActivo: (id) => api.patch(`/usuarios/${id}/estado`),
  cambiarRol: (id, rol) => api.patch(`/usuarios/${id}/rol`, { rol }),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
}

export const authService = {
  login: (credenciales) => api.post('/auth/login', credenciales),
  perfil: () => api.get('/auth/me'),
  actualizarPerfil: (datos) => api.patch('/auth/perfil', datos),
  actualizarCorreoRecuperacion: (correoRecuperacion) => api.patch('/auth/correo-recuperacion', { correoRecuperacion }),
  solicitarReset: (correo) => api.post('/auth/forgot-password', { correo }),
  restablecerPassword: (token, nuevaPassword) => api.post('/auth/reset-password', { token, nuevaPassword }),
}

export const permisosService = {
  listar: () => api.get('/permisos'),
  alternarModulo: (rol, moduloId) => api.patch(`/permisos/${rol}`, { moduloId }),
}
