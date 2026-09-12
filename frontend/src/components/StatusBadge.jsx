import React from 'react'

const MAPA_TIPO = {
  Registrada: 'info',
  'En revisión': 'info',
  Asignada: 'warn',
  'En proceso': 'warn',
  Resuelta: 'ok',
  Cerrada: 'ok',
  Confirmada: 'ok',
  Pendiente: 'warn',
  Cancelada: 'bad',
  Disponible: 'ok',
  'En mantenimiento': 'warn',
  'Fuera de servicio': 'bad',
  Ocupado: 'bad',
  'En gestión': 'warn',
  Denegada: 'bad',
  Activo: 'ok',
  Inactivo: 'warn',
  Cancelado: 'bad',
}

export default function StatusBadge({ estado }) {
  const tipo = MAPA_TIPO[estado] || 'info'
  return <span className={`status-badge status-badge--${tipo}`}>{estado}</span>
}
