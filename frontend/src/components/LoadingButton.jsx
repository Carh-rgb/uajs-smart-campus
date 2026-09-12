import React from 'react'
import { ButtonSpinner } from './BrandSpinner.jsx'

/**
 * Boton estandar que se pone en estado "cargando" mientras una accion
 * asincrona esta en curso: se deshabilita y muestra el ButtonSpinner de
 * marca junto al texto (personalizable con loadingText).
 */
export default function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      {...props}
      className={`${className} ${loading ? 'btn--loading' : ''}`.trim()}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading && <ButtonSpinner />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  )
}
