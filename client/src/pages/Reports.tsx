import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, TrendingUp, Users, CheckCircle2, ClipboardList,
  AlertCircle, CheckSquare, Circle, Loader, Download, FileSpreadsheet,
  FileText as FilePDF,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

// ─── SOCEM brand colors ───────────────────────────────────────────────────────
const SOCEM_RED = "#CC0000";
const SOCEM_DARK = "#1a1a1a";

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function exportToPDF(data: ExportData) {
  // Dynamic import to avoid bundle bloat
  const { default: jsPDF } = await import("jspdf").catch(() => {
    throw new Error("jspdf não disponível");
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  let y = 0;

  // ── Header band ──
  doc.setFillColor(SOCEM_RED);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SOCEM — Portal de Estagiários", margin, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Relatório gerado em ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: pt })}`, margin, 22);
  y = 42;

  // ── Title ──
  doc.setTextColor(SOCEM_DARK);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo de Desempenho", margin, y);
  y += 12;

  // ── KPI row ──
  const kpis = [
    { label: "Estagiários Ativos", value: String(data.activeInterns) },
    { label: "Planos Ativos", value: String(data.activePlans) },
    { label: "Tarefas Pendentes", value: String(data.pendingTasks) },
    { label: "Taxa de Conclusão", value: `${data.completionRate}%` },
  ];
  const colW = (pageW - 2 * margin - 9) / 4;
  kpis.forEach((k, i) => {
    const x = margin + i * (colW + 3);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, y, colW, 22, 2, 2, "F");
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(x, y, colW, 22, 2, 2, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(k.label, x + colW / 2, y + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(SOCEM_RED);
    doc.text(k.value, x + colW / 2, y + 18, { align: "center" });
  });
  y += 32;

  // ── Plans table ──
  if (data.plans.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(SOCEM_DARK);
    doc.text("Planos de Onboarding", margin, y);
    y += 7;

    // Header row
    const cols = [{ label: "Título", w: 90 }, { label: "Estado", w: 35 }, { label: "Descrição", w: 45 }];
    let rowX = margin;
    doc.setFillColor(SOCEM_RED);
    doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    cols.forEach(c => { doc.text(c.label, rowX + 2, y + 5.5); rowX += c.w; });
    y += 8;

    data.plans.forEach((plan: any, idx: number) => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      const bg = idx % 2 === 0 ? [255, 255, 255] : [250, 250, 252];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, y, pageW - 2 * margin, 7.5, "F");
      doc.setDrawColor(235, 235, 235);
      doc.rect(margin, y, pageW - 2 * margin, 7.5, "S");
      doc.setTextColor(SOCEM_DARK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", draft: "Rascunho", archived: "Arquivado" };
      const row = [plan.title, statusLabels[plan.status] ?? plan.status, plan.description ?? "—"];
      rowX = margin;
      cols.forEach((c, ci) => {
        const txt = doc.splitTextToSize(row[ci], c.w - 4)[0] ?? "";
        doc.text(txt, rowX + 2, y + 5);
        rowX += c.w;
      });
      y += 7.5;
    });
    y += 8;
  }

  // ── Tasks summary ──
  if (data.tasks.length > 0) {
    if (y > pageH - 60) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(SOCEM_DARK);
    doc.text("Resumo de Tarefas", margin, y);
    y += 7;

    const completed = data.tasks.filter((t: any) => t.status === "completed").length;
    const pending = data.tasks.filter((t: any) => t.status === "pending").length;
    const inProgress = data.tasks.filter((t: any) => t.status === "in_progress").length;
    const total = data.tasks.length;
    const summary = [
      { label: "Concluídas", count: completed, pct: total ? Math.round((completed / total) * 100) : 0, color: [34, 197, 94] },
      { label: "Em Progresso", count: inProgress, pct: total ? Math.round((inProgress / total) * 100) : 0, color: [251, 146, 60] },
      { label: "Pendentes", count: pending, pct: total ? Math.round((pending / total) * 100) : 0, color: [148, 163, 184] },
    ];

    summary.forEach(s => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`${s.label}: ${s.count} (${s.pct}%)`, margin, y + 4);
      // progress bar
      const barX = margin + 48;
      const barW = 80;
      doc.setFillColor(235, 235, 235);
      doc.roundedRect(barX, y, barW, 5, 1, 1, "F");
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      if (s.pct > 0) doc.roundedRect(barX, y, (barW * s.pct) / 100, 5, 1, 1, "F");
      y += 9;
    });

    // ── Detailed task lists per status ──
    const taskGroups = [
      {
        label: "✓ Tarefas Concluídas",
        tasks: data.tasks.filter((t: any) => t.status === "completed"),
        headerColor: [34, 197, 94] as [number, number, number],
        rowColor: [240, 253, 244] as [number, number, number],
        textColor: [21, 128, 61] as [number, number, number],
      },
      {
        label: "→ Tarefas Em Progresso",
        tasks: data.tasks.filter((t: any) => t.status === "in_progress"),
        headerColor: [251, 146, 60] as [number, number, number],
        rowColor: [255, 247, 237] as [number, number, number],
        textColor: [154, 52, 18] as [number, number, number],
      },
      {
        label: "○ Tarefas Pendentes",
        tasks: data.tasks.filter((t: any) => t.status === "pending"),
        headerColor: [148, 163, 184] as [number, number, number],
        rowColor: [248, 250, 252] as [number, number, number],
        textColor: [71, 85, 105] as [number, number, number],
      },
    ];

    for (const group of taskGroups) {
      if (group.tasks.length === 0) continue;
      y += 4;
      if (y > pageH - 40) { doc.addPage(); y = 20; }

      // Group heading
      doc.setFillColor(group.headerColor[0], group.headerColor[1], group.headerColor[2]);
      doc.rect(margin, y, pageW - 2 * margin, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${group.label} (${group.tasks.length})`, margin + 2, y + 5);
      y += 7;

      // Column headers
      const tCols = [
        { label: "Título", w: 85 },
        { label: "Descrição", w: 65 },
        { label: "Prazo", w: 20 },
      ];
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageW - 2 * margin, 6, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(margin, y, pageW - 2 * margin, 6, "S");
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      let cx = margin;
      tCols.forEach(c => { doc.text(c.label, cx + 2, y + 4.2); cx += c.w; });
      y += 6;

      // Rows
      group.tasks.forEach((task: any, idx: number) => {
        const rowH = 6.5;
        if (y > pageH - 20) { doc.addPage(); y = 20; }
        const bg = idx % 2 === 0 ? [255, 255, 255] : group.rowColor;
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
        doc.setDrawColor(235, 235, 235);
        doc.rect(margin, y, pageW - 2 * margin, rowH, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(group.textColor[0], group.textColor[1], group.textColor[2]);
        const title = doc.splitTextToSize(task.title ?? "", tCols[0].w - 4)[0] ?? "";
        doc.text(title, margin + 2, y + 4.5);
        doc.setTextColor(80, 80, 80);
        const desc = doc.splitTextToSize(task.description ?? "—", tCols[1].w - 4)[0] ?? "—";
        doc.text(desc, margin + tCols[0].w + 2, y + 4.5);
        const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-PT") : "—";
        doc.text(due, margin + tCols[0].w + tCols[1].w + 2, y + 4.5);
        y += rowH;
      });
      y += 4;
    }
  }

  // ── Footer ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setDrawColor(220, 220, 220);
    doc.line(0, pageH - 12, pageW, pageH - 12);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("SOCEM — Portal de Onboarding de Estagiários", margin, pageH - 5);
    doc.text(`Pág. ${i} / ${pageCount}`, pageW - margin, pageH - 5, { align: "right" });
  }

  doc.save(`SOCEM_Relatorio_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

const SOCEM_RED_HEX = "CC0000";
const SOCEM_DARK_HEX = "1a1a1a";
const HEADER_FILL = { fgColor: { rgb: SOCEM_RED_HEX } };
const HEADER_FONT = { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" };
const TITLE_FONT = { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Calibri" };
const SUBTITLE_FONT = { sz: 9, color: { rgb: "FFFFFF" }, name: "Calibri" };
const KPI_LABEL_FONT = { bold: true, sz: 10, color: { rgb: "666666" }, name: "Calibri" };
const KPI_VALUE_FONT = { bold: true, sz: 18, color: { rgb: SOCEM_RED_HEX }, name: "Calibri" };
const BORDER_THIN = { style: "thin", color: { rgb: "D0D0D0" } } as const;
const BORDER_ALL = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };

function applyHeaderStyle(ws: any, ref: string) {
  const cell = ws[ref];
  if (cell) {
    cell.s = { font: HEADER_FONT, fill: HEADER_FILL, border: BORDER_ALL, alignment: { horizontal: "center", vertical: "center" } };
  }
}

function styleDataRow(xlsxMod: any, ws: any, rowNum: number, cols: string[], startCol: number = 1) {
  const isEven = rowNum % 2 === 0;
  cols.forEach((col, i) => {
    const ref = xlsxMod.utils.encode_cell({ r: rowNum, c: startCol + i });
    const cell = ws[ref];
    if (cell) {
      cell.s = {
        ...cell.s,
        border: BORDER_ALL,
        fill: isEven ? { fgColor: { rgb: "F8F8FA" } } : { fgColor: { rgb: "FFFFFF" } },
        font: { sz: 9, name: "Calibri", color: { rgb: SOCEM_DARK_HEX } },
      };
    }
  });
}

async function exportToExcel(data: ExportData) {
  const XLSX = await import("xlsx").catch(() => { throw new Error("xlsx não disponível"); });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumo ──
  {
    const resumoData = [
      ["SOCEM — Portal de Estagiários", null, null, null],
      [`Relatório gerado em ${format(new Date(), "d 'de' MMMM yyyy 'às' HH:mm", { locale: pt })}`, null, null, null],
      [null, null, null, null],
      ["INDICADOR", "VALOR", null, null],
      ["Estagiários Ativos", data.activeInterns, null, null],
      ["Planos Ativos", data.activePlans, null, null],
      ["Tarefas Pendentes", data.pendingTasks, null, null],
      ["Taxa de Conclusão (%)", data.completionRate, null, null],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo["!cols"] = [{ wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    wsResumo["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    ];

    // Title row
    if (wsResumo["A1"]) wsResumo["A1"].s = { font: TITLE_FONT, fill: HEADER_FILL, alignment: { horizontal: "left", vertical: "center" } };
    if (wsResumo["A2"]) wsResumo["A2"].s = { font: SUBTITLE_FONT, fill: HEADER_FILL, alignment: { horizontal: "left", vertical: "center" } };

    // KPI header
    if (wsResumo["A4"]) wsResumo["A4"].s = { font: { bold: true, sz: 10, color: { rgb: SOCEM_RED_HEX }, name: "Calibri" }, fill: { fgColor: { rgb: "FFF0F0" } }, border: BORDER_ALL };

    // KPI rows
    [4, 5, 6, 7].forEach((row, i) => {
      const labelRef = XLSX.utils.encode_cell({ r: row, c: 0 });
      const valRef = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (wsResumo[labelRef]) {
        wsResumo[labelRef].s = { font: KPI_LABEL_FONT, border: BORDER_ALL, fill: { fgColor: { rgb: i % 2 === 0 ? "F8F8FA" : "FFFFFF" } } };
      }
      if (wsResumo[valRef]) {
        const isString = typeof resumoData[row][1] === "string";
        wsResumo[valRef].s = {
          font: isString ? { ...KPI_VALUE_FONT, sz: 14 } : KPI_VALUE_FONT,
          border: BORDER_ALL,
          fill: { fgColor: { rgb: i % 2 === 0 ? "F8F8FA" : "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
  }

  // ── Sheet 2: Planos ──
  if (data.plans.length > 0) {
    const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", draft: "Rascunho", archived: "Arquivado" };
    const header = [["ID", "Título", "Estado", "Descrição"]];
    const rows = data.plans.map((p: any) => [p.id, p.title, statusLabels[p.status] ?? p.status, p.description ?? ""]);
    const wsPlanos = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    wsPlanos["!cols"] = [{ wch: 8 }, { wch: 40 }, { wch: 14 }, { wch: 50 }];

    const headerCols = ["A1", "B1", "C1", "D1"];
    headerCols.forEach(ref => applyHeaderStyle(wsPlanos, ref));
    for (let i = 0; i < rows.length; i++) {
      styleDataRow(XLSX, wsPlanos, i + 1, ["A", "B", "C", "D"]);
    }
    XLSX.utils.book_append_sheet(wb, wsPlanos, "Planos");
  }

  // ── Sheet 3: Tarefas ──
  if (data.tasks.length > 0) {
    const statusLabelsT: Record<string, string> = { completed: "Concluída", in_progress: "Em Progresso", pending: "Pendente" };
    const header = [["ID", "Título", "Estado", "Descrição", "Data Limite"]];
    const rows = data.tasks.map((t: any) => [
      t.id, t.title, statusLabelsT[t.status] ?? t.status, t.description ?? "",
      t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : "",
    ]);
    const wsTarefas = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    wsTarefas["!cols"] = [{ wch: 8 }, { wch: 45 }, { wch: 16 }, { wch: 45 }, { wch: 14 }];

    const headerCols = ["A1", "B1", "C1", "D1", "E1"];
    headerCols.forEach(ref => applyHeaderStyle(wsTarefas, ref));
    for (let i = 0; i < rows.length; i++) {
      styleDataRow(XLSX, wsTarefas, i + 1, ["A", "B", "C", "D", "E"]);
    }
    XLSX.utils.book_append_sheet(wb, wsTarefas, "Tarefas");
  }

  // ── Sheet 4: Utilizadores ──
  if (data.users.length > 0) {
    const roleLabels: Record<string, string> = { admin: "Administrador", tutor: "Tutor", estagiario: "Estagiário" };
    const header = [["ID", "Nome", "Email", "Cargo", "Papel", "Estado"]];
    const rows = data.users.map((u: any) => [
      u.id, u.name, u.email, u.position ?? "", roleLabels[u.role] ?? u.role, u.isActive ? "Ativo" : "Inativo",
    ]);
    const wsUsers = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    wsUsers["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 38 }, { wch: 25 }, { wch: 18 }, { wch: 12 }];

    const headerCols = ["A1", "B1", "C1", "D1", "E1", "F1"];
    headerCols.forEach(ref => applyHeaderStyle(wsUsers, ref));
    for (let i = 0; i < rows.length; i++) {
      styleDataRow(XLSX, wsUsers, i + 1, ["A", "B", "C", "D", "E", "F"]);
    }
    XLSX.utils.book_append_sheet(wb, wsUsers, "Utilizadores");
  }

  XLSX.writeFile(wb, `SOCEM_Relatorio_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportData = {
  activeInterns: number;
  activePlans: number;
  pendingTasks: number;
  completionRate: number;
  plans: any[];
  tasks: any[];
  users: any[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const { data: allTasks } = trpc.tasks.listAll.useQuery();
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

  const totalPlans = plans?.length ?? 0;
  const activePlans = plans?.filter((p: any) => p.status === "active").length ?? 0;
  const draftPlans = plans?.filter((p: any) => p.status === "draft").length ?? 0;
  const completedPlans = plans?.filter((p: any) => p.status === "completed").length ?? 0;

  const totalUsers = users?.length ?? 0;
  const adminUsers = users?.filter((u: any) => u.role === "admin").length ?? 0;
  const regularUsers = users?.filter((u: any) => u.role === "estagiario").length ?? 0;

  const totalTasks = allTasks?.length ?? 0;
  const completedTasks = allTasks?.filter((t: any) => t.status === "completed") ?? [];
  const inProgressTasks = allTasks?.filter((t: any) => t.status === "in_progress") ?? [];
  const pendingTasks = allTasks?.filter((t: any) => t.status === "pending") ?? [];

  const exportData: ExportData = {
    activeInterns: metrics?.activeInterns ?? 0,
    activePlans: metrics?.activePlans ?? 0,
    pendingTasks: metrics?.pendingTasks ?? 0,
    completionRate: metrics?.completionRate ?? 0,
    plans: plans ?? [],
    tasks: allTasks ?? [],
    users: users ?? [],
  };

  const handleExport = async (type: "pdf" | "xlsx") => {
    setExporting(type);
    try {
      if (type === "pdf") await exportToPDF(exportData);
      else await exportToExcel(exportData);
    } catch (err) {
      console.error("Erro ao exportar:", err);
      alert("Erro ao exportar. Certifica-te de que as dependências estão instaladas.");
    } finally {
      setExporting(null);
    }
  };

  const statCards = [
    { label: "Estagiários Ativos", value: metrics?.activeInterns ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Planos Ativos", value: metrics?.activePlans ?? 0, icon: ClipboardList, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Tarefas Pendentes", value: metrics?.pendingTasks ?? 0, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Planos Concluídos", value: completedPlans, icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const taskStatusMeta = [
    { label: "Concluídas", tasks: completedTasks, color: "bg-green-500", dot: "bg-green-500", textColor: "text-green-600 dark:text-green-400", icon: CheckCircle2 },
    { label: "Em Progresso", tasks: inProgressTasks, color: "bg-orange-400", dot: "bg-orange-400", textColor: "text-orange-600 dark:text-orange-400", icon: Loader },
    { label: "Pendentes", tasks: pendingTasks, color: "bg-muted-foreground", dot: "bg-slate-400", textColor: "text-slate-500", icon: Circle },
  ];

  return (
    <DashboardLayout title="Relatórios - Portal SOCEM">
      <div className="space-y-6">

        {/* Page header + export buttons */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Estatísticas reais do sistema</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
              onClick={() => handleExport("xlsx")}
              disabled={exporting !== null || isLoading}
            >
              {exporting === "xlsx" ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exportar Excel
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-[#CC0000] hover:bg-[#AA0000] text-white"
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null || isLoading}
            >
              {exporting === "pdf" ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <FilePDF className="h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isLoading ? "—" : s.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plans breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estado dos Planos
            </h3>
            {totalPlans === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum plano criado ainda</p>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Ativos", count: activePlans, color: "bg-green-500" },
                  { label: "Rascunhos", count: draftPlans, color: "bg-muted-foreground" },
                  { label: "Concluídos", count: completedPlans, color: "bg-blue-500" },
                  { label: "Arquivados", count: plans?.filter((p: any) => p.status === "archived").length ?? 0, color: "bg-red-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.count} / {totalPlans}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: totalPlans > 0 ? `${(item.count / totalPlans) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Users breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Utilizadores
            </h3>
            {totalUsers === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum utilizador registado</p>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Total de Utilizadores", count: totalUsers, dot: "bg-primary" },
                  { label: "Estagiários", count: regularUsers, dot: "bg-blue-500" },
                  { label: "Administradores", count: adminUsers, dot: "bg-purple-500" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.dot}`} />
                      <span className="text-foreground font-medium">{item.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Tasks statistics */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Estatísticas de Tarefas
            <span className="ml-auto text-sm font-normal text-muted-foreground">{totalTasks} tarefa(s) no total</span>
          </h3>
          {totalTasks === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhuma tarefa criada ainda</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                {taskStatusMeta.map(({ label, tasks, color, dot, textColor }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${textColor}`}>{tasks.length} / {totalTasks}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all`}
                        style={{ width: totalTasks > 0 ? `${(tasks.length / totalTasks) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {completedTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Tarefas Concluídas
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {completedTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/15 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {inProgressTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Loader className="h-4 w-4 text-orange-500" />
                    Em Progresso
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {inProgressTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-orange-500/5 border border-orange-500/15 rounded-lg">
                        <Loader className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pendingTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Circle className="h-4 w-4 text-slate-400" />
                    Tarefas Pendentes
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pendingTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                        <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Plans list */}
        {plans && plans.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Lista de Planos</h3>
            <div className="space-y-2">
              {plans.map((plan: any) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">{plan.title}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.status === "active" ? "bg-green-500/10 text-green-500" :
                    plan.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                    plan.status === "archived" ? "bg-red-500/10 text-red-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {plan.status === "active" ? "Ativo" : plan.status === "completed" ? "Concluído" : plan.status === "archived" ? "Arquivado" : "Rascunho"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
