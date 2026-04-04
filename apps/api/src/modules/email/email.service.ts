import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendPasswordResetCode(to: string, name: string, code: string, tenantName: string) {
    try {
      await this.resend.emails.send({
        from: 'DaxCloud <noreply@jacana-dev.com>',
        to,
        subject: `Tu código de verificación — DaxCloud`,
        html: this.buildResetEmail(name, code, tenantName),
      });
      this.logger.log(`Reset code sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  private buildResetEmail(name: string, code: string, tenantName: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Código de verificación</title>
</head>
<body style="margin:0;padding:0;background:#0F0F0F;font-family:'Outfit',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F0F;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Dax</span><span style="font-size:28px;font-weight:300;color:#FF5C35;letter-spacing:-0.5px;">cloud</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#161616;border:1px solid #2A2A2A;border-radius:16px;padding:40px;">

              <p style="font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#FF5C35;margin:0 0 12px;">Recuperación de contraseña</p>
              <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0 0 16px;line-height:1.3;">
                Hola, ${name} 👋
              </h1>
              <p style="font-size:15px;color:#888;line-height:1.7;margin:0 0 32px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color:#fff;">${tenantName}</strong>. Usa el siguiente código para continuar:
              </p>

              <!-- Code -->
              <div style="background:#0F0F0F;border:2px solid #FF5C35;border-radius:12px;padding:28px;text-align:center;margin:0 0 32px;">
                <p style="font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#555;margin:0 0 12px;">Tu código de verificación</p>
                <p style="font-size:48px;font-weight:700;color:#FF5C35;letter-spacing:16px;margin:0;font-family:monospace;">${code}</p>
                <p style="font-size:12px;color:#555;margin:12px 0 0;">Válido por <strong style="color:#888;">15 minutos</strong></p>
              </div>

              <div style="background:#1A1A1A;border-radius:8px;padding:16px;margin:0 0 24px;">
                <p style="font-size:13px;color:#666;line-height:1.6;margin:0;">
                  ⚠️ Si no solicitaste este código, ignora este correo. Tu contraseña permanecerá sin cambios. Por tu seguridad, nunca compartas este código con nadie.
                </p>
              </div>

              <p style="font-size:13px;color:#555;margin:0;">
                Este código expira automáticamente a los 15 minutos. Si necesitas uno nuevo, regresa a la pantalla de recuperación de contraseña.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="font-size:12px;color:#444;margin:0;">
                © 2026 DaxCloud · by jacana-dev.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}