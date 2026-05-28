import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, CheckCircle2, TrendingUp,
  ArrowRight, AlertCircle, Calendar, Clock,
  Flame, Star, Target, ChevronRight, Sun,
  BookOpen, Zap, CheckSquare, MessageCircle, Bot,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getUrgencyInfo(dueDateStr?: string | null): {
  label: string; color: string; bg: string; urgent: boolean;
} {
  if (!dueDateStr) return { label: "", color: "", bg: "", urgent: false };
  const due = typeof dueDateStr === "string" ? parseISO(dueDateStr) : new Date(dueDateStr);
  const diff = differenceInDays(due, new Date());

  if (isPast(due)) return { label: "Em atraso!", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", urgent: true };
  if (isToday(due)) return { label: "Hoje", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800", urgent: true };
  if (isTomorrow(due)) return { label: "Amanhã", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", urgent: true };
  if (diff <= 3) return { label: `${diff} dias`, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800", urgent: false };
  return { label: format(due, "d MMM", { locale: pt }), color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700", urgent: false };
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; badge: string }> = {
    blue:   { bg: "from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/20",   icon: "text-blue-500",   badge: "bg-blue-500/10 border-blue-200 dark:border-blue-800" },
    green:  { bg: "from-green-50 to-green-100/60 dark:from-green-950/40 dark:to-green-900/20", icon: "text-green-500", badge: "bg-green-500/10 border-green-200 dark:border-green-800" },
    orange: { bg: "from-orange-50 to-orange-100/60 dark:from-orange-950/40 dark:to-orange-900/20", icon: "text-orange-500", badge: "bg-orange-500/10 border-orange-200 dark:border-orange-800" },
    purple: { bg: "from-purple-50 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/20", icon: "text-purple-500", badge: "bg-purple-500/10 border-purple-200 dark:border-purple-800" },
    red:    { bg: "from-red-50 to-red-100/60 dark:from-red-950/40 dark:to-red-900/20", icon: "text-red-500", badge: "bg-red-500/10 border-red-200 dark:border-red-800" },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <Card className={`p-6 bg-gradient-to-br ${c.bg} border-0 ring-1 ring-slate-200/80 dark:ring-slate-700/50`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${c.badge}`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
    </Card>
  );
}

function PlanStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    draft:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    archived:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  const labels: Record<string, string> = { active: "Ativo", completed: "Concluído", draft: "Rascunho", archived: "Arquivado" };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${map[status] || map.draft}`}>
      {labels[status] || status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin:      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    tutor:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    estagiario: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  const labels: Record<string, string> = { admin: "Admin", tutor: "Tutor", estagiario: "Estagiário" };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${map[role] || ""}`}>
      {labels[role] || role}
    </span>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2">
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, color, iconBg, iconColor, onClick }: {
  icon: any; label: string; color: string; iconBg: string; iconColor: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-gradient-to-br ${color} hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all`}>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon size={18} className={iconColor} />
      </div>
      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
    </button>
  );
}

// ─── Staff Dashboard ──────────────────────────────────────────────────────────

function StaffDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats } = trpc.dashboard.metrics.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const recentPlans = (plans || []).slice(0, 4);
  const recentUsers = (users || []).slice(0, 5);

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Estagiários Ativos" value={stats?.activeInterns || 0} icon={Users} color="blue" />
        <StatCard label="Planos em Curso" value={stats?.activePlans || 0} icon={FileText} color="green" />
        <StatCard label="Tarefas Pendentes" value={stats?.pendingTasks || 0} icon={AlertCircle} color="orange" />
        <StatCard label="Taxa de Conclusão" value={`${stats?.completionRate || 0}%`} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionHeader title="Planos Recentes" action="Ver todos" onAction={() => setLocation("/plans")} />
          {recentPlans.length > 0 ? (
            <div className="space-y-2">
              {recentPlans.map((plan: any) => (
                <div
                  key={plan.id}
                  onClick={() => setLocation(`/plans/${plan.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{plan.title}</p>
                      {plan.description && <p className="text-xs text-slate-400 truncate">{plan.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <PlanStatusBadge status={plan.status} />
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum plano criado ainda</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <SectionHeader title="Utilizadores" action="Ver todos" onAction={() => setLocation("/users")} />
          {recentUsers.length > 0 ? (
            <div className="space-y-2">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-transparent">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden">
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          : <span className="text-white text-xs font-bold">{(u.name || "?")[0].toUpperCase()}</span>
                        }
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                        u.presence === "online" ? "bg-green-500" :
                        u.presence === "ausente" ? "bg-yellow-400" : "bg-slate-400"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                      {u.position && <p className="text-xs text-slate-400 truncate">{u.position}</p>}
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum utilizador registado</p>
            </div>
          )}
        </Card>
      </div>

      {stats && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Progresso Geral</h2>
              <p className="text-xs text-slate-400 mt-0.5">Taxa de conclusão de todas as tarefas</p>
            </div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{stats.completionRate || 0}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.completionRate || 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">{stats.pendingTasks || 0} pendentes</span>
            <span className="text-xs text-slate-400">{stats.activePlans || 0} planos ativos</span>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Intern Dashboard ─────────────────────────────────────────────────────────

function InternDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: progress } = trpc.dashboard.myProgress.useQuery();
  const { data: myPlans } = trpc.plans.list.useQuery();
  const { data: allTasks } = trpc.tasks.listAll.useQuery();

  const { data: todayCheckin, refetch: refetchCheckin } = trpc.dailyCheckins.today.useQuery();
  const { data: streak } = trpc.dashboard.myStreak.useQuery();
  const { data: badges } = trpc.dashboard.myBadges.useQuery();
  const createCheckinMutation = trpc.dailyCheckins.create.useMutation();
  const [checkinMood, setCheckinMood] = useState<string | null>(null);
  const [checkinNote, setCheckinNote] = useState("");

  // Compute today's tasks and upcoming tasks
  const pendingTasks = (allTasks || []).filter((t: any) => t.status === "pending" || t.status === "in_progress");
  const todayTasks = pendingTasks.filter((t: any) => t.dueDate && isToday(typeof t.dueDate === "string" ? parseISO(t.dueDate) : new Date(t.dueDate)));
  const overdueTasks = pendingTasks.filter((t: any) => t.dueDate && isPast(typeof t.dueDate === "string" ? parseISO(t.dueDate) : new Date(t.dueDate)) && !isToday(typeof t.dueDate === "string" ? parseISO(t.dueDate) : new Date(t.dueDate)));

  // Upcoming tasks sorted by due date (next 7 days), excluding today/overdue
  const upcomingTasks = pendingTasks
    .filter((t: any) => {
      if (!t.dueDate) return false;
      const due = typeof t.dueDate === "string" ? parseISO(t.dueDate) : new Date(t.dueDate);
      return !isPast(due) && !isToday(due);
    })
    .sort((a: any, b: any) => {
      const da = typeof a.dueDate === "string" ? parseISO(a.dueDate) : new Date(a.dueDate);
      const db = typeof b.dueDate === "string" ? parseISO(b.dueDate) : new Date(b.dueDate);
      return da.getTime() - db.getTime();
    })
    .slice(0, 5);

  // Tasks with no due date
  const noDueTasks = pendingTasks.filter((t: any) => !t.dueDate).slice(0, 3);

  const completionRate = progress?.completionRate ?? 0;
  const totalTasks = progress?.totalTasks ?? 0;
  const completedTasks = progress?.completedTasks ?? 0;

  // What-to-do-today items = overdue + today tasks
  const todayItems = [...overdueTasks, ...todayTasks];

  return (
    <div className="space-y-6">

      {/* ── Welcome ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-medium opacity-80">
            <Sun size={16} />
            <span>{getGreeting()}, {user?.name?.split(" ")[0] || "Estagiário"}</span>
          </div>
          <p className="text-sm opacity-60 mt-0.5">{format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">Progresso global</span>
              <span className="font-bold">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
            </div>
            <div className="flex justify-between text-xs opacity-60 mt-1.5">
              <span>{completedTasks} tarefas concluídas</span>
              <span>{totalTasks} no total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Visão Geral (stat cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Planos Atribuídos" value={progress?.assignedPlans ?? 0} icon={BookOpen} color="blue" />
        <StatCard label="Tarefas Concluídas" value={completedTasks} icon={CheckCircle2} color="green" sub={`de ${totalTasks} no total`} />
        <StatCard label="Em Atraso" value={overdueTasks.length} icon={AlertCircle} color={overdueTasks.length > 0 ? "red" : "green"} sub={overdueTasks.length > 0 ? "Requerem atenção" : "Tudo em dia!"} />
      </div>

      {/* ── Atalhos Rápidos ── */}
      <Card className="p-5">
        <SectionHeader title="Atalhos Rápidos" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionButton icon={MessageCircle} label="Mensagens" color="from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800" iconBg="bg-blue-500/10" iconColor="text-blue-500" onClick={() => setLocation("/mensagens")} />
          <QuickActionButton icon={Calendar} label="Calendário" color="from-purple-50 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-800" iconBg="bg-purple-500/10" iconColor="text-purple-500" onClick={() => setLocation("/calendar")} />
          <QuickActionButton icon={CheckSquare} label="Tarefas" color="from-green-50 to-green-100/60 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800" iconBg="bg-green-500/10" iconColor="text-green-500" onClick={() => setLocation("/tasks")} />
          <QuickActionButton icon={Bot} label="Norte" color="from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800" iconBg="bg-amber-500/10" iconColor="text-amber-500" onClick={() => setLocation("/ai-assist")} />
        </div>
      </Card>

      {/* ── O que fazer hoje ── */}
      {todayItems.length > 0 ? (
        <Card className="p-6 border-2 border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <Flame size={16} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">O que fazer hoje</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{todayItems.length} tarefa{todayItems.length !== 1 ? "s" : ""} a tratar</p>
            </div>
          </div>
          <div className="space-y-2">
            {todayItems.map((task: any) => {
              const urg = getUrgencyInfo(task.dueDate);
              return (
                <div
                  key={task.id}
                  onClick={() => setLocation("/tasks")}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${urg.bg}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${urg.urgent ? "bg-red-100 dark:bg-red-900/40" : "bg-orange-100 dark:bg-orange-900/40"}`}>
                    <Target size={13} className={urg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{task.title}</p>
                    {task.description && <p className="text-xs text-slate-400 truncate">{task.description}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Clock size={11} className={urg.color} />
                    <span className={`text-xs font-bold ${urg.color}`}>{urg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30" onClick={() => setLocation("/tasks")}>
            <CheckSquare size={14} className="mr-1.5" />
            Ver todas as tarefas
          </Button>
        </Card>
      ) : noDueTasks.length > 0 ? (
        <Card className="p-5 border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3 mb-3">
            <Zap size={16} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tarefas sem prazo definido</p>
          </div>
          <div className="space-y-1.5">
            {noDueTasks.map((task: any) => (
              <div key={task.id} onClick={() => setLocation("/tasks")} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">{task.title}</p>
                <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center border-2 border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/10">
          <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">Tudo em dia!</p>
          <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-1">Não há tarefas urgentes neste momento.</p>
        </Card>
      )}

      {/* ── Check-in + Streak ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2">
          <SectionHeader title="Check-in Diário" />
          {todayCheckin ? (
            <div className="flex items-center gap-4 py-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
                {todayCheckin.mood === "great" ? "😄" : todayCheckin.mood === "good" ? "🙂" : todayCheckin.mood === "okay" ? "😐" : todayCheckin.mood === "bad" ? "😟" : "😢"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Check-in feito hoje</p>
                {todayCheckin.note && <p className="text-xs text-muted-foreground mt-0.5">{todayCheckin.note}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Como estás a sentir-te hoje?</p>
              <div className="flex gap-2">
                {(["great", "good", "okay", "bad", "terrible"] as const).map(mood => (
                  <button key={mood} onClick={() => setCheckinMood(mood)}
                    className={`flex-1 py-3 rounded-xl text-center text-lg transition-all border ${
                      checkinMood === mood ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-accent/30"
                    }`}
                    title={{ great: "Ótimo", good: "Bom", okay: "Ok", bad: "Mau", terrible: "Terrível" }[mood]}
                  >
                    <div className="text-xl mb-1">{mood === "great" ? "😄" : mood === "good" ? "🙂" : mood === "okay" ? "😐" : mood === "bad" ? "😟" : "😢"}</div>
                    <div className="text-[10px] font-medium text-muted-foreground">{{ great: "Ótimo", good: "Bom", okay: "Ok", bad: "Mau", terrible: "Terrível" }[mood]}</div>
                  </button>
                ))}
              </div>
              <textarea placeholder="Algo que queiras partilhar sobre o teu dia?" value={checkinNote} onChange={e => setCheckinNote(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
              <Button size="sm" disabled={!checkinMood || createCheckinMutation.isPending}
                onClick={async () => {
                  if (!checkinMood) return;
                  await createCheckinMutation.mutateAsync({ mood: checkinMood as any, note: checkinNote || undefined });
                  setCheckinMood(null); setCheckinNote(""); refetchCheckin();
                  toast.success("Check-in registado!");
                }}
              >{createCheckinMutation.isPending ? "A registar..." : "Registar Check-in"}</Button>
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col justify-center">
          <SectionHeader title="Sequência" />
          <div className="flex items-center gap-4 py-3">
            <div className="relative">
              <Flame size={40} className="text-orange-500" />
              <span className="absolute -top-1 -right-1 text-xs font-bold text-orange-600">{streak?.currentStreak || 0}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{streak?.currentStreak || 0} dias</p>
              <p className="text-xs text-muted-foreground">sequência atual</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recorde: {streak?.longestStreak || 0} dias</p>
            </div>
          </div>
          {badges && badges.length > 0 && (
            <div className="border-t border-border pt-3 mt-1">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Distintivos</p>
              <div className="flex flex-wrap gap-2">
                {badges.map((b: any) => (
                  <span key={b.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold" title={b.description}>
                    <Star size={10} className="fill-amber-500" /> {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Próximas Tarefas ── */}
      {upcomingTasks.length > 0 && (
        <Card className="p-6">
          <SectionHeader title="Próximas Tarefas" action="Ver todas" onAction={() => setLocation("/tasks")} />
          <div className="space-y-2">
            {upcomingTasks.map((task: any) => {
              const urg = getUrgencyInfo(task.dueDate);
              return (
                <div key={task.id} onClick={() => setLocation("/tasks")}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                    <CheckSquare size={14} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{task.title}</p>
                    {task.description && <p className="text-xs text-slate-400 truncate">{task.description}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 ml-2">
                    <Calendar size={11} className={urg.color} />
                    <span className={`text-xs font-semibold ${urg.color}`}>{urg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Linha do Tempo ── */}
      {myPlans && myPlans.length > 0 && (
        <Card className="p-6">
          <SectionHeader title="Linha do Tempo" action="Ver planos" onAction={() => setLocation("/plans")} />
          <div className="space-y-3">
            {myPlans.slice(0, 5).map((plan: any) => {
              const start = plan.startDate ? new Date(plan.startDate) : null;
              const end = plan.endDate ? new Date(plan.endDate) : null;
              const today = new Date();
              const totalDays = start && end ? Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 1;
              const elapsedDays = start ? Math.max(0, Math.min(totalDays, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 0;
              const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
              const taskCount = plan.tasks ? plan.tasks.filter((t: any) => t.status === "completed").length : 0;
              const totalTaskCount = plan.tasks ? plan.tasks.length : 0;
              return (
                <div key={plan.id} onClick={() => setLocation(`/plans/${plan.id}`)} className="cursor-pointer group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sm font-medium text-foreground truncate flex-1">{plan.title}</span>
                    <span className="text-xs text-muted-foreground">{start ? format(start, "d MMM") : "—"} → {end ? format(end, "d MMM") : "—"}</span>
                  </div>
                  <div className="relative h-8 rounded-lg bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary/40 to-primary/60 rounded-lg transition-all" style={{ width: `${progressPct}%` }} />
                    <div className="absolute inset-0 flex items-center px-3">
                      <div className="w-full h-1.5 rounded-full bg-background/40 overflow-hidden">
                        <div className="h-full bg-white/70 rounded-full" style={{ width: `${totalTaskCount > 0 ? (taskCount / totalTaskCount) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-end px-3">
                      <span className="text-xs font-semibold text-foreground/70">{taskCount}/{totalTaskCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Os Meus Planos ── */}
      <Card className="p-6">
        <SectionHeader title="Os Meus Planos" action="Ver todos" onAction={() => setLocation("/plans")} />
        {myPlans && myPlans.length > 0 ? (
          <div className="space-y-2">
            {myPlans.slice(0, 5).map((plan: any) => (
              <div key={plan.id} onClick={() => setLocation(`/plans/${plan.id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{plan.title}</p>
                    {plan.description && <p className="text-xs text-slate-400 truncate">{plan.description}</p>}
                  </div>
                </div>
                <PlanStatusBadge status={plan.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Ainda não tens planos atribuídos</p>
            <p className="text-xs text-slate-400 mt-1">O teu tutor irá atribuir-te um plano em breve.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const isIntern = user?.role === "estagiario";
  return (
    <DashboardLayout title="Portal de Estagiários SOCEM">
      {isIntern ? <InternDashboard /> : <StaffDashboard />}
    </DashboardLayout>
  );
}
