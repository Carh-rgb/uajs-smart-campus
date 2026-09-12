import React from 'react'

export default function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
    </div>
  )
}
