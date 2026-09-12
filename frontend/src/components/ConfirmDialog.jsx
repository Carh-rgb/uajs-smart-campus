import React from 'react'
import LoadingButton from './LoadingButton.jsx'

export default function ConfirmDialog({
  title,
  text,
  onConfirm,
  onCancel,
  confirmLabel = 'Sí',
  cancelLabel = 'No',
  loading = false,
}) {
  return (
    <div className="modal-overlay" onClick={loading ? undefined : onCancel}>
      <div className="modal-panel" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel__header">
          <h3>{title}</h3>
        </div>
        <div className="modal-panel__body">
          <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            {text}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <LoadingButton
              className="btn btn--primary"
              style={{ width: 'auto', flex: 1 }}
              onClick={onConfirm}
              loading={loading}
              loadingText="Confirmando..."
            >
              {confirmLabel}
            </LoadingButton>
            <button
              className="btn"
              style={{ width: 'auto', flex: 1, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
