import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, CheckCircle2, ClipboardList, AlertCircle, CheckSquare, Circle, Loader } from "lucide-react";

export default function Reports() {
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const { data: allTasks } = trpc.tasks.listAll.useQuery();

  const totalPlans = plans?.length ?? 0;
  const activePlans = plans?.filter((p: any) => p.status === 'active').length ?? 0;
  const draftPlans = plans?.filter((p: any) => p.status === 'draft').length ?? 0;
  const completedPlans = plans?.filter((p: any) => p.status === 'completed').length ?? 0;

  const totalUsers = users?.length ?? 0;
  const adminUsers = users?.filter((u: any) => u.role === 'admin').length ?? 0;
  const regularUsers = users?.filter((u: any) => u.role === 'estagiario').length ?? 0;

  const totalTasks = allTasks?.length ?? 0;
  const completedTasks = allTasks?.filter((t: any) => t.status === 'completed') ?? [];
  const inProgressTasks = allTasks?.filter((t: any) => t.status === 'in_progress') ?? [];
  const pendingTasks = allTasks?.filter((t: any) => t.status === 'pending') ?? [];

  const statCards = [
    {
      label: 'Estagiários Ativos',
      value: metrics?.activeInterns ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Planos Ativos',
      value: metrics?.activePlans ?? 0,
      icon: ClipboardList,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Tarefas Pendentes',
      value: metrics?.pendingTasks ?? 0,
      icon: AlertCircle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Planos Concluídos',
      value: completedPlans,
      icon: CheckCircle2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  const taskStatusMeta = [
    { label: 'Concluídas', tasks: completedTasks, color: 'bg-green-500', dot: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
    { label: 'Em Progresso', tasks: inProgressTasks, color: 'bg-orange-400', dot: 'bg-orange-400', textColor: 'text-orange-600 dark:text-orange-400', icon: Loader },
    { label: 'Pendentes', tasks: pendingTasks, color: 'bg-muted-foreground', dot: 'bg-slate-400', textColor: 'text-slate-500', icon: Circle },
  ];

  return (
    <DashboardLayout title="Relatórios - Portal SOCEM">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Estatísticas reais do sistema</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isLoading ? '—' : s.value}
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
                  { label: 'Ativos', count: activePlans, color: 'bg-green-500' },
                  { label: 'Rascunhos', count: draftPlans, color: 'bg-muted-foreground' },
                  { label: 'Concluídos', count: completedPlans, color: 'bg-blue-500' },
                  { label: 'Arquivados', count: plans?.filter((p: any) => p.status === 'archived').length ?? 0, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.count} / {totalPlans}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: totalPlans > 0 ? `${(item.count / totalPlans) * 100}%` : '0%' }}
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
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">Total de Utilizadores</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{totalUsers}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-foreground font-medium">Estagiários</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{regularUsers}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-foreground font-medium">Administradores</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{adminUsers}</span>
                </div>
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
              {/* Summary bars */}
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
                        style={{ width: totalTasks > 0 ? `${(tasks.length / totalTasks) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed tasks list */}
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
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In progress tasks list */}
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
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending tasks list */}
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
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                          )}
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
                    plan.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    plan.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                    plan.status === 'archived' ? 'bg-red-500/10 text-red-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {plan.status === 'active' ? 'Ativo' : plan.status === 'completed' ? 'Concluído' : plan.status === 'archived' ? 'Arquivado' : 'Rascunho'}
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

export default function Reports() {
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const totalPlans = plans?.length ?? 0;
  const activePlans = plans?.filter((p: any) => p.status === 'active').length ?? 0;
  const draftPlans = plans?.filter((p: any) => p.status === 'draft').length ?? 0;
  const completedPlans = plans?.filter((p: any) => p.status === 'completed').length ?? 0;

  const totalUsers = users?.length ?? 0;
  const adminUsers = users?.filter((u: any) => u.role === 'admin').length ?? 0;
  const regularUsers = users?.filter((u: any) => u.role === 'estagiario').length ?? 0;

  const statCards = [
    {
      label: 'Estagiários Ativos',
      value: metrics?.activeInterns ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Planos Ativos',
      value: metrics?.activePlans ?? 0,
      icon: ClipboardList,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Tarefas Pendentes',
      value: metrics?.pendingTasks ?? 0,
      icon: AlertCircle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Planos Concluídos',
      value: completedPlans,
      icon: CheckCircle2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <DashboardLayout title="Relatórios - Portal SOCEM">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Estatísticas reais do sistema</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isLoading ? '—' : s.value}
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
                  { label: 'Ativos', count: activePlans, color: 'bg-green-500' },
                  { label: 'Rascunhos', count: draftPlans, color: 'bg-muted-foreground' },
                  { label: 'Concluídos', count: completedPlans, color: 'bg-blue-500' },
                  { label: 'Arquivados', count: plans?.filter((p: any) => p.status === 'archived').length ?? 0, color: 'bg-red-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.count} / {totalPlans}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{ width: totalPlans > 0 ? `${(item.count / totalPlans) * 100}%` : '0%' }}
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
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">Total de Utilizadores</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{totalUsers}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-foreground font-medium">Estagiários</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{regularUsers}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-foreground font-medium">Administradores</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{adminUsers}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Plans list */}
        {plans && plans.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Lista de Planos</h3>
            <div className="space-y-2">
              {plans.map((plan: any) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">{plan.title}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-green-500/10 text-green-500' :
                    plan.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                    plan.status === 'archived' ? 'bg-red-500/10 text-red-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {plan.status === 'active' ? 'Ativo' : plan.status === 'completed' ? 'Concluído' : plan.status === 'archived' ? 'Arquivado' : 'Rascunho'}
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
