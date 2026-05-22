import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, FileText, CheckCircle2, Link2,
  Activity, RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  user_created: {
    label: 'Utilizador Criado',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <UserPlus size={16} />,
  },
  plan_created: {
    label: 'Plano Criado',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <FileText size={16} />,
  },
  plan_assigned: {
    label: 'Plano Atribuído',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    icon: <Link2 size={16} />,
  },
  task_status_changed: {
    label: 'Tarefa Atualizada',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    icon: <CheckCircle2 size={16} />,
  },
};

function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return d.toLocaleDateString('pt-PT');
}

export default function ActivityLog() {
  const { data: log, isLoading, refetch, isFetching } = trpc.dashboard.activityLog.useQuery(
    { limit: 80 },
    { refetchInterval: 30000 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="text-primary" /> Registo de Atividade
            </h1>
            <p className="text-muted-foreground mt-1">Histórico das últimas ações no sistema</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCcw size={15} className={isFetching ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : !log || log.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity size={40} className="mb-3 opacity-30" />
              <p className="font-medium">Nenhuma atividade registada ainda</p>
              <p className="text-sm mt-1">As ações aparecerão aqui à medida que acontecem</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {log.map((entry) => {
                const config = ACTION_CONFIG[entry.action] ?? {
                  label: entry.action,
                  color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                  icon: <Activity size={16} />,
                };
                return (
                  <li key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                    <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{entry.userName}</span>
                        <Badge variant="secondary" className={`text-xs px-2 py-0 ${config.color}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{entry.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-1 flex-shrink-0">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
