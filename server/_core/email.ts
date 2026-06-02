import nodemailer from "nodemailer";
import { ENV } from "./env";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    return null;
  }
  _transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpSecure,
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  });
  console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort} (${ENV.smtpUser})`);
  return _transporter;
}

export function checkEmailConfig(): void {
  const hasSmtp = !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);

  if (!hasSmtp) {
    console.warn("╔═══════════════════════════════════════════════════╗");
    console.warn("║  [Email] AVISO: SMTP não configurado               ║");
    console.warn("║  Configure SMTP_HOST + SMTP_USER + SMTP_PASS       ║");
    console.warn("║  Os emails NÃO serão enviados!                     ║");
    console.warn("╚═══════════════════════════════════════════════════╝");
    return;
  }

  console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort} (${ENV.smtpUser})`);
}

function buildHtml(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="text-align:center;padding:0 0 24px 0;">
            <img src="https://i.imgur.com/Gr0GFS1.png" alt="SOCEM" width="42" height="42" style="border-radius:10px;">
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-radius:14px;padding:0;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#c0392b 0%,#962d22 100%);padding:36px 40px;">
                  <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px 40px;">
                  ${bodyHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 0 0 0;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#999;line-height:1.5;">SOCEM — Portal de Onboarding</p>
            <p style="margin:0;font-size:11px;color:#bbb;">Este é um email automático, por favor não responda.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(options: {
  to: string;
  toName?: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  timeoutSeconds?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const fromEmail = ENV.smtpFrom ?? ENV.smtpUser ?? "report@socem.pt";
  const html = buildHtml(options.heading, options.bodyHtml);
  const timeoutMs = (options.timeoutSeconds ?? 15) * 1000;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Email] SMTP não configurado — email NÃO enviado para ${options.to}`);
    return { ok: false, error: "SMTP não configurado (SMTP_HOST, SMTP_USER, SMTP_PASS)" };
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await Promise.race([
        transporter.sendMail({
          from: `"Portal SOCEM" <${fromEmail}>`,
          to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
          subject: options.subject,
          html,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout (${options.timeoutSeconds ?? 15}s)`)), timeoutMs)
        ),
      ]);
      console.log(`[Email] Enviado via SMTP "${options.subject}" para ${options.to} (messageId: ${result.messageId})`);
      return { ok: true };
    } catch (err: any) {
      const msg = `Erro SMTP: ${err?.message ?? err}`;
      console.error(`[Email] Tentativa ${attempt}/2: ${msg}`);

      const isTransient =
        msg.includes("Timeout") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ESOCKET");

      if (!isTransient || attempt >= 2) {
        return { ok: false, error: msg };
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { ok: false, error: "Todas as tentativas falharam" };
}
