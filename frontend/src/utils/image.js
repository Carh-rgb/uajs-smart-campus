// Redimensiona y comprime una imagen en el navegador antes de enviarla
// como data URL (base64). Evita mandar fotos de varios MB al backend
// para algo que solo se muestra como avatar pequeño.
export function redimensionarImagen(file, maxLado = 256, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
        const ancho = Math.round(img.width * escala)
        const alto = Math.round(img.height * escala)

        const canvas = document.createElement('canvas')
        canvas.width = ancho
        canvas.height = alto
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, ancho, alto)

        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.src = lector.result
    }
    lector.readAsDataURL(file)
  })
}
