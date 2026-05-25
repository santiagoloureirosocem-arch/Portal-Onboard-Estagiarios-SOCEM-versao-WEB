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
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family: 'Segoe UI', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #c0392b 0%, #922b21 100%); border-radius: 12px 12px 0 0; padding: 36px 40px; text-align: center;">
              <p style="margin:0 0 8px 0; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.7);">Portal SOCEM</p>
              <h1 style="margin:0; font-size: 26px; font-weight: 700; color: #ffffff;">Novo Colaborador Registado</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">Informação submetida automaticamente pelo sistema</p>
            </td>
          </tr>

          <!-- BADGE DATA/HORA -->
          <tr>
            <td style="background-color:#ffffff; padding: 0 40px;">
              <div style="border-left: 4px solid #c0392b; background: #fdf2f2; padding: 12px 16px; margin: 24px 0 0 0; border-radius: 0 6px 6px 0;">
                <p style="margin:0; font-size: 13px; color: #922b21;">
                  <strong>📅 Data de registo:</strong> ${new Date().toLocaleDateString("pt-PT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </td>
          </tr>

          <!-- SECÇÃO: IDENTIFICAÇÃO -->
          <tr>
            <td style="background-color:#ffffff; padding: 24px 40px 0 40px;">
              <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c0392b;">Identificação</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
                <tr style="background:#fafafa;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; width: 45%; border-bottom: 1px solid #e8e8e8;">Campo</td>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e8e8e8;">Valor</td>
                </tr>
                <tr>
                  <td style="padding: 13px 16px; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Nome completo</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #f0f0f0;">${nome}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding: 13px 16px; font-size: 13px; color: #666;">Nº Colaborador</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a;">
                    <span style="background:#c0392b; color:white; padding: 2px 10px; border-radius: 20px; font-size: 12px;">${numColaborador}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECÇÃO: ORGANIZAÇÃO -->
          <tr>
            <td style="background-color:#ffffff; padding: 24px 40px 0 40px;">
              <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c0392b;">Organização</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
                <tr style="background:#fafafa;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; width: 45%; border-bottom: 1px solid #e8e8e8;">Campo</td>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e8e8e8;">Valor</td>
                </tr>
                <tr>
                  <td style="padding: 13px 16px; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Empresa</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #f0f0f0;">${empresa}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding: 13px 16px; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Departamento</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #f0f0f0;">${departamento}</td>
                </tr>
                <tr>
                  <td style="padding: 13px 16px; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Responsável</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a; border-bottom: 1px solid #f0f0f0;">${responsavel}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding: 13px 16px; font-size: 13px; color: #666;">Permissões</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a;">${permissoes}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECÇÃO: EQUIPAMENTO -->
          <tr>
            <td style="background-color:#ffffff; padding: 24px 40px 32px 40px;">
              <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c0392b;">Equipamento</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
                <tr style="background:#fafafa;">
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; width: 45%; border-bottom: 1px solid #e8e8e8;">Campo</td>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e8e8e8;">Valor</td>
                </tr>
                <tr>
                  <td style="padding: 13px 16px; font-size: 13px; color: #666; ${temComputador ? "border-bottom: 1px solid #f0f0f0;" : ""}">Computador atribuído</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; ${temComputador ? "border-bottom: 1px solid #f0f0f0;" : ""}">
                    <span style="background:${temComputador ? "#d4edda" : "#f8d7da"}; color:${temComputador ? "#155724" : "#721c24"}; padding: 2px 10px; border-radius: 20px; font-size: 12px;">${temComputador ? "✔ Sim" : "✘ Não"}</span>
                  </td>
                </tr>
                ${temComputador ? `
                <tr style="background:#fafafa;">
                  <td style="padding: 13px 16px; font-size: 13px; color: #666; border-bottom: 1px solid #f0f0f0;">Microsoft Office</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">
                    <span style="background:${temOffice ? "#d4edda" : "#f8d7da"}; color:${temOffice ? "#155724" : "#721c24"}; padding: 2px 10px; border-radius: 20px; font-size: 12px;">${temOffice ? "✔ Sim" : "✘ Não"}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 16px; font-size: 13px; color: #666;">Programas adicionais</td>
                  <td style="padding: 13px 16px; font-size: 13px; font-weight: 600; color: #1a1a1a;">${programasLista}</td>
                </tr>
                ` : ""}
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #2c2c2c; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #ffffff;">SOCEM</p>
              <p style="margin: 0; font-size: 12px; color: #888;">Esta é uma mensagem automática — por favor não responda a este email.</p>
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
