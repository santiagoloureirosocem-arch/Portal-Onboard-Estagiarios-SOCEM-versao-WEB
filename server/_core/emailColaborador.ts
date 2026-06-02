import { Express, Request, Response } from "express";
import { sendEmail } from "./email";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function registerEmailColaboradorRoute(app: Express) {
  app.post("/api/email/novo-colaborador", async (req: Request, res: Response) => {
    try {
      const {
        nome,
        numColaborador,
        empresa,
        departamento,
        responsavel,
        permissoes,
        temComputador,
        temOffice,
        programas,
      } = req.body;

      if (!nome || !numColaborador || !empresa || !departamento || !responsavel || !permissoes) {
        res.status(400).json({ success: false, message: "Campos obrigatórios em falta." });
        return;
      }

      const programasLista = Array.isArray(programas) && programas.length > 0
        ? programas.join(", ")
        : "Nenhum";

      const bodyHtml = buildHtml({
        nome: escapeHtml(String(nome)),
        numColaborador: escapeHtml(String(numColaborador)),
        empresa: escapeHtml(empresa),
        departamento: escapeHtml(departamento),
        responsavel: escapeHtml(responsavel),
        permissoes: escapeHtml(permissoes),
        temComputador,
        temOffice,
        programasLista: escapeHtml(programasLista),
      });

      const result = await sendEmail({
        to: "informatica@socem.pt",
        toName: "Informatica SOCEM",
        subject: `Novo Colaborador Registado — ${nome}`,
        heading: "Novo Colaborador Registado",
        bodyHtml,
      });

      if (result.ok) {
        res.json({ success: true, message: "Registo submetido e email enviado com sucesso." });
      } else {
        console.error(`[EmailColaborador] Falha ao enviar: ${result.error}`);
        res.status(200).json({
          success: true,
          message: "Registo submetido, mas o email não foi enviado.",
          emailError: result.error,
        });
      }
    } catch (err) {
      console.error("[EmailColaborador] Erro:", err);
      res.status(500).json({ success: false, message: "Erro interno do servidor." });
    }
  });
}

function buildHtml(data: any) {
  const { nome, numColaborador, empresa, departamento, responsavel, permissoes, temComputador, temOffice, programasLista } = data;

  return `
<p>Foi submetido um novo registo através do Portal SOCEM. Reveja a informação abaixo:</p>

<div style="background:linear-gradient(135deg,#fdf2f2,#fff5f5);border:1px solid #f5c6c6;border-radius:10px;padding:20px 24px;margin:20px 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td>
      <p style="margin:0 0 3px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c0392b;">Colaborador</p>
      <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a1a;">${nome}</p>
    </td>
    <td align="right" style="vertical-align:top;">
      <span style="background:#c0392b;color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap;">Nº ${numColaborador}</span>
    </td>
  </tr></table>
</div>

<h3 style="font-size:13px;font-weight:700;color:#c0392b;margin:24px 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Organização</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;width:40%;border-bottom:1px solid #e5e7eb;">Campo</td>
    <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;">Valor</td>
  </tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Empresa</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${empresa}</td></tr>
  <tr style="background:#fafafa;"><td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Departamento</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${departamento}</td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Responsável</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${responsavel}</td></tr>
  <tr style="background:#fafafa;"><td style="padding:12px 16px;font-size:13px;color:#777;">Permissões</td><td style="padding:12px 16px;"><span style="background:#eaf4fb;color:#1a5276;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${permissoes}</span></td></tr>
</table>

<h3 style="font-size:13px;font-weight:700;color:#c0392b;margin:24px 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Equipamento & Acessos</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <tr style="background:#f9fafb;">
    <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;width:40%;border-bottom:1px solid #e5e7eb;">Campo</td>
    <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;">Estado</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:#777;${temComputador ? "border-bottom:1px solid #f5f5f5;" : ""}">Computador</td>
    <td style="padding:12px 16px;${temComputador ? "border-bottom:1px solid #f5f5f5;" : ""}">
      <span style="background:${temComputador ? "#d4edda" : "#f8d7da"};color:${temComputador ? "#155724" : "#721c24"};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">${temComputador ? "Sim" : "Não"}</span>
    </td>
  </tr>
  ${temComputador ? `
  <tr style="background:#fafafa;"><td style="padding:12px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Microsoft Office</td><td style="padding:12px 16px;border-bottom:1px solid #f5f5f5;"><span style="background:${temOffice ? "#d4edda" : "#f8d7da"};color:${temOffice ? "#155724" : "#721c24"};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">${temOffice ? "Sim" : "Não"}</span></td></tr>
  <tr><td style="padding:12px 16px;font-size:13px;color:#777;">Programas adicionais</td><td style="padding:12px 16px;font-size:13px;font-weight:600;color:#1a1a1a;">${programasLista}</td></tr>
  ` : ""}
</table>

<div style="background:#fffbf0;border:1px solid #fde8a0;border-radius:8px;padding:14px 18px;margin:24px 0 0 0;">
  <p style="margin:0;font-size:13px;color:#7d5a00;">⚠️ <strong>Ação necessária:</strong> Configure os acessos e equipamentos necessários para este colaborador.</p>
</div>`;
}