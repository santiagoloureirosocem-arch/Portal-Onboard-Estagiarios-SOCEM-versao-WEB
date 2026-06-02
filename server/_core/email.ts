export function checkEmailConfig(): void {
  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL;
  if (apiKey && senderEmail) {
    console.log(`[Email] SendGrid configurado (${senderEmail})`);
  } else {
    console.warn("[Email] AVISO: SendGrid não configurado. Os emails NÃO serão enviados.");
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

export async function sendEmail(options: {
  to: string;
  toName?: string;
  subject: string;
  heading: string;
  bodyHtml: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn(`[Email] SendGrid não configurado — email NÃO enviado para ${options.to}`);
    return { ok: false, error: "SendGrid não configurado (SENDGRID_API_KEY + SENDGRID_SENDER_EMAIL)" };
  }

  const html = buildHtml(options.heading, options.bodyHtml);

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to, name: options.toName || undefined }],
        }],
        from: { email: senderEmail, name: "Portal SOCEM" },
        subject: options.subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (res.status === 202) {
      console.log(`[Email] Enviado via SendGrid "${options.subject}" para ${options.to}`);
      return { ok: true };
    }

    const body = await res.text().catch(() => "");
    console.error(`[Email] Erro SendGrid (${res.status}): ${body.slice(0, 300)}`);
    return { ok: false, error: `SendGrid: ${res.status}` };
  } catch (err: any) {
    console.error(`[Email] Erro SendGrid: ${err?.message ?? err}`);
    return { ok: false, error: `SendGrid: ${err?.message ?? err}` };
  }
}
