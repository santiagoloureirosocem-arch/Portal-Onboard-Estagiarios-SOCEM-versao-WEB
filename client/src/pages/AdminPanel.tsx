import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus, Pencil, Trash2, X, Check, Building2, Briefcase, Monitor, Bell, LayoutTemplate, Cpu, Send, Copy, Megaphone, Mail, Loader2, Shield, Server, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

type Tab = "empresas" | "departamentos" | "programas" | "templates" | "notifications" | "email" | "system";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "empresas", label: "Empresas", icon: Building2 },
  { key: "departamentos", label: "Departamentos", icon: Briefcase },
  { key: "programas", label: "Programas", icon: Monitor },
  { key: "templates", label: "Templates", icon: LayoutTemplate },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "email", label: "Email", icon: Mail },
  { key: "system", label: "Sistema", icon: Cpu },
];

const catIcon: Record<string, any> = { empresas: Building2, departamentos: Briefcase, programas: Monitor };
const catLabels: Record<string, string> = { empresas: "empresa", departamentos: "departamento", programas: "programa" };
const catArt: Record<string, string> = { empresas: "a", departamentos: "", programas: "" };

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("empresas");

  // Catalog data
  const { data: empresas, refetch: refetchEmpresas } = trpc.catalog.empresas.useQuery(undefined, { enabled: tab === "empresas" });
  const { data: departamentos, refetch: refetchDepts } = trpc.catalog.departamentos.useQuery(undefined, { enabled: tab === "departamentos" });
  const { data: programas, refetch: refetchProgramas } = trpc.catalog.programas.useQuery(undefined, { enabled: tab === "programas" });
  const { data: templates } = trpc.admin.planTemplates.useQuery(undefined, { enabled: tab === "templates" });
  const { data: health } = trpc.admin.systemHealth.useQuery(undefined, { enabled: tab === "system" });

  // Mutations
  const createEmpresa = trpc.catalog.createEmpresa.useMutation();
  const updateEmpresa = trpc.catalog.updateEmpresa.useMutation();
  const deleteEmpresa = trpc.catalog.deleteEmpresa.useMutation();
  const createDepartamento = trpc.catalog.createDepartamento.useMutation();
  const updateDepartamento = trpc.catalog.updateDepartamento.useMutation();
  const deleteDepartamento = trpc.catalog.deleteDepartamento.useMutation();
  const createPrograma = trpc.catalog.createPrograma.useMutation();
  const updatePrograma = trpc.catalog.updatePrograma.useMutation();
  const deletePrograma = trpc.catalog.deletePrograma.useMutation();
  const broadcast = trpc.admin.broadcastNotification.useMutation();
  const testEmail = trpc.admin.testEmail.useMutation();
  const { data: emailConfig, refetch: refetchEmailConfig } = trpc.admin.emailConfig.useQuery(undefined, { enabled: tab === "email" || tab === "system" });

  // Local state
  const [newNome, setNewNome] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [creatingPlan, setCreatingPlan] = useState<number | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [notifRole, setNotifRole] = useState("all");
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; error?: string | null } | null>(null);

  const refetchCatalog = () => {
    if (tab === "empresas") refetchEmpresas();
    else if (tab === "departamentos") refetchDepts();
    else refetchProgramas();
  };

  const addItem = async () => {
    if (!newNome.trim()) return;
    try {
      if (tab === "empresas") { await createEmpresa.mutateAsync({ nome: newNome.trim() }); refetchEmpresas(); }
      else if (tab === "departamentos") { await createDepartamento.mutateAsync({ nome: newNome.trim() }); refetchDepts(); }
      else { await createPrograma.mutateAsync({ nome: newNome.trim() }); refetchProgramas(); }
      setNewNome("");
      toast.success("Adicionado com sucesso");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao adicionar");
    }
  };

  const saveEdit = async (id: number) => {
    if (!editNome.trim()) return;
    try {
      if (tab === "empresas") { await updateEmpresa.mutateAsync({ id, nome: editNome.trim() }); refetchEmpresas(); }
      else if (tab === "departamentos") { await updateDepartamento.mutateAsync({ id, nome: editNome.trim() }); refetchDepts(); }
      else { await updatePrograma.mutateAsync({ id, nome: editNome.trim() }); refetchProgramas(); }
      setEditId(null);
      toast.success("Atualizado com sucesso");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar");
    }
  };

  const deleteItem = async (id: number) => {
    try {
      if (tab === "empresas") { await deleteEmpresa.mutateAsync({ id }); refetchEmpresas(); }
      else if (tab === "departamentos") { await deleteDepartamento.mutateAsync({ id }); refetchDepts(); }
      else { await deletePrograma.mutateAsync({ id }); refetchProgramas(); }
      toast.success("Eliminado com sucesso");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao eliminar");
    }
  };

  const sendBroadcast = async () => {
    if (!notifTitle.trim() || !notifMsg.trim()) return;
    try {
      const result = await broadcast.mutateAsync({
        title: notifTitle,
        message: notifMsg,
        role: notifRole === "all" ? undefined : (notifRole as any),
      });
      toast.success(`Notificação enviada para ${result.sent} utilizadores`);
      setNotifTitle("");
      setNotifMsg("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar");
    }
  };

  const createPlanFromTemplate = trpc.plans.createFromTemplate.useMutation();

  const createFromTemplate = async (templateId: number) => {
    if (!templateTitle.trim()) return;
    setCreatingPlan(templateId);
    try {
      await createPlanFromTemplate.mutateAsync({ templateId, title: templateTitle });
      toast.success("Plano criado a partir do template");
      setTemplateTitle("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar plano");
    } finally {
      setCreatingPlan(null);
    }
  };

  const catItems = tab === "empresas" ? empresas : tab === "departamentos" ? departamentos : programas;
  const Icon = catIcon[tab] ?? Building2;

  return (
    <DashboardLayout title="Administração">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => {
            const TI = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${tab === t.key ? "bg-red-600 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-red-300"}`}>
                <TI size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <Card className="p-5 border-slate-200 dark:border-slate-700">
          {/* Catalog tabs */}
          {(tab === "empresas" || tab === "departamentos" || tab === "programas") && (
            <>
              <div className="flex gap-2 mb-4">
                <input value={newNome} onChange={e => setNewNome(e.target.value)}
                  placeholder={`Nov${catArt[tab]} ${catLabels[tab]}`}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
                <button onClick={addItem} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center gap-1.5">
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {(!catItems || catItems.length === 0) ? (
                  <p className="text-center text-slate-400 text-sm py-8">Nenhum{catArt[tab]} {catLabels[tab]} encontrado{catArt[tab]}</p>
                ) : (
                  catItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 group">
                      <Icon size={16} className="text-slate-400 flex-shrink-0" />
                      {editId === item.id ? (
                        <>
                          <input value={editNome} onChange={e => setEditNome(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                            autoFocus
                          />
                          <button onClick={() => saveEdit(item.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><Check size={16} /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.nome}</span>
                          <button onClick={() => { setEditId(item.id); setEditNome(item.nome); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-all">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Templates tab */}
          {tab === "templates" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Cria novos planos a partir de templates existentes. Guarda um plano como template na página de Planos.</p>
              {(!templates || templates.length === 0) ? (
                <p className="text-center text-slate-400 text-sm py-8">Nenhum template disponível.</p>
              ) : (
                templates.map((t: any) => (
                  <div key={t.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</h3>
                    {t.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{t.description}</p>}
                    <div className="flex gap-2 mt-3">
                      <input
                        value={creatingPlan === t.id ? templateTitle : ""}
                        onChange={e => setTemplateTitle(e.target.value)}
                        placeholder="Título do novo plano"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                        onFocus={() => setCreatingPlan(t.id)}
                      />
                      {creatingPlan === t.id && (
                        <button onClick={() => createFromTemplate(t.id)}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-all flex items-center gap-1.5">
                          <Copy size={14} /> Criar Plano
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notifications tab */}
          {tab === "notifications" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Megaphone size={16} className="text-red-500" />
                Envia uma notificação para todos os utilizadores ou filtra por função.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                  placeholder="Título da notificação"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
                <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
                  placeholder="Corpo da mensagem..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destinatários</label>
                <select value={notifRole} onChange={e => setNotifRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40">
                  <option value="all">Todos os utilizadores</option>
                  <option value="estagiario">Apenas estagiários</option>
                  <option value="tutor">Apenas tutores</option>
                  <option value="admin">Apenas administradores</option>
                </select>
              </div>
              <button onClick={sendBroadcast} disabled={broadcast.isPending}
                className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <Send size={16} /> {broadcast.isPending ? "A enviar..." : "Enviar Notificação"}
              </button>
            </div>
          )}

          {/* Email tab */}
          {tab === "email" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Serviço", value: "SMTP Office 365", color: "text-emerald-600" },
                  { label: "Estado", value: emailConfig?.configured ? "Configurado" : "Nao configurado", color: emailConfig?.configured ? "text-emerald-600" : "text-red-600" },
                  { label: "Remetente", value: emailConfig?.senderEmail ?? "—" },
                  { label: "Utilizador", value: emailConfig?.smtpUserMasked ?? "—" },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.color ?? "text-slate-700 dark:text-slate-300"}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Testar envio de email</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={testEmailTo}
                    onChange={e => setTestEmailTo(e.target.value)}
                    placeholder="Destinatário (ex: email@socem.pt)"
                    type="email"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                  <button
                    onClick={async () => {
                      setTestEmailResult(null);
                      try {
                        const result = await testEmail.mutateAsync(testEmailTo ? { to: testEmailTo } : undefined);
                        setTestEmailResult(result);
                        if (result.ok) {
                          toast.success(`Email de teste enviado para ${testEmailTo || "informatica@socem.pt"}`);
                        } else {
                          toast.error(`Falha: ${result.error || "Erro desconhecido"}`);
                        }
                      } catch (err: any) {
                        toast.error(err?.message || "Erro ao testar email");
                      }
                    }}
                    disabled={testEmail.isPending}
                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                  >
                    {testEmail.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {testEmail.isPending ? "A enviar..." : "Enviar teste"}
                  </button>
                </div>
                {testEmailResult && (
                  <div className={`p-3 rounded-xl text-sm ${testEmailResult.ok ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"}`}>
                    {testEmailResult.ok ? "Email enviado com sucesso!" : `Erro: ${testEmailResult.error}`}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  onClick={() => refetchEmailConfig()}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Atualizar estado da configuração
                </button>
              </div>
            </div>
          )}

          {/* System tab */}
          {tab === "system" && (
            <div className="space-y-4">
              {health ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Uptime", value: `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` },
                    { label: "Memória", value: `${health.memoryMB} MB / ${health.memoryTotalMB} MB` },
                    { label: "Node.js", value: health.nodeVersion },
                    { label: "Plataforma", value: health.platform },
                    { label: "Base de Dados", value: health.databaseConnected ? "Conectada" : "Desconectada", color: health.databaseConnected ? "text-emerald-600" : "text-red-600" },
                    { label: "SMTP (Office 365)", value: (health as any).smtpReachable ? "Acessível" : "Inacessível", color: (health as any).smtpReachable ? "text-emerald-600" : "text-red-600" },
                    { label: "Email", value: emailConfig?.configured ? "SendGrid configurado" : "Não configurado", color: emailConfig?.configured ? "text-emerald-600" : "text-red-600" },
                    { label: "Utilizadores", value: health.totalUsers },
                    { label: "Planos Ativos", value: health.activePlans },
                    { label: "Total Planos", value: health.totalPlans },
                    { label: "Total Tarefas", value: health.totalTasks },
                    { label: "Tarefas Concluídas", value: `${health.completedTasks} (${health.totalTasks > 0 ? Math.round((health.completedTasks / health.totalTasks) * 100) : 0}%)` },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-xs text-slate-400 dark:text-slate-500">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.color ?? "text-slate-700 dark:text-slate-300"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 text-sm py-8">A carregar informações do sistema...</p>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <button
                  onClick={async () => {
                    setTestEmailResult(null);
                    try {
                      const result = await testEmail.mutateAsync();
                      setTestEmailResult(result);
                      if (result.ok) toast.success("Email de teste enviado! Verifica informatica@socem.pt");
                      else toast.error(`Falha: ${result.error || "Erro desconhecido"}`);
                    } catch (err: any) {
                      toast.error(err?.message || "Erro ao testar email");
                    }
                  }}
                  disabled={testEmail.isPending}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {testEmail.isPending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  {testEmail.isPending ? "A testar..." : "Testar envio de email"}
                </button>
                <button
                  onClick={() => { refetchEmailConfig(); }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Atualizar configuração de email
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
