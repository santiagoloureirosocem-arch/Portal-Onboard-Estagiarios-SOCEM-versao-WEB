const RESEND_API = "https://api.resend.com/emails";

function getApiKey(): string {
  return process.env.RESEND_API_KEY ?? "";
}

function getAppUrl(): string {
  return process.env.APP_URL
    ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined)
    ?? process.env.ORIGIN
    ?? "http://localhost:3000";
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
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    const msg = "RESEND_API_KEY not configured";
    console.warn(`[Email] ${msg}`);
    return { ok: false, error: msg };
  }

  try {
    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Portal SOCEM <onboarding@resend.dev>",
        to: options.to,
        subject: options.subject,
        html: buildHtml(options.heading, options.bodyHtml),
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "unknown error");
      const msg = `Resend error (${response.status}): ${error}`;
      console.warn(`[Email] ${msg}`);
      return { ok: false, error: msg };
    }

    const data = await response.json();
    console.log(`[Email] Sent "${options.subject}" to ${options.to} (id: ${data.id})`);
    return { ok: true };
  } catch (err) {
      const msg = `Error sending email: ${err}`;
    console.warn(`[Email] ${msg}`);
    return { ok: false, error: msg };
  }
}
