import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, CheckCircle2, TrendingUp,
  Plus, Edit2, Eye, ClipboardList, BookOpen,
} from "lucide-react";

function StaffDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats } = trpc.dashboard.metrics.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Estagiários Ativos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats?.activeInterns || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Planos em Curso</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats?.activePlans || 0}</p>
            </div>
            <FileText className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Tarefas Pendentes</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats?.pendingTasks || 0}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{stats?.completionRate || 0}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </Card>
      </div>

      <Card className="p-6 border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button onClick={() => setLocation("/users")} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Users size={18} /> Gerir Utilizadores
          </Button>
          <Button onClick={() => setLocation("/plans")} variant="outline" className="gap-2">
            <FileText size={18} /> Ver Planos
          </Button>
          <Button onClick={() => setLocation("/plans")} variant="outline" className="gap-2">
            <Plus size={18} /> Novo Plano
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Planos Recentes</h2>
          <Button size="sm" variant="outline" onClick={() => setLocation("/plans")}>Ver Todos</Button>
        </div>
        {plans && plans.length > 0 ? (
          <div className="space-y-3">
            {plans.slice(0, 5).map((plan: any) => (
              <div key={plan.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{plan.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{plan.description}</p>
                  <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${plan.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"}`}>
                    {plan.status === "active" ? "Ativo" : plan.status === "completed" ? "Concluído" : "Rascunho"}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setLocation(`/plans/${plan.id}`)}>
                  <Eye size={16} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum plano criado ainda</p>
            <Button onClick={() => setLocation("/plans")} className="gap-2"><Plus size={18} /> Criar Primeiro Plano</Button>
          </div>
        )}
      </Card>

      <Card className="p-6 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Utilizadores Recentes</h2>
          <Button size="sm" variant="outline" onClick={() => setLocation("/users")}>Ver Todos</Button>
        </div>
        {users && users.length > 0 ? (
          <div className="space-y-2">
            {users.slice(0, 5).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  u.role === "admin" ? "bg-purple-100 text-purple-700"
                  : u.role === "tutor" ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
                }`}>
                  {u.role === "admin" ? "Admin" : u.role === "tutor" ? "Tutor" : "Estagiário"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum utilizador registado</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function InternDashboard() {
  const [, setLocation] = useLocation();
  const { data: progress } = trpc.dashboard.myProgress.useQuery();
  const { data: myPlans } = trpc.plans.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Planos Atribuídos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{progress?.assignedPlans ?? 0}</p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Tarefas Concluídas</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {progress?.completedTasks ?? 0}
                <span className="text-lg font-normal text-slate-500">/{progress?.totalTasks ?? 0}</span>
              </p>
            </div>
            <ClipboardList className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Progresso Global</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{progress?.completionRate ?? 0}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>
      </div>

      {progress && progress.totalTasks > 0 && (
        <Card className="p-6 border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Progresso do Estágio</h2>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress.completionRate}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {progress.completedTasks} de {progress.totalTasks} tarefas concluídas
          </p>
        </Card>
      )}

      <Card className="p-6 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Os Meus Planos</h2>
          <Button size="sm" variant="outline" onClick={() => setLocation("/plans")}>Ver Todos</Button>
        </div>
        {myPlans && myPlans.length > 0 ? (
          <div className="space-y-3">
            {myPlans.slice(0, 5).map((plan: any) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors cursor-pointer"
                onClick={() => setLocation(`/plans/${plan.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{plan.title}</p>
                  {plan.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{plan.description}</p>}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    plan.status === "active" ? "bg-green-100 text-green-700"
                    : plan.status === "completed" ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-700"
                  }`}>
                    {plan.status === "active" ? "Ativo" : plan.status === "completed" ? "Concluído" : "Rascunho"}
                  </span>
                  <Eye size={16} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <BookOpen size={40} className="text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-medium">Ainda não tens planos atribuídos</p>
            <p className="text-sm text-muted-foreground mt-1">O teu tutor irá atribuir-te um plano em breve.</p>
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
