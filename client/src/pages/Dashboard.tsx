import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, CheckCircle2, TrendingUp,
  Eye, ClipboardList, BookOpen, ArrowRight,
  Clock, AlertCircle, Calendar,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; badge: string }> = {
    blue:   { bg: "from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/20",   icon: "text-blue-500",   badge: "bg-blue-500/10 border-blue-200 dark:border-blue-800" },
    green:  { bg: "from-green-50 to-green-100/60 dark:from-green-950/40 dark:to-green-900/20", icon: "text-green-500", badge: "bg-green-500/10 border-green-200 dark:border-green-800" },
    orange: { bg: "from-orange-50 to-orange-100/60 dark:from-orange-950/40 dark:to-orange-900/20", icon: "text-orange-500", badge: "bg-orange-500/10 border-orange-200 dark:border-orange-800" },
    purple: { bg: "from-purple-50 to-purple-100/60 dark:from-purple-950/40 dark:to-purple-900/20", icon: "text-purple-500", badge: "bg-purple-500/10 border-purple-200 dark:border-purple-800" },
  };
  const c = colors[color];
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

function StaffDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: stats } = trpc.dashboard.metrics.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const pendingUsers = (users || []).filter((u: any) => u.isActive);
  const recentPlans = (plans || []).slice(0, 4);
  const recentUsers = (users || []).slice(0, 5);

  return (
    <div className="space-y-7">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Estagiários Ativos" value={stats?.activeInterns || 0} icon={Users} color="blue" />
        <StatCard label="Planos em Curso" value={stats?.activePlans || 0} icon={FileText} color="green" />
        <StatCard label="Tarefas Pendentes" value={stats?.pendingTasks || 0} icon={AlertCircle} color="orange" />
        <StatCard label="Taxa de Conclusão" value={`${stats?.completionRate || 0}%`} icon={TrendingUp} color="purple" />
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Planos Recentes */}
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

        {/* Utilizadores Recentes */}
        <Card className="p-6">
          <SectionHeader title="Utilizadores" action="Ver todos" onAction={() => setLocation("/users")} />
          {recentUsers.length > 0 ? (
            <div className="space-y-2">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-transparent">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{(u.name || "?")[0].toUpperCase()}</span>
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

      {/* Completion rate bar */}
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

function InternDashboard() {
  const [, setLocation] = useLocation();
  const { data: progress } = trpc.dashboard.myProgress.useQuery();
  const { data: myPlans } = trpc.plans.list.useQuery();

  return (
    <div className="space-y-7">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Planos Atribuídos" value={progress?.assignedPlans ?? 0} icon={BookOpen} color="blue" />
        <StatCard
          label="Tarefas Concluídas"
          value={progress?.completedTasks ?? 0}
          icon={CheckCircle2}
          color="green"
          sub={`de ${progress?.totalTasks ?? 0} no total`}
        />
        <StatCard label="Progresso Global" value={`${progress?.completionRate ?? 0}%`} icon={TrendingUp} color="purple" />
      </div>

      {/* Progress bar */}
      {progress && progress.totalTasks > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Progresso do Estágio</h2>
              <p className="text-xs text-slate-400 mt-0.5">{progress.completedTasks} de {progress.totalTasks} tarefas concluídas</p>
            </div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{progress.completionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700"
              style={{ width: `${progress.completionRate}%` }}
            />
          </div>
        </Card>
      )}

      {/* Plans */}
      <Card className="p-6">
        <SectionHeader title="Os Meus Planos" action="Ver todos" onAction={() => setLocation("/plans")} />
        {myPlans && myPlans.length > 0 ? (
          <div className="space-y-2">
            {myPlans.slice(0, 5).map((plan: any) => (
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

export default function Dashboard() {
  const { user } = useAuth();
  const isIntern = user?.role === "estagiario";
  return (
    <DashboardLayout title="Portal de Estagiários SOCEM">
      {isIntern ? <InternDashboard /> : <StaffDashboard />}
    </DashboardLayout>
  );
}
