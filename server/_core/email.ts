import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.log("[Email] SMTP nao configurado");
    return null;
  }
  _transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: false },
  });
  console.log(`[Email] SMTP configurado: ${host} (${user})`);
  return _transporter;
}

export function checkEmailConfig(): void {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log(`[Email] SMTP configurado: ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
  } else {
    console.warn("[Email] AVISO: SMTP nao configurado");
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
        <tr><td style="text-align:center;padding:0 0 24px 0;"><img src="https://i.imgur.com/Gr0GFS1.png" alt="SOCEM" width="42" height="42" style="border-radius:10px;"></td></tr>
        <tr><td style="background:#fff;border-radius:14px;padding:0;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:linear-gradient(135deg,#c0392b 0%,#962d22 100%);padding:36px 40px;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">${heading}</h1></td></tr>
            <tr><td style="padding:32px 40px;">${bodyHtml}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 0 0 0;text-align:center;"><p style="margin:0;font-size:12px;color:#999;">SOCEM — Portal de Onboarding</p><p style="margin:0;font-size:11px;color:#bbb;">Email automatico.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(opts: {
  to: string; toName?: string; subject: string; heading: string; bodyHtml: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, error: "SMTP nao configurado" };
  const from = `${process.env.SMTP_FROM || process.env.SMTP_USER}`;
  const html = buildHtml(opts.heading, opts.bodyHtml);
  for (let a = 1; a <= 2; a++) {
    try {
      const r = await Promise.race([
        transporter.sendMail({ from: `"Portal SOCEM" <${from}>`, to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to, subject: opts.subject, html }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Timeout (15s)")), 15000)),
      ]);
      console.log(`[Email] Enviado "${opts.subject}" para ${opts.to} (${r.messageId})`);
      return { ok: true };
    } catch (e: any) {
      const m = String(e?.message ?? e);
      console.error(`[Email] T${a}/2: ${m}`);
      if (!["Timeout", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ESOCKET"].some(t => m.includes(t)) || a >= 2) return { ok: false, error: m };
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return { ok: false, error: "Falhou" };
}
