import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Plus, Pencil, Trash2, X, Check, Lock, Building2, Briefcase, Monitor, LogOut, Bell, LayoutTemplate, Cpu, Send, Copy, ChevronRight, GraduationCap, Mail, Loader2, RefreshCw } from "lucide-react";

const API = (path: string, token: string, init?: RequestInit) =>
  fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-admin-pass": token, ...init?.headers },
  });

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

export default function AdminConfig() {
  const [, setLocation] = useLocation();
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("empresas");
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [newNome, setNewNome] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  // Broadcast
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [notifRole, setNotifRole] = useState("all");
  const [notifSending, setNotifSending] = useState(false);

  // System
  const [health, setHealth] = useState<any>(null);

  // Email
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; error?: string | null } | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // Template plan creation
  const [templateTitle, setTemplateTitle] = useState("");
  const [creatingPlan, setCreatingPlan] = useState<number | null>(null);

  useEffect(() => {
    if (!authed) return;
    API("/api/empresas", pass).then(r => r.json()).then(setEmpresas);
    API("/api/departamentos", pass).then(r => r.json()).then(setDepartamentos);
    API("/api/programas", pass).then(r => r.json()).then(setProgramas);
    API("/api/templates", pass).then(r => r.json()).then(setTemplates);
    API("/api/admin/health", pass).then(r => r.json()).then(setHealth);
    API("/api/admin/email-config", pass).then(r => r.json()).then(setEmailConfig);
  }, [authed, pass]);

  const handleLogin = () => {
    if (pass === "socem2026") {
      setShowSelector(true);
      setError("");
    } else {
      setError("Password incorreta");
    }
  };

  const addItem = async () => {
    if (!newNome.trim()) return;
    const ep = `/api/${tab}`;
    const res = await API(ep, pass, { method: "POST", body: JSON.stringify({ nome: newNome.trim() }) });
    if (res.ok) {
      const item = await res.json();
      if (tab === "empresas") setEmpresas(p => [...p, item]);
      else if (tab === "departamentos") setDepartamentos(p => [...p, item]);
      else setProgramas(p => [...p, item]);
      setNewNome("");
    }
  };

  const saveEdit = async (id: number) => {
    if (!editNome.trim()) return;
    const ep = `/api/${tab}/${id}`;
    const res = await API(ep, pass, { method: "PUT", body: JSON.stringify({ nome: editNome.trim() }) });
    if (res.ok) {
      const s = tab === "empresas" ? setEmpresas : tab === "departamentos" ? setDepartamentos : setProgramas;
      s((p: any[]) => p.map(e => e.id === id ? { ...e, nome: editNome.trim() } : e));
      setEditId(null);
    }
  };

  const deleteItem = async (id: number) => {
    const ep = `/api/${tab}/${id}`;
    const res = await API(ep, pass, { method: "DELETE" });
    if (res.ok) {
      const s = tab === "empresas" ? setEmpresas : tab === "departamentos" ? setDepartamentos : setProgramas;
      s((p: any[]) => p.filter(e => e.id !== id));
    }
  };

  const sendBroadcast = async () => {
    if (!notifTitle.trim() || !notifMsg.trim()) return;
    setNotifSending(true);
    setError("");
    try {
      const res = await API("/api/admin/broadcast", pass, {
        method: "POST",
        body: JSON.stringify({
          title: notifTitle,
          message: notifMsg,
          role: notifRole === "all" ? undefined : notifRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao enviar notificação");
        return;
      }
      setSuccessMsg(`Notificação enviada para ${data.sent} utilizadores`);
      setNotifTitle("");
      setNotifMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setError("Erro de rede ao enviar notificação");
    } finally {
      setNotifSending(false);
    }
  };

  const createFromTemplate = async (templateId: number) => {
    if (!templateTitle.trim()) return;
    setCreatingPlan(templateId);
    try {
      const res = await API("/api/templates/create-plan", pass, {
        method: "POST",
        body: JSON.stringify({ templateId, title: templateTitle }),
      });
      if (res.ok) {
        setSuccessMsg("Plano criado a partir do template");
        setTemplateTitle("");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch {
      setError("Erro ao criar plano");
    } finally {
      setCreatingPlan(null);
    }
  };

  // Catalog tab content
  const catItems = tab === "empresas" ? empresas : tab === "departamentos" ? departamentos : programas;
  const catIcon: Record<string, any> = { empresas: Building2, departamentos: Briefcase, programas: Monitor };
  const catLabels: Record<string, string> = { empresas: "empresa", departamentos: "departamento", programas: "programa" };
  const catArt: Record<string, string> = { empresas: "a", departamentos: "", programas: "" };
  const Icon = catIcon[tab] ?? Building2;

  if (!authed && !showSelector) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-6 shadow-xl">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5">
            ← Voltar
          </button>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-3 overflow-hidden">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Administração</h1>
            <p className="text-xs text-slate-400 mt-1">Introduz a password de administrador</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder="Password" onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all shadow-md">
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSelector && !authed) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Painel de Administração</h1>
            <p className="text-sm text-slate-500 mt-1">Seleciona o portal que pretendes gerir</p>
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => { setAuthed(true); setShowSelector(false); }}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-lg hover:shadow-xl hover:border-red-300 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Briefcase size={22} className="text-red-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-800 text-base">Portal de Novos Colaboradores</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Gerir empresas, departamentos, programas, templates, notificações e sistema</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-red-500 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setLocation("/dashboard")}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-5 shadow-lg hover:shadow-xl hover:border-red-300 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <GraduationCap size={22} className="text-red-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-800 text-base">Portal de Estagiários</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Dashboard, utilizadores, planos, tarefas, calendário e relatórios</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-red-500 transition-colors" />
              </div>
            </button>
          </div>

          <button
            onClick={() => { setShowSelector(false); setPass(""); }}
            className="w-full mt-4 py-3 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-red-600" />
            <h1 className="text-lg font-bold text-slate-900">Painel de Administração</h1>
          </div>
          <button onClick={() => { setAuthed(false); setShowSelector(false); setPass(""); setLocation("/"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <LogOut size={15} />
            Sair
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2">
            <Check size={16} /> {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <X size={16} /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {TABS.map(t => {
              const TI = t.icon;
              return (
                <button key={t.key} onClick={() => { setTab(t.key); setError(""); setSuccessMsg(""); }}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-all whitespace-nowrap ${tab === t.key ? "text-red-600 border-b-2 border-red-600" : "text-slate-400 hover:text-slate-600"}`}>
                  <TI size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {/* Catalog tabs (empresas/departamentos/programas) */}
            {(tab === "empresas" || tab === "departamentos" || tab === "programas") && (
              <>
                <div className="flex gap-2 mb-4">
                  <input value={newNome} onChange={e => setNewNome(e.target.value)}
                    placeholder={`Nov${catArt[tab]} ${catLabels[tab]}`}
                    onKeyDown={e => e.key === "Enter" && addItem()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
                  />
                  <button onClick={addItem} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md">
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {catItems.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">Nenhum{catArt[tab]} {catLabels[tab]} encontrado{catArt[tab]}</p>
                  )}
                  {catItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 group hover:bg-slate-100 transition-all">
                      <Icon size={16} className="text-slate-400 flex-shrink-0" />
                      {editId === item.id ? (
                        <>
                          <input value={editNome} onChange={e => setEditNome(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                            autoFocus
                          />
                          <button onClick={() => saveEdit(item.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"><Check size={16} /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-slate-700">{item.nome}</span>
                          <button onClick={() => { setEditId(item.id); setEditNome(item.nome); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Templates tab */}
            {tab === "templates" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Cria novos planos a partir de templates existentes.</p>
                {templates.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">Nenhum template disponível. Cria um plano e guarda-o como template.</p>
                ) : (
                  templates.map((t: any) => (
                    <div key={t.id} className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-800">{t.title}</h3>
                      {t.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{t.description}</p>}
                      <div className="flex gap-2 mt-3">
                        <input
                          value={creatingPlan === t.id ? templateTitle : ""}
                          onChange={e => setTemplateTitle(e.target.value)}
                          placeholder="Título do novo plano"
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
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
                <p className="text-sm text-slate-500">Envia uma notificação para todos os utilizadores ou filtra por função.</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                  <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                    placeholder="Título da notificação"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                  <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
                    placeholder="Corpo da mensagem..." rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destinatários</label>
                  <select value={notifRole} onChange={e => setNotifRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 bg-white">
                    <option value="all">Todos os utilizadores</option>
                    <option value="estagiario">Apenas estagiários</option>
                    <option value="tutor">Apenas tutores</option>
                    <option value="admin">Apenas administradores</option>
                  </select>
                </div>
                <button onClick={sendBroadcast} disabled={notifSending}
                  className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                  <Send size={16} /> {notifSending ? "A enviar..." : "Enviar Notificação"}
                </button>
              </div>
            )}

            {/* Email tab */}
            {tab === "email" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Serviço", value: "SendGrid", color: "text-emerald-600" },
                    { label: "Estado", value: emailConfig?.configured ? "Configurado" : "Não configurado", color: emailConfig?.configured ? "text-emerald-600" : "text-red-600" },
                    { label: "Remetente", value: emailConfig?.senderEmail ?? "—" },
                    { label: "API Key", value: emailConfig?.apiKeyMasked ?? "—" },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.color ?? "text-slate-700"}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Testar envio de email</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={testEmailTo}
                      onChange={e => setTestEmailTo(e.target.value)}
                      placeholder="Destinatário (ex: email@socem.pt)"
                      type="email"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    />
                    <button
                      onClick={async () => {
                        setTestEmailLoading(true);
                        setTestEmailResult(null);
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 25000);
                        try {
                          const res = await fetch("/api/admin/test-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "x-admin-pass": pass },
                            body: JSON.stringify({ to: testEmailTo || undefined }),
                            signal: controller.signal,
                          });
                          clearTimeout(timeoutId);
                          const data = await res.json();
                          setTestEmailResult(data);
                        } catch (err: any) {
                          clearTimeout(timeoutId);
                          if (err?.name === "AbortError") {
                            setTestEmailResult({ ok: false, error: "Timeout — o servidor demorou demasiado a responder" });
                          } else {
                            setTestEmailResult({ ok: false, error: "Erro de rede" });
                          }
                        } finally {
                          setTestEmailLoading(false);
                        }
                      }}
                      disabled={testEmailLoading}
                      className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                    >
                      {testEmailLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      {testEmailLoading ? "A enviar..." : "Testar"}
                    </button>
                  </div>
                  {testEmailResult && (
                    <div className={`p-3 rounded-xl text-sm ${testEmailResult.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                      {testEmailResult.ok ? "Email enviado com sucesso!" : `Erro: ${testEmailResult.error}`}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <button
                    onClick={() => API("/api/admin/email-config", pass).then(r => r.json()).then(setEmailConfig)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Atualizar estado
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
                      { label: "Utilizadores", value: health.totalUsers },
                      { label: "Planos Ativos", value: health.activePlans },
                      { label: "Total Planos", value: health.totalPlans },
                      { label: "Total Tarefas", value: health.totalTasks },
                      { label: "Tarefas Concluídas", value: `${health.completedTasks} (${health.totalTasks > 0 ? Math.round((health.completedTasks / health.totalTasks) * 100) : 0}%)` },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className={`text-sm font-semibold ${item.color ?? "text-slate-700"}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm py-8">A carregar informações do sistema...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
