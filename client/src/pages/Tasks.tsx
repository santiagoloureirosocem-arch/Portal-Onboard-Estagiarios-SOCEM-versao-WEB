import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  CheckCircle2, Clock, Circle, ChevronDown, ChevronRight,
  Eye, FileText, Plus, X, CalendarIcon, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

type TaskStatus = 'all' | 'pending' | 'in_progress' | 'completed';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluída',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Circle size={16} className="text-yellow-500" />,
  in_progress: <Clock size={16} className="text-blue-500" />,
  completed: <CheckCircle2 size={16} className="text-green-500" />,
};

function AddTaskForm({ planId, nextOrder, onSuccess, onCancel }: {
  planId: number; nextOrder: number; onSuccess: () => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const createTaskMutation = trpc.tasks.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTaskMutation.mutateAsync({
        planId, title: title.trim(),
        description: description.trim() || undefined,
        order: nextOrder,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      toast.success('Tarefa criada com sucesso!');
      onSuccess();
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/30">
      <div className="space-y-3">
        <Input placeholder="Título da tarefa *" value={title} onChange={e => setTitle(e.target.value)} required autoFocus className="bg-background" />
        <textarea placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex items-center gap-2 flex-1">
          <CalendarIcon size={14} className="text-muted-foreground shrink-0" />
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="gap-1.5" disabled={createTaskMutation.isPending}>
            <Plus size={14} />{createTaskMutation.isPending ? 'A criar...' : 'Criar Tarefa'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="gap-1.5">
            <X size={14} />Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
}

function PlanTaskGroup({ plan, filterStatus, canEdit }: {
  plan: any; filterStatus: TaskStatus; canEdit: boolean;
}) {
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: planDetail, isLoading, refetch } = trpc.plans.getById.useQuery({ id: plan.id });
  const updateTaskMutation = trpc.tasks.update.useMutation();
  const deleteTaskMutation = trpc.tasks.delete.useMutation();

  const allTasks = planDetail?.tasks || [];
  const tasks = allTasks.filter((t: any) => filterStatus === 'all' || t.status === filterStatus);

  if (isLoading) {
    return <Card className="p-4"><div className="animate-pulse h-6 bg-muted rounded w-1/3" /></Card>;
  }

  const completedCount = allTasks.filter((t: any) => t.status === 'completed').length;
  const totalCount = allTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Staff: cycle through all statuses. Intern: only toggle pending ↔ completed.
  const handleStatusChange = async (task: any) => {
    let nextStatus: string;
    if (canEdit) {
      const cycle: Record<string, string> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
      nextStatus = cycle[task.status];
    } else {
      nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    }
    try {
      await updateTaskMutation.mutateAsync({ id: task.id, status: nextStatus as any });
      refetch();
    } catch {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('Eliminar esta tarefa?')) return;
    try {
      await deleteTaskMutation.mutateAsync({ id: taskId });
      toast.success('Tarefa eliminada');
      refetch();
    } catch {
      toast.error('Erro ao eliminar tarefa');
    }
  };

  if (tasks.length === 0 && !showAddForm && filterStatus !== 'all' && totalCount > 0) return null;
  if (tasks.length === 0 && !showAddForm && totalCount === 0 && !canEdit) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? <ChevronDown size={17} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={17} className="text-muted-foreground flex-shrink-0" />}
          <FileText size={17} className="text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{plan.title}</h3>
            <p className="text-xs text-muted-foreground">{totalCount} tarefa{totalCount !== 1 ? 's' : ''} · {progress}% concluído</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
          </div>
          {canEdit && (
            <button onClick={e => { e.stopPropagation(); setExpanded(true); setShowAddForm(v => !v); }}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors" title="Adicionar tarefa">
              <Plus size={15} />
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); setLocation(`/plans/${plan.id}`); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Ver plano">
            <Eye size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {tasks.length === 0 && !showAddForm ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                {filterStatus === 'all' ? 'Nenhuma tarefa neste plano.' : `Nenhuma tarefa com estado "${STATUS_LABELS[filterStatus]}".`}
              </p>
              {canEdit && filterStatus === 'all' && (
                <button onClick={() => setShowAddForm(true)} className="mt-2 text-sm text-primary hover:underline">
                  Adicionar primeira tarefa
                </button>
              )}
            </div>
          ) : (
            tasks.map((task: any, idx: number) => (
              <div key={task.id} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20 group ${idx > 0 ? 'border-t border-border/50' : ''}`}>
                {/* For interns: simple checkbox. For staff: cycle icon button */}
                {canEdit ? (
                  <button onClick={() => handleStatusChange(task)} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                    title={`${STATUS_LABELS[task.status]} — clique para avançar`}>
                    {STATUS_ICON[task.status as keyof typeof STATUS_ICON] || <Circle size={16} />}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(task)}
                    className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                    title={task.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluída'}
                  >
                    {task.status === 'completed'
                      ? <CheckCircle2 size={18} className="text-green-500" />
                      : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-green-400 transition-colors" />
                    }
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarIcon size={11} />{new Date(task.dueDate).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit ? (
                    <>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      <button onClick={() => handleDelete(task.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Eliminar tarefa">
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          {showAddForm && (
            <AddTaskForm planId={plan.id} nextOrder={totalCount + 1}
              onSuccess={() => { setShowAddForm(false); refetch(); }}
              onCancel={() => setShowAddForm(false)} />
          )}
        </div>
      )}
    </Card>
  );
}

export default function Tasks() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';
  const [filterStatus, setFilterStatus] = useState<TaskStatus>('all');
  const { data: plans, isLoading } = trpc.plans.list.useQuery();

  const filterButtons: { label: string; value: TaskStatus; icon: React.ReactNode }[] = [
    { label: 'Todas', value: 'all', icon: <Circle size={14} /> },
    { label: 'Pendentes', value: 'pending', icon: <Circle size={14} className="text-yellow-500" /> },
    { label: 'Em Progresso', value: 'in_progress', icon: <Clock size={14} className="text-blue-500" /> },
    { label: 'Concluídas', value: 'completed', icon: <CheckCircle2 size={14} className="text-green-500" /> },
  ];

  // Interns: hide "in_progress" filter since they only toggle pending/completed
  const visibleFilters = canEdit ? filterButtons : filterButtons.filter(b => b.value !== 'in_progress');

  return (
    <DashboardLayout title="Tarefas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tarefas</h1>
            <p className="text-muted-foreground mt-1">
              {canEdit ? 'Acompanhe e gira as tarefas de cada plano' : 'Marca as tuas tarefas à medida que as concluíres'}
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setLocation('/plans')} variant="outline" className="gap-2 self-start sm:self-auto">
              <FileText size={16} /> Gerir Planos
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleFilters.map(btn => (
            <button key={btn.value} onClick={() => setFilterStatus(btn.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === btn.value ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan: any) => (
              <PlanTaskGroup key={plan.id} plan={plan} filterStatus={filterStatus} canEdit={canEdit} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CheckCircle2 size={48} className="text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-foreground font-medium mb-1">
              {canEdit ? 'Nenhum plano encontrado' : 'Ainda não tens planos atribuídos'}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {canEdit ? 'Crie um plano para começar a adicionar tarefas' : 'O teu tutor irá atribuir-te um plano em breve.'}
            </p>
            {canEdit && (
              <Button onClick={() => setLocation('/plans')} className="gap-2">
                <FileText size={16} /> Criar Plano
              </Button>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
