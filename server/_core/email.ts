import nodemailer from "nodemailer";
import { ENV } from "./env";

let _transporter: nodemailer.Transporter | null = null;

function getBrevoTransporter(): nodemailer.Transporter | null {
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoPass = process.env.BREVO_SMTP_PASS;
  if (!brevoUser || !brevoPass) return null;
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user: brevoUser, pass: brevoPass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) {
    return null;
  }
  _transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpSecure,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: { rejectUnauthorized: false },
  });
  console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort} (${ENV.smtpUser})`);
  return _transporter;
}

export function checkEmailConfig(): void {
  const hasBrevoSmtp = !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
  const hasBrevoApi = !!process.env.BREVO_API_KEY;
  const hasSmtp = !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);

  if (hasBrevoSmtp) console.log("[Email] Brevo SMTP configurado (primário)");
  if (hasBrevoApi) console.log("[Email] Brevo API configurado (fallback)");
  if (hasSmtp) console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort} (${ENV.smtpUser}) (fallback)`);
  if (!hasBrevoSmtp && !hasBrevoApi && !hasSmtp) {
    console.warn("[Email] AVISO: Nenhum serviço configurado. Os emails NÃO serão enviados.");
  }
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
              <tr><td style="padding:32px 40px;">${bodyHtml}</td></tr>
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

async function trySendSmtp(transporter: nodemailer.Transporter, fromEmail: string, to: string, toName: string | undefined, subject: string, html: string, label: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await Promise.race([
      transporter.sendMail({
        from: `"Portal SOCEM" <${fromEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout (20s)")), 20000)),
    ]);
    console.log(`[Email] Enviado via ${label} "${subject}" para ${to} (messageId: ${result.messageId})`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: `${label}: ${err?.message ?? err}` };
  }
}

export async function sendEmail(options: {
  to: string;
  toName?: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  timeoutSeconds?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? ENV.smtpFrom ?? ENV.smtpUser ?? "report@socem.pt";
  const html = buildHtml(options.heading, options.bodyHtml);

  // 1. Brevo SMTP relay (HTTPS-friendly, funciona no Railway)
  const brevoTransporter = getBrevoTransporter();
  if (brevoTransporter) {
    const r = await trySendSmtp(brevoTransporter, senderEmail, options.to, options.toName, options.subject, html, "Brevo SMTP");
    if (r.ok) return r;
    console.log(`[Email] Brevo SMTP falhou, a tentar Office 365...`);
  }

  // 2. Office 365 SMTP (fallback para dev local)
  const transporter = getTransporter();
  if (transporter) {
    const r = await trySendSmtp(transporter, senderEmail, options.to, options.toName, options.subject, html, "SMTP Office 365");
    if (r.ok) return r;
  }

  const hasBrevo = !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
  const hasSmtp = !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);

  if (!hasBrevo && !hasSmtp) {
    console.warn(`[Email] Nenhum serviço configurado — email NÃO enviado para ${options.to}`);
    return { ok: false, error: "Nenhum serviço de email configurado (BREVO_SMTP_USER+PASS ou SMTP)" };
  }

  console.error(`[Email] Todos os serviços falharam para ${options.to}`);
  return { ok: false, error: "Falha em todos os serviços de email" };
}
