import { Express } from "express";
import { Resend } from "resend";

export function registerEmailColaboradorRoute(app: Express) {
  app.post("/api/email/novo-colaborador", async (req, res) => {
    const {
      nome,
      numColaborador,
      empresa,
      departamento,
      permissoes,
      responsavel,
      temComputador,
      temOffice,
      programas,
    } = req.body;

    if (!nome || !numColaborador || !empresa || !departamento) {
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const programasLista =
      Array.isArray(programas) && programas.length > 0
        ? programas.join(", ")
        : "Nenhum";

   const htmlBody = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; font-family: 'Segoe UI', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4; padding: 48px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px; width:100%;">

          <!-- TOP BAR -->
          <tr>
            <td style="background:#8b0000; border-radius: 12px 12px 0 0; padding: 6px 40px; text-align:right;">
              <p style="margin:0; font-size:11px; color:rgba(255,255,255,0.6); letter-spacing:1px;">
                ${new Date().toLocaleDateString("pt-PT", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} &nbsp;·&nbsp; ${new Date().toLocaleTimeString("pt-PT", { hour:"2-digit", minute:"2-digit" })}
              </p>
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(160deg, #c0392b 0%, #7b241c 100%); padding: 44px 40px 36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px 0; font-size:10px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:rgba(255,255,255,0.55);">Portal SOCEM — Recursos Humanos</p>
                    <h1 style="margin:0 0 10px 0; font-size:28px; font-weight:800; color:#ffffff; line-height:1.2;">Novo Colaborador<br>Registado</h1>
                    <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.75); line-height:1.6;">Foi submetido um novo registo através do Portal SOCEM.<br>Por favor reveja a informação abaixo e tome as ações necessárias.</p>
                  </td>
                  <td align="right" valign="top" style="padding-left:20px;">
                    <div style="width:64px; height:64px; background:rgba(255,255,255,0.15); border-radius:50%; text-align:center; line-height:64px; font-size:28px;">👤</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- NOME DESTAQUE -->
          <tr>
            <td style="background:#ffffff; padding: 0 40px;">
              <div style="margin: 28px 0 0 0; background: linear-gradient(135deg, #fdf2f2, #fff5f5); border: 1px solid #f5c6c6; border-radius: 10px; padding: 20px 24px; display:flex; align-items:center;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 3px 0; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#c0392b;">Colaborador</p>
                      <p style="margin:0; font-size:22px; font-weight:800; color:#1a1a1a;">${nome}</p>
                    </td>
                    <td align="right">
                      <span style="background:#c0392b; color:white; padding: 6px 14px; border-radius: 20px; font-size:13px; font-weight:700; white-space:nowrap;">Nº ${numColaborador}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- SECÇÃO: ORGANIZAÇÃO -->
          <tr>
            <td style="background:#ffffff; padding: 28px 40px 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#c0392b; width:3px; border-radius:3px;">&nbsp;</td>
                        <td style="padding-left:10px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#c0392b;">Organização</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ececec; border-radius:10px; overflow:hidden;">
                <tr style="background:#fafafa;">
                  <td style="padding:11px 16px; font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:1px; width:42%; border-bottom:1px solid #ececec;">Campo</td>
                  <td style="padding:11px 16px; font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #ececec;">Valor</td>
                </tr>
                <tr>
                  <td style="padding:13px 16px; font-size:13px; color:#777; border-bottom:1px solid #f5f5f5;">🏢 Empresa</td>
                  <td style="padding:13px 16px; font-size:13px; font-weight:600; color:#1a1a1a; border-bottom:1px solid #f5f5f5;">${empresa}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:13px 16px; font-size:13px; color:#777; border-bottom:1px solid #f5f5f5;">📂 Departamento</td>
                  <td style="padding:13px 16px; font-size:13px; font-weight:600; color:#1a1a1a; border-bottom:1px solid #f5f5f5;">${departamento}</td>
                </tr>
                <tr>
                  <td style="padding:13px 16px; font-size:13px; color:#777; border-bottom:1px solid #f5f5f5;">👤 Responsável</td>
                  <td style="padding:13px 16px; font-size:13px; font-weight:600; color:#1a1a1a; border-bottom:1px solid #f5f5f5;">${responsavel}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:13px 16px; font-size:13px; color:#777;">🔑 Permissões</td>
                  <td style="padding:13px 16px; font-size:13px; font-weight:600; color:#1a1a1a;">
                    <span style="background:#eaf4fb; color:#1a5276; padding:3px 10px; border-radius:20px; font-size:12px;">${permissoes}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECÇÃO: EQUIPAMENTO -->
          <tr>
            <td style="background:#ffffff; padding: 28px 40px 36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#c0392b; width:3px; border-radius:3px;">&nbsp;</td>
                        <td style="padding-left:10px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#c0392b;">Equipamento & Acessos</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ececec; border-radius:10px; overflow:hidden;">
                <tr style="background:#fafafa;">
                  <td style="padding:11px 16px; font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:1px; width:42%; border-bottom:1px solid #ececec;">Campo</td>
                  <td style="padding:11px 16px; font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #ececec;">Estado</td>
                </tr>
                <tr>
                  <td style="padding:13px 16px; font-size:13px; color:#777; ${temComputador ? "border-bottom:1px solid #f5f5f5;" : ""}">💻 Precisa de computador</td>
                  <td style="padding:13px 16px; ${temComputador ? "border-bottom:1px solid #f5f5f5;" : ""}">
                    <span style="background:${temComputador ? "#d4edda" : "#f8d7da"}; color:${temComputador ? "#155724" : "#721c24"}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">
                      ${temComputador ? "✔ Sim" : "✘ Não"}
                    </span>
                  </td>
                </tr>
                ${temComputador ? `
                <tr style="background:#fafafa;">
                  <td style="padding:13px 16px; font-size:13px; color:#777; border-bottom:1px solid #f5f5f5;">📦 Microsoft Office</td>
                  <td style="padding:13px 16px; border-bottom:1px solid #f5f5f5;">
                    <span style="background:${temOffice ? "#d4edda" : "#f8d7da"}; color:${temOffice ? "#155724" : "#721c24"}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">
                      ${temOffice ? "✔ Sim" : "✘ Não"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:13px 16px; font-size:13px; color:#777;">🛠️ Programas adicionais</td>
                  <td style="padding:13px 16px; font-size:13px; font-weight:600; color:#1a1a1a;">${programasLista}</td>
                </tr>
                ` : ""}
              </table>
            </td>
          </tr>

          <!-- AVISO ACÇÃO -->
          <tr>
            <td style="background:#fffbf0; border-top:1px solid #fde8a0; border-bottom:1px solid #fde8a0; padding:16px 40px;">
              <p style="margin:0; font-size:13px; color:#7d5a00;">
                ⚠️ <strong>Ação necessária:</strong> Por favor configure os acessos e equipamentos necessários para este colaborador.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1e1e1e; border-radius:0 0 12px 12px; padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px 0; font-size:14px; font-weight:700; color:#ffffff;">SOCEM</p>
                    <p style="margin:0; font-size:12px; color:#666;">Portal de Onboarding — Mensagem automática</p>
                  </td>
                  <td align="right">
                    <p style="margin:0; font-size:11px; color:#555;">Não responda a este email</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

    try {
      await resend.emails.send({
        from: "Portal SOCEM <onboarding@resend.dev>",
        to: "santiago.loureiro.socem@gmail.com",
        subject: `Novo Colaborador: ${nome}`,
        html: htmlBody,
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Erro ao enviar email:", err);
      return res.status(500).json({ error: "Erro ao enviar email" });
    }
  });
}
