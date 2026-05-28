import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Eye, Trash2, User, FileSpreadsheet, FileText as FilePDF, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

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

async function exportPlansToPDF(plans: any[]) {
  const { default: jsPDF } = await import("jspdf").catch(() => {
    throw new Error("jspdf não disponível");
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;

  // Header band
  doc.setFillColor(SOCEM_RED);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SOCEM — Portal de Estagiários", margin, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Planos de Integração — ${format(new Date(), "d 'de' MMMM yyyy", { locale: pt })}`, margin, 22);

  let y = 42;
  const pageWContent = pageW - 2 * margin;
  const cols = [
    { label: "#", w: 10 },
    { label: "Título", w: 72 },
    { label: "Estado", w: 22 },
    { label: "Descrição", w: 66 },
  ];

  // Table header
  doc.setFillColor(SOCEM_RED);
  doc.rect(margin, y, pageWContent, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let hx = margin;
  cols.forEach(c => { doc.text(c.label, hx + 2, y + 5.5); hx += c.w; });
  y += 8;

  const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", draft: "Rascunho", archived: "Arquivado" };

  plans.forEach((plan, idx) => {
    if (y > pageH - 25) { doc.addPage(); y = 20; }

    const bg = idx % 2 === 0 ? [255, 255, 255] : [250, 250, 252];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, y, pageWContent, 7.5, "F");
    doc.setDrawColor(230, 230, 230);
    doc.rect(margin, y, pageWContent, 7.5, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(SOCEM_DARK);

    const cells = [
      String(plan.id),
      plan.title,
      statusLabels[plan.status] ?? plan.status,
      plan.description
        ? (doc.splitTextToSize(plan.description.replace(/[#*_`>\-]/g, ""), cols[3].w - 4)[0] ?? "")
        : "—",
    ];
    let cx = margin;
    cells.forEach((txt, ci) => {
      doc.text(txt, cx + 2, y + 5);
      cx += cols[ci].w;
    });
    y += 7.5;
  });

  // Footer
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

  doc.save(`SOCEM_Planos_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
async function exportPlansToExcel(plans: any[]) {
  const XLSX = await import("xlsx").catch(() => { throw new Error("xlsx não disponível"); });

  const header = [["ID", "Título", "Estado", "Descrição", "Data de Início", "Data de Conclusão"]];
  const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", draft: "Rascunho", archived: "Arquivado" };
  const rows = plans.map((p: any) => [
    p.id,
    p.title,
    statusLabels[p.status] ?? p.status,
    p.description?.replace(/[#*_`>\-]/g, "").replace(/\n+/g, " ").trim() ?? "",
    p.startDate ? format(new Date(p.startDate), "dd/MM/yyyy") : "",
    p.endDate ? format(new Date(p.endDate), "dd/MM/yyyy") : "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws["!cols"] = [
    { wch: 8 }, { wch: 40 }, { wch: 14 }, { wch: 50 }, { wch: 16 }, { wch: 16 },
  ];

  const HEADER_FILL = { fgColor: { rgb: "CC0000" } };
  const HEADER_FONT = { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" };
  const BORDER_ALL = { style: "thin", color: { rgb: "D0D0D0" } };

  // Style headers
  ["A1", "B1", "C1", "D1", "E1", "F1"].forEach(ref => {
    const cell = ws[ref];
    if (cell) {
      cell.s = { font: HEADER_FONT, fill: HEADER_FILL, border: { top: BORDER_ALL, bottom: BORDER_ALL, left: BORDER_ALL, right: BORDER_ALL }, alignment: { horizontal: "center" } };
    }
  });

  // Style data rows
  for (let i = 0; i < rows.length; i++) {
    const isEven = i % 2 === 0;
    ["A", "B", "C", "D", "E", "F"].forEach((col, ci) => {
      const ref = XLSX.utils.encode_cell({ r: i + 1, c: ci });
      const cell = ws[ref];
      if (cell) {
        cell.s = {
          font: { sz: 9, name: "Calibri", color: { rgb: SOCEM_DARK.slice(1) } },
          border: { top: BORDER_ALL, bottom: BORDER_ALL, left: BORDER_ALL, right: BORDER_ALL },
          fill: isEven ? { fgColor: { rgb: "F8F8FA" } } : { fgColor: { rgb: "FFFFFF" } },
        };
      }
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planos");
  XLSX.writeFile(wb, `SOCEM_Planos_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
}

export default function Plans() {
  const { user } = useAuth();
  const isIntern = user?.role === 'estagiario';
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';

  const { data: plans, isLoading, refetch } = trpc.plans.list.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery(undefined, { enabled: canEdit });
  const createPlanMutation = trpc.plans.create.useMutation();
  const updatePlanMutation = trpc.plans.update.useMutation();
  const deletePlanMutation = trpc.plans.delete.useMutation();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
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

  const handleExportPlans = async (type: "pdf" | "xlsx") => {
    if (!plans || plans.length === 0) { toast.error("Não há planos para exportar"); return; }
    setExporting(type);
    try {
      if (type === "pdf") await exportPlansToPDF(plans);
      else await exportPlansToExcel(plans);
      toast.success(`Planos exportados como ${type.toUpperCase()}`);
    } catch {
      toast.error("Erro ao exportar planos");
    } finally {
      setExporting(null);
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
              onClick={() => handleExportPlans("xlsx")}
              disabled={exporting !== null || !plans || plans.length === 0}
            >
              {exporting === "xlsx" ? <Loader className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              onClick={() => handleExportPlans("pdf")}
              disabled={exporting !== null || !plans || plans.length === 0}
            >
              {exporting === "pdf" ? <Loader className="h-4 w-4 animate-spin" /> : <FilePDF className="h-4 w-4" />}
              PDF
            </Button>
            {canEdit && (
              <>
                <Button onClick={() => setLocation("/assign-plan")} variant="outline" className="gap-2">
                  <User size={18} /> Atribuir Plano
                </Button>
                <Button onClick={() => {
                  setShowForm(!showForm);
                  if (showForm) { setEditingId(null); setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null, startDate: '', endDate: '' }); }
                }} className="gap-2">
                  <Plus size={20} /> Novo Plano
                </Button>
              </>
            )}
          </div>
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
                    <div className={`flex gap-2 pt-4 border-t border-border ${isIntern ? '' : ''}`}>
                      <button onClick={() => setLocation(`/plans/${plan.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Eye size={16} /> Ver
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => handleEdit(plan)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
                            <Edit2 size={16} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => setConfirmDeleteId(plan.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 size={16} className="text-destructive" />
                          </button>
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
