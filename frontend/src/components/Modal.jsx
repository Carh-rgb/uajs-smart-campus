import React from 'react'

export default function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h3>{title}</h3>
          <button className="modal-panel__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
      </div>
    </div>
  )
}
