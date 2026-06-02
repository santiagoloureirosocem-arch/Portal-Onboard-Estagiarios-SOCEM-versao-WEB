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

  const badge = (label: string, bg: string, color: string) =>
    `<span style="display:inline-block;background:${bg};color:${color};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.3px">${label}</span>`;

  const statusChip = (ok: boolean) => ok
    ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#ecfdf5;color:#059669;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700"><span style="width:6px;height:6px;background:#059669;border-radius:50%"></span>Sim</span>`
    : `<span style="display:inline-flex;align-items:center;gap:4px;background:#fef2f2;color:#dc2626;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700"><span style="width:6px;height:6px;background:#dc2626;border-radius:50%"></span>Nao</span>`;

  const row = (field: string, value: string, alt = false) =>
    `<tr style="${alt ? "background:#f8fafc" : ""}"><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9"><span style="font-size:12px;font-weight:600;color:#64748b">${field}</span></td><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;text-align:right"><span style="font-size:13px;font-weight:700;color:#0f172a">${value}</span></td></tr>`;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0">
  <tr>
    <td style="padding-bottom:20px">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8">Novo Registo</p>
      
      <!-- Name card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px;overflow:hidden">
        <tr>
          <td style="padding:24px 28px">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <p style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.5px">${nome}</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;font-weight:500">Colaborador #${numColaborador}</p>
              </td>
              <td width="60" align="right" style="vertical-align:middle">
                <div style="width:56px;height:56px;background:rgba(255,255,255,0.1);border-radius:16px;display:flex;align-items:center;justify-content:center">
                  <span style="font-size:24px">👤</span>
                </div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background:rgba(255,255,255,0.05);padding:14px 28px">
            <span style="font-size:11px;font-weight:600;color:#cbd5e1;letter-spacing:.5px">PEDIDO DE CONFIGURACAO DE ACESSOS</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- Organization Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
  <tr>
    <td style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
      <p style="margin:0;font-size:12px;font-weight:800;color:#334155;letter-spacing:.5px;text-transform:uppercase">🏢 Organizacao</p>
    </td>
  </tr>
  ${row("Empresa", empresa)}
  ${row("Departamento", departamento, true)}
  ${row("Responsavel", responsavel)}
  <tr style="background:#f8fafc">
    <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9"><span style="font-size:12px;font-weight:600;color:#64748b">Permissoes</span></td>
    <td style="padding:14px 20px;text-align:right">${badge(permissoes, "#eff6ff", "#1e40af")}</td>
  </tr>
</table>

<!-- Equipment Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
  <tr>
    <td style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0">
      <p style="margin:0;font-size:12px;font-weight:800;color:#334155;letter-spacing:.5px;text-transform:uppercase">💻 Equipamento & Acessos</p>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9"><span style="font-size:12px;font-weight:600;color:#64748b">Computador</span></td>
    <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;text-align:right">${statusChip(temComputador)}</td>
  </tr>
  ${temComputador ? `
  <tr style="background:#f8fafc">
    <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9"><span style="font-size:12px;font-weight:600;color:#64748b">Microsoft Office</span></td>
    <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;text-align:right">${statusChip(temOffice)}</td>
  </tr>
  <tr>
    <td style="padding:14px 20px"><span style="font-size:12px;font-weight:600;color:#64748b">Programas Adicionais</span></td>
    <td style="padding:14px 20px;text-align:right"><span style="font-size:13px;font-weight:700;color:#0f172a">${programasLista}</span></td>
  </tr>
  ` : ""}
</table>

<!-- Action Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1px solid #fde68a;border-radius:16px;overflow:hidden">
  <tr>
    <td style="padding:20px 24px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle">
          <p style="margin:0 0 4px 0;font-size:13px;font-weight:800;color:#92400e">Acao Necessaria</p>
          <p style="margin:0;font-size:12px;color:#a16207;line-height:1.5">Configure os acessos, crie as contas e prepare o equipamento para este colaborador antes da data de inicio.</p>
        </td>
        <td width="48" align="right" style="vertical-align:top">
          <div style="width:44px;height:44px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px">📋</div>
        </td>
      </tr></table>
    </td>
  </tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding-top:8px;text-align:center">
      <p style="margin:0;font-size:10px;color:#94a3b8">Portal SOCEM · Enviado automaticamente · ${new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}</p>
    </td>
  </tr>
</table>`;
}