import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

export async function enviarCorreoReset(destinatario, nombre, enlace) {
  await transporter.sendMail({
    from: `"UAJS Smart Campus" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Restablece tu contraseña — UAJS Smart Campus',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color:#0b1f4d;">UAJS Smart Campus</h2>
        <p>Hola ${nombre},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para definir una nueva (el enlace vence en 1 hora):</p>
        <p>
          <a href="${enlace}" style="display:inline-block;background:#0b1f4d;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#666;font-size:13px;">Si no solicitaste este cambio, puedes ignorar este correo — tu contraseña seguirá siendo la misma.</p>
      </div>
    `,
  })
}
