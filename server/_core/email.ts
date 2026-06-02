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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: { rejectUnauthorized: false },
  });
  console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort} (${ENV.smtpUser})`);
  return _transporter;
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export function checkEmailConfig(): void {
  const brevoKey = process.env.BREVO_API_KEY;
  const hasSmtp = !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);

  if (brevoKey) {
    console.log(`[Email] Brevo configurado (primário)`);
  }
  if (hasSmtp) {
    console.log(`[Email] SMTP configurado: ${ENV.smtpHost}:${ENV.smtpPort} (${ENV.smtpUser}) (fallback)`);
  }
  if (!brevoKey && !hasSmtp) {
    console.warn("[Email] AVISO: Brevo e SMTP não configurados. Os emails NÃO serão enviados.");
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

async function sendViaBrevo(fromEmail: string, to: string, toName: string | undefined, subject: string, html: string, timeoutMs: number): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const body = {
      sender: { name: "Portal SOCEM", email: fromEmail },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html,
    };

    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const resBody = await res.text().catch(() => "");
    console.log(`[Email] Brevo resposta ${res.status}: ${resBody.slice(0, 300)}`);

    if (!res.ok) {
      console.error(`[Email] Erro Brevo (${res.status}): ${resBody}`);
      return { ok: false, error: `Brevo: ${res.status} - ${resBody.slice(0, 200)}` };
    }

    const data = JSON.parse(resBody) as any;
    console.log(`[Email] Enviado via Brevo "${subject}" para ${to} (messageId: ${data?.messageId})`);
    return { ok: true };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { ok: false, error: `Brevo: timeout (${timeoutMs / 1000}s)` };
    }
    return { ok: false, error: `Brevo: ${err?.message ?? err}` };
  }
}

async function sendViaSmtp(fromEmail: string, to: string, toName: string | undefined, subject: string, html: string, timeoutMs: number): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false };

  try {
    const result = await Promise.race([
      transporter.sendMail({
        from: `"Portal SOCEM" <${fromEmail}>`,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        html,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout (${timeoutMs / 1000}s)`)), timeoutMs)
      ),
    ]);
    console.log(`[Email] Enviado via SMTP "${subject}" para ${to} (messageId: ${result.messageId})`);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: `SMTP: ${err?.message ?? err}` };
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
  const fromEmail = ENV.smtpFrom ?? ENV.smtpUser ?? process.env.BREVO_SENDER_EMAIL ?? "report@socem.pt";
  const html = buildHtml(options.heading, options.bodyHtml);
  const timeoutMs = (options.timeoutSeconds ?? 15) * 1000;

  // 1. Brevo (HTTPS, funciona no Railway)
  const brevoResult = await sendViaBrevo(fromEmail, options.to, options.toName, options.subject, html, timeoutMs);
  if (brevoResult.ok) return brevoResult;
  if (brevoResult.error && !brevoResult.error.includes("timeout")) {
    console.log(`[Email] Brevo falhou, a tentar SMTP...`);
  }

  // 2. SMTP (fallback para dev local)
  const smtpResult = await sendViaSmtp(fromEmail, options.to, options.toName, options.subject, html, timeoutMs);
  if (smtpResult.ok) return smtpResult;

  const hadBrevo = !!process.env.BREVO_API_KEY;
  const hadSmtp = !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);

  if (!hadBrevo && !hadSmtp) {
    console.warn(`[Email] Nenhum serviço configurado — email NÃO enviado para ${options.to}`);
    return { ok: false, error: "Nenhum serviço de email configurado (BREVO_API_KEY ou SMTP)" };
  }

  console.error(`[Email] Todos os serviços falharam para ${options.to}`);
  return { ok: false, error: `Falhou: ${brevoResult.error ?? "Brevo não configurado"} | ${smtpResult.error ?? "SMTP não configurado"}` };
}
