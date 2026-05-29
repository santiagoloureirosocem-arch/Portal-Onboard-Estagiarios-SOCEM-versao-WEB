const RESEND_API = "https://api.resend.com/emails";

function getApiKey(): string {
  return process.env.RESEND_API_KEY ?? "";
}

function getAppUrl(): string {
  return process.env.APP_URL ?? process.env.ORIGIN ?? "http://localhost:3000";
}

function buildHtml(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#eef0f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4;padding:48px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr>
          <td style="background:linear-gradient(160deg,#c0392b 0%,#7b241c 100%);border-radius:12px 12px 0 0;padding:36px 40px;">
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">${heading}</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px 40px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background:#1e1e1e;border-radius:0 0 12px 12px;padding:20px 40px;">
            <p style="margin:0;font-size:12px;color:#666;">SOCEM — Portal de Onboarding<br>Mensagem automática, não responda a este email.</p>
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
}): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return false;
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
      const error = await response.text().catch(() => "");
      console.warn(`[Email] Resend error (${response.status}): ${error}`);
      return false;
    }

    const data = await response.json();
    console.log(`[Email] Sent "${options.subject}" to ${options.to} (id: ${data.id})`);
    return true;
  } catch (err) {
    console.warn("[Email] Error sending email:", err);
    return false;
  }
}
