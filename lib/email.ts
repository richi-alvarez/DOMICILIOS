import { Resend } from 'resend'

// Lazy: no falla en build; falla en runtime si no hay API key.
// Usamos || (no ??) para que un RESEND_API_KEY vacío también caiga al placeholder.
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
const FROM = process.env.RESEND_FROM_EMAIL ?? 'WaStore <noreply@wastore.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'WaStore'

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #E8E8E2;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(to right, #06B6D4, #0057FF);padding:24px 32px;display:flex;align-items:center;gap:12px;">
      <div style="width:36px;height:36px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;background:linear-gradient(to right, #06B6D4, #0057FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">W</div>
      <span style="color:#fff;font-size:20px;font-weight:700;">${APP_NAME}</span>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #E8E8E2;text-align:center;">
      <p style="margin:0;font-size:12px;color:#7C7C72;">
        Si no solicitaste este correo, puedes ignorarlo.
        <br/>© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/verify?token=${token}`
  const html = baseTemplate(
    'Verifica tu correo',
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0B1F3A;">Verifica tu correo</h1>
    <p style="margin:0 0 24px;color:#5C5C52;line-height:1.6;">Haz clic en el botón para activar tu cuenta en ${APP_NAME}. El enlace expira en 24 horas.</p>
    <a href="${url}" style="display:inline-block;background:linear-gradient(to right, #06B6D4, #0057FF);color:#fff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Verificar mi correo</a>
    <p style="margin:20px 0 0;font-size:13px;color:#A8A89E;">O copia este enlace en tu navegador:<br/><span style="color:#0057FF;word-break:break-all;">${url}</span></p>`,
  )
  return resend.emails.send({ from: FROM, to: email, subject: `Verifica tu correo en ${APP_NAME}`, html })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/password-reset?token=${token}`
  const html = baseTemplate(
    'Recupera tu contraseña',
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0B1F3A;">Recupera tu contraseña</h1>
    <p style="margin:0 0 24px;color:#5C5C52;line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace expira en 1 hora.</p>
    <a href="${url}" style="display:inline-block;background:#FF6B57;color:#fff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Restablecer contraseña</a>
    <p style="margin:20px 0 0;font-size:13px;color:#A8A89E;">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>`,
  )
  return resend.emails.send({ from: FROM, to: email, subject: `Recupera tu contraseña en ${APP_NAME}`, html })
}

export async function sendInviteEmail(email: string, token: string, orgName: string, role: string) {
  const url = `${APP_URL}/invite/${token}`
  const roleLabel: Record<string, string> = { admin: 'Administrador', editor: 'Editor', viewer: 'Visualizador' }
  const html = baseTemplate(
    `Invitación a ${orgName}`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0B1F3A;">Te invitaron a ${orgName}</h1>
    <p style="margin:0 0 8px;color:#5C5C52;line-height:1.6;">Has sido invitado a unirte al equipo de <strong>${orgName}</strong> en ${APP_NAME} con el rol de <strong>${roleLabel[role] ?? role}</strong>.</p>
    <p style="margin:0 0 24px;color:#5C5C52;line-height:1.6;">Esta invitación expira en <strong>7 días</strong>.</p>
    <a href="${url}" style="display:inline-block;background:#FF6B57;color:#fff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Aceptar invitación</a>
    <p style="margin:20px 0 0;font-size:13px;color:#A8A89E;">O copia este enlace:<br/><span style="color:#FF6B57;word-break:break-all;">${url}</span></p>`,
  )
  return resend.emails.send({ from: FROM, to: email, subject: `Te invitaron a ${orgName} en ${APP_NAME}`, html })
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = baseTemplate(
    `Bienvenido a ${APP_NAME}`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0B1F3A;">¡Hola, ${name}! 👋</h1>
    <p style="margin:0 0 24px;color:#5C5C52;line-height:1.6;">Tu cuenta en ${APP_NAME} está lista. Ya puedes crear tu primer catálogo digital y empezar a recibir pedidos por WhatsApp.</p>
    <a href="${APP_URL}/app" style="display:inline-block;background:#FF6B57;color:#fff;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;font-size:15px;">Ir a mi panel →</a>
    <p style="margin:20px 0 0;font-size:13px;color:#A8A89E;">¿Tienes dudas? Escríbenos a <a href="mailto:hola@wastore.app" style="color:#0057FF;">hola@wastore.app</a></p>`,
  )
  return resend.emails.send({ from: FROM, to: email, subject: `Bienvenido a ${APP_NAME} 🎉`, html })
}

export async function sendReportEmail(
  email: string,
  reportName: string,
  format: 'csv' | 'xlsx' | 'pdf',
  fileBuffer: Buffer,
  fileName: string
) {
  const html = baseTemplate(
    'Tu reporte está listo',
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0B1F3A;">Tu reporte está listo</h1>
    <p style="margin:0 0 24px;color:#5C5C52;line-height:1.6;">El reporte <strong>"${reportName}"</strong> se encuentra en el archivo adjunto en formato ${format.toUpperCase()}.</p>
    <p style="margin:0 0 24px;color:#5C5C52;line-height:1.6;">Puedes descargarlo directamente desde tu correo o acceder a él en tu panel de ${APP_NAME}.</p>
    <p style="margin:20px 0 0;font-size:13px;color:#A8A89E;">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>`,
  )
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Tu reporte "${reportName}" está listo`,
    html,
    attachments: [
      {
        content: fileBuffer.toString('base64'),
        filename: fileName,
      },
    ],
  })
}
