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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #c0392b; margin-bottom: 4px;">Registo de Novo Colaborador</h2>
        <p style="color: #666; margin-top: 0; margin-bottom: 24px; font-size: 14px;">Submetido através do Portal SOCEM</p>

        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr style="background: #f0f0f0;">
            <td style="padding: 10px 16px; font-weight: bold; font-size: 13px; color: #333; width: 40%;">Campo</td>
            <td style="padding: 10px 16px; font-weight: bold; font-size: 13px; color: #333;">Valor</td>
          </tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Nome</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${nome}</td></tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Nº Colaborador</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${numColaborador}</td></tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Empresa</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${empresa}</td></tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Departamento</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${departamento}</td></tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Permissões</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${permissoes}</td></tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Responsável</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${responsavel}</td></tr>
          <tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Computador</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${temComputador ? "Sim" : "Não"}</td></tr>
          ${temComputador ? `<tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Microsoft Office</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${temOffice ? "Sim" : "Não"}</td></tr>` : ""}
          ${temComputador ? `<tr><td style="padding: 10px 16px; font-size: 13px; color: #555; border-top: 1px solid #eee;">Programas adicionais</td><td style="padding: 10px 16px; font-size: 13px; color: #222; border-top: 1px solid #eee;">${programasLista}</td></tr>` : ""}
        </table>

        <p style="margin-top: 24px; font-size: 12px; color: #aaa; text-align: center;">Portal SOCEM — Mensagem automática</p>
      </div>
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
