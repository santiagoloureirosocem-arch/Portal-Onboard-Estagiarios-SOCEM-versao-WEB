import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Eye, Trash2, User, FileSpreadsheet, FileText as FilePDF, Loader, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlanFormData {
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  assignedToUserId: number | null;
  startDate: string;
  endDate: string;
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
const SOCEM_RED = "#CC0000";
const SOCEM_DARK = "#1a1a1a";

const STATUS_LABELS: Record<string, string> = { active: "Ativo", completed: "Concluído", draft: "Rascunho", archived: "Arquivado" };
const TASK_STATUS_LABELS: Record<string, string> = { pending: "Pendente", in_progress: "Em Progresso", completed: "Concluída" };

async function addPageFooter(doc: any, pageW: number, pageH: number, margin: number) {
  const pageCount = doc.internal.getNumberOfPages();
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
}

async function addDocHeader(doc: any, pageW: number, margin: number) {
  doc.setFillColor(SOCEM_RED);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SOCEM — Portal de Estagiários", margin, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Planos de Integração — ${format(new Date(), "d 'de' MMMM yyyy", { locale: pt })}`, margin, 22);
}

// ── Single plan export (com tasks) ──

async function exportSinglePlanPDF(plan: any) {
  const { default: jsPDF } = await import("jspdf").catch(() => {
    throw new Error("jspdf não disponível");
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const pageWContent = pageW - 2 * margin;

  await addDocHeader(doc, pageW, margin);

  let y = 42;

  // ── Plan title and status ──
  doc.setTextColor(SOCEM_DARK);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(plan.title, margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const statusStr = STATUS_LABELS[plan.status] ?? plan.status;
  doc.text(`Estado: ${statusStr}`, margin + doc.getTextWidth(plan.title) + 6, y);
  y += 8;

  // ── Description ──
  if (plan.description) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(plan.description.replace(/[#*_`>\-]/g, ""), pageWContent);
    descLines.forEach((line: string) => {
      if (y > pageH - 30) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 4;
  }

  // ── Plan dates ──
  if (plan.startDate || plan.endDate) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    if (plan.startDate) doc.text(`Início: ${format(new Date(plan.startDate), "d MMM yyyy", { locale: pt })}`, margin, y);
    if (plan.endDate) doc.text(`Conclusão: ${format(new Date(plan.endDate), "d MMM yyyy", { locale: pt })}`, margin + 60, y);
    y += 7;
  }

  // ── Separator ──
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ── Tasks section ──
  const tasks = plan.tasks ?? [];
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(SOCEM_DARK);
  doc.text(`Tarefas (${tasks.length})`, margin, y);
  y += 8;

  if (tasks.length > 0) {
    const tCols = [
      { label: "#", w: 10 },
      { label: "Título", w: 68 },
      { label: "Estado", w: 28 },
      { label: "Prazo", w: 22 },
      { label: "Descrição", w: 42 },
    ];

    doc.setFillColor(SOCEM_RED);
    doc.rect(margin, y, pageWContent, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    let cx = margin;
    tCols.forEach(c => { doc.text(c.label, cx + 2, y + 5.5); cx += c.w; });
    y += 8;

    tasks.forEach((task: any, idx: number) => {
      if (y > pageH - 25) { doc.addPage(); y = 20; }

      const bg = idx % 2 === 0 ? [255, 255, 255] : [250, 250, 252];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, y, pageWContent, 7.5, "F");
      doc.setDrawColor(230, 230, 230);
      doc.rect(margin, y, pageWContent, 7.5, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(SOCEM_DARK);

      const cells = [
        String(task.id),
        task.title,
        TASK_STATUS_LABELS[task.status] ?? task.status,
        task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "—",
        task.description ? (doc.splitTextToSize(task.description.replace(/[#*_`>\-]/g, ""), tCols[4].w - 4)[0] ?? "") : "—",
      ];
      cx = margin;
      cells.forEach((txt, ci) => {
        doc.text(txt, cx + 2, y + 5);
        cx += tCols[ci].w;
      });
      y += 7.5;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Este plano ainda não tem tarefas.", margin, y + 5);
  }

  await addPageFooter(doc, pageW, pageH, margin);

  const safeName = plan.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  doc.save(`SOCEM_${safeName}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
}

async function exportSinglePlanExcel(plan: any) {
  const XLSX = await import("xlsx").catch(() => { throw new Error("xlsx não disponível"); });

  const HEADER_FILL = { fgColor: { rgb: "CC0000" } };
  const HEADER_FONT = { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" };
  const BORDER_ALL = { style: "thin", color: { rgb: "D0D0D0" } };

  function applyStyle(ws: any, ref: string, style: any) {
    const cell = ws[ref];
    if (cell) cell.s = style;
  }

  function applyHeader(ws: any, refs: string[]) {
    refs.forEach(ref => applyStyle(ws, ref, { font: HEADER_FONT, fill: HEADER_FILL, border: { top: BORDER_ALL, bottom: BORDER_ALL, left: BORDER_ALL, right: BORDER_ALL }, alignment: { horizontal: "center", vertical: "center" } }));
  }

  function applyRow(ws: any, rowNum: number, colCount: number) {
    const isEven = rowNum % 2 === 0;
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowNum, c });
      applyStyle(ws, ref, {
        font: { sz: 9, name: "Calibri", color: { rgb: SOCEM_DARK.slice(1) } },
        border: { top: BORDER_ALL, bottom: BORDER_ALL, left: BORDER_ALL, right: BORDER_ALL },
        fill: isEven ? { fgColor: { rgb: "F8F8FA" } } : { fgColor: { rgb: "FFFFFF" } },
      });
    }
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Plano
  const planData = [
    ["SOCEM — Portal de Estagiários", null, null, null],
    ["Plano de Integração", null, null, null],
    [null, null, null, null],
    ["Título", plan.title, null, null],
    ["Estado", STATUS_LABELS[plan.status] ?? plan.status, null, null],
    ["Descrição", plan.description?.replace(/[#*_`>\-]/g, "").replace(/\n+/g, " ").trim() ?? "", null, null],
    ["Data de Início", plan.startDate ? format(new Date(plan.startDate), "dd/MM/yyyy") : "—", null, null],
    ["Data de Conclusão", plan.endDate ? format(new Date(plan.endDate), "dd/MM/yyyy") : "—", null, null],
  ];
  const wsPlan = XLSX.utils.aoa_to_sheet(planData);
  wsPlan["!cols"] = [{ wch: 22 }, { wch: 60 }, { wch: 20 }, { wch: 20 }];
  wsPlan["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  applyStyle(wsPlan, "A1", { font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, fill: HEADER_FILL, alignment: { horizontal: "left" } });
  applyStyle(wsPlan, "A2", { font: { bold: true, sz: 12, color: { rgb: SOCEM_DARK.slice(1) } }, alignment: { horizontal: "left" } });
  for (let r = 3; r < planData.length; r++) {
    applyStyle(wsPlan, XLSX.utils.encode_cell({ r, c: 0 }), { font: { bold: true, sz: 9, name: "Calibri" }, border: BORDER_ALL, fill: { fgColor: { rgb: "F0F0F0" } } });
    applyStyle(wsPlan, XLSX.utils.encode_cell({ r, c: 1 }), { font: { sz: 9, name: "Calibri" }, border: BORDER_ALL });
  }
  XLSX.utils.book_append_sheet(wb, wsPlan, "Plano");

  // Sheet 2: Tarefas
  const tasks = plan.tasks ?? [];
  if (tasks.length > 0) {
    const taskHeader = [["ID", "Título", "Estado", "Descrição", "Data Início", "Data Limite"]];
    const taskRows = tasks.map((t: any) => [
      t.id,
      t.title,
      TASK_STATUS_LABELS[t.status] ?? t.status,
      t.description?.replace(/[#*_`>\-]/g, "").replace(/\n+/g, " ").trim() ?? "",
      t.startDate ? format(new Date(t.startDate), "dd/MM/yyyy") : "",
      t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : "",
    ]);
    const wsTasks = XLSX.utils.aoa_to_sheet([...taskHeader, ...taskRows]);
    wsTasks["!cols"] = [{ wch: 8 }, { wch: 45 }, { wch: 16 }, { wch: 50 }, { wch: 14 }, { wch: 14 }];
    applyHeader(wsTasks, ["A1", "B1", "C1", "D1", "E1", "F1"]);
    for (let i = 0; i < taskRows.length; i++) applyRow(wsTasks, i + 1, 6);
    XLSX.utils.book_append_sheet(wb, wsTasks, "Tarefas");
  }

  const safeName = plan.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  XLSX.writeFile(wb, `SOCEM_${safeName}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
}

export default function Plans() {
  const { user } = useAuth();
  const isIntern = user?.role === 'estagiario';
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';

  const utils = trpc.useUtils();
  const { data: plans, isLoading, refetch } = trpc.plans.list.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery(undefined, { enabled: canEdit });
  const createPlanMutation = trpc.plans.create.useMutation();
  const updatePlanMutation = trpc.plans.update.useMutation();
  const deletePlanMutation = trpc.plans.delete.useMutation();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [exportingPlanId, setExportingPlanId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    title: '', description: '', status: 'draft', assignedToUserId: null, startDate: '', endDate: '',
  });

  // Only show estagiários in the user selector
  const estagiarios = (allUsers || []).filter((u: any) => u.role === 'estagiario' && u.isActive !== false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePlanMutation.mutateAsync({ id: editingId, title: formData.title, description: formData.description, status: formData.status });
        toast.success('Plano atualizado com sucesso');
      } else {
        await createPlanMutation.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          assignedToUserId: formData.assignedToUserId || undefined,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        });
        toast.success(formData.assignedToUserId ? 'Plano criado e atribuído com sucesso' : 'Plano criado com sucesso');
      }
      setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null, startDate: '', endDate: '' });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch {
      toast.error('Erro ao guardar plano');
    }
  };

  const handleEdit = (plan: any) => {
    setFormData({ title: plan.title, description: plan.description || '', status: plan.status, assignedToUserId: null, startDate: '', endDate: '' });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePlanMutation.mutateAsync({ id });
      toast.success('Plano eliminado');
      setConfirmDeleteId(null);
      refetch();
    } catch {
      toast.error('Erro ao eliminar plano');
    }
  };

  const handleExportSinglePlan = async (planId: number, type: "pdf" | "xlsx") => {
    setExportingPlanId(planId);
    try {
      const planDetail = await utils.client.plans.getById.query({ id: planId });
      if (!planDetail) { toast.error("Plano não encontrado"); return; }
      if (type === "pdf") await exportSinglePlanPDF(planDetail);
      else await exportSinglePlanExcel(planDetail);
      toast.success(`Plano exportado como ${type.toUpperCase()}`);
    } catch {
      toast.error("Erro ao exportar plano");
    } finally {
      setExportingPlanId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'draft': return 'Rascunho';
      case 'archived': return 'Arquivado';
      default: return status;
    }
  };

  return (
    <DashboardLayout title="Planos de Integração">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isIntern ? 'Os Meus Planos' : 'Planos de Integração'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isIntern ? 'Planos de onboarding atribuídos a ti' : 'Crie e gira os planos de onboarding'}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/assign-plan")} variant="outline" className="gap-2">
                <User size={18} /> Atribuir Plano
              </Button>
              <Button onClick={() => {
                setShowForm(!showForm);
                if (showForm) { setEditingId(null); setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null, startDate: '', endDate: '' }); }
              }} className="gap-2">
                <Plus size={20} /> Novo Plano
              </Button>
            </div>
          )}
        </div>

        {showForm && canEdit && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">{editingId ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Título do Plano *" name="title" value={formData.title} onChange={handleInputChange} required />
              <textarea
                placeholder="Descrição" name="description" value={formData.description} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                rows={4}
              />
              {/* Dates — only when creating */}
              {!editingId && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>📅</span>
                    Duração do plano <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Data de início</span>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Data de conclusão</span>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">As datas aparecem como marcos no Calendário.</p>
                </div>
              )}
              {editingId && (
                <select name="status" value={formData.status} onChange={handleInputChange}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground w-full">
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="completed">Concluído</option>
                  <option value="archived">Arquivado</option>
                </select>
              )}
              {/* Assign to user — only when creating */}
              {!editingId && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <User size={14} />
                    Atribuir a estagiário <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <select
                    name="assignedToUserId"
                    value={formData.assignedToUserId ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, assignedToUserId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">— Sem atribuição por agora —</option>
                    {estagiarios.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  {estagiarios.length === 0 && (
                    <p className="text-xs text-muted-foreground">Não há estagiários disponíveis. Crie um utilizador com o papel de Estagiário primeiro.</p>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                  {editingId ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null, startDate: '', endDate: '' }); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-muted-foreground py-8">Carregando planos...</div>
          ) : plans && plans.length > 0 ? (
            plans.map((plan: any) => (
              <Card key={plan.id} className="p-6 flex flex-col">
                {confirmDeleteId === plan.id ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-foreground font-medium">Eliminar "{plan.title}"?</p>
                    <p className="text-sm text-muted-foreground">Esta ação não pode ser revertida.</p>
                    <div className="flex gap-2">
                      <Button variant="destructive" className="flex-1" onClick={() => handleDelete(plan.id)}>Eliminar</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-foreground flex-1">{plan.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(plan.status)}`}>
                        {getStatusLabel(plan.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                      {plan.description
                        ? plan.description.replace(/[#*_`>\-]/g, '').replace(/\n+/g, ' ').trim()
                        : 'Sem descrição'}
                    </p>
                    <div className={`flex gap-1.5 pt-4 border-t border-border ${isIntern ? '' : ''}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => setLocation(`/plans/${plan.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                            <Eye size={16} /> Ver
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Ver detalhes do plano</TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={exportingPlanId === plan.id}
                                className="p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors"
                              >
                                {exportingPlanId === plan.id ? <Loader size={16} className="text-muted-foreground animate-spin" /> : <Download size={16} className="text-muted-foreground" />}
                              </button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Exportar plano</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="min-w-36 rounded-xl p-1">
                          <DropdownMenuItem onClick={() => handleExportSinglePlan(plan.id, "pdf")} className="gap-2 rounded-lg cursor-pointer">
                            <FilePDF size={15} className="text-[#CC0000]" />
                            <span>Exportar PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportSinglePlan(plan.id, "xlsx")} className="gap-2 rounded-lg cursor-pointer">
                            <FileSpreadsheet size={15} className="text-green-600" />
                            <span>Exportar Excel</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {canEdit && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => handleEdit(plan)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <Edit2 size={16} className="text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Editar plano</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => setConfirmDeleteId(plan.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                                <Trash2 size={16} className="text-destructive" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Eliminar plano</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </>
                )}
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground font-medium mb-1">
                {isIntern ? 'Ainda não tens planos atribuídos' : 'Nenhum plano encontrado'}
              </p>
              {isIntern && <p className="text-sm text-muted-foreground">O teu tutor irá atribuir-te um plano em breve.</p>}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
