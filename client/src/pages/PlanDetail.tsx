import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

// ── Markdown renderer simples ─────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-foreground mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-6 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet lists (lines starting with * or -)
    .replace(/^[\*\-] (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[\s\S]*?<\/li>)(\n<li)/g, '$1$2')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>)+/g, '<ul class="space-y-1 my-2">$&</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted-foreground">$1</li>')
    // Paragraphs — wrap plain lines (not already HTML) in <p>
    .replace(/^(?!<[a-z])(.+)$/gm, '<p class="text-muted-foreground leading-relaxed">$1</p>')
    // Clean up empty lines between block elements
    .replace(/\n{2,}/g, '\n');
}

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div
      className="prose-sm max-w-none space-y-1"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanDetail() {
  const [, params] = useRoute('/plans/:id');
  const [, setLocation] = useLocation();
  const planId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';

  const { data: plan, isLoading, refetch } = trpc.plans.getById.useQuery({ id: planId }, { enabled: !!planId });
  const { data: assignments } = trpc.assignments.getByPlanId.useQuery({ planId }, { enabled: !!planId });

  const createTaskMutation = trpc.tasks.create.useMutation();
  const updateTaskMutation = trpc.tasks.update.useMutation();
  const deleteTaskMutation = trpc.tasks.delete.useMutation();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTaskMutation.mutateAsync({
        planId,
        title: taskForm.title,
        description: taskForm.description,
        order: (plan?.tasks?.length || 0) + 1,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
      });
      toast.success('Tarefa criada com sucesso');
      setTaskForm({ title: '', description: '', dueDate: '' });
      setShowTaskForm(false);
      refetch();
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await updateTaskMutation.mutateAsync({ id: taskId, status: 'completed' });
      toast.success('Tarefa marcada como concluída');
      refetch();
    } catch {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTaskMutation.mutateAsync({ id: taskId });
      toast.success('Tarefa eliminada');
      setConfirmDeleteTaskId(null);
      refetch();
    } catch {
      toast.error('Erro ao eliminar tarefa');
    }
  };

  if (isLoading) {
    return <DashboardLayout title="Detalhes do Plano"><div className="text-center py-8"><p className="text-muted-foreground">Carregando plano...</p></div></DashboardLayout>;
  }

  if (!plan) {
    return (
      <DashboardLayout title="Detalhes do Plano">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Plano não encontrado</p>
          <Button onClick={() => setLocation('/plans')} className="mt-4">Voltar aos Planos</Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedTasks = plan.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const totalTasks = plan.tasks?.length || 0;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    draft: 'bg-muted text-muted-foreground',
    completed: 'bg-blue-500/10 text-blue-500',
    archived: 'bg-red-500/10 text-red-500',
  };
  const statusLabels: Record<string, string> = { active: 'Ativo', draft: 'Rascunho', completed: 'Concluído', archived: 'Arquivado' };

  return (
    <DashboardLayout title={plan.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation('/plans')} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{plan.title}</h1>
            <div className="mt-2">
              <MarkdownRenderer content={plan.description || ''} />
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[plan.status] || statusColors.draft}`}>
            {statusLabels[plan.status] || plan.status}
          </span>
        </div>

        {/* Progress */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Progresso Geral</h2>
              <span className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-foreground">{completedTasks} concluídas</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-500" />
                <span className="text-foreground">{totalTasks - completedTasks} pendentes</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Assignments */}
        {assignments && assignments.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Atribuições ({assignments.length})</h2>
            <div className="space-y-2">
              {assignments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{a.userName ?? `Utilizador #${a.userId}`}</p>
                    <p className="text-sm text-muted-foreground">Progresso: {Math.round(progressPercent)}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    {a.status === 'active' ? 'Ativo' : 'Concluído'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tasks */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-foreground">Tarefas ({totalTasks})</h2>
            {canEdit && (
              <Button onClick={() => setShowTaskForm(!showTaskForm)} className="gap-2" size="sm">
                <Plus size={16} /> Nova Tarefa
              </Button>
            )}
          </div>

          {showTaskForm && (
            <form onSubmit={handleAddTask} className="mb-6 p-4 bg-muted/50 rounded-lg space-y-3">
              <Input
                placeholder="Título da Tarefa"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                rows={3}
              />
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Criar Tarefa</Button>
                <Button type="button" variant="outline" onClick={() => setShowTaskForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          {plan.tasks && plan.tasks.length > 0 ? (
            <div className="space-y-3">
              {plan.tasks.map((task: any, index: number) => (
                <div key={task.id} className="p-4 bg-muted/50 rounded-lg">
                  {confirmDeleteTaskId === task.id ? (
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-foreground text-sm">Eliminar "{task.title}"?</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteTask(task.id)}>Eliminar</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteTaskId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            task.status === 'in_progress' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {task.status === 'completed' ? 'Concluída' : task.status === 'in_progress' ? 'Em Progresso' : 'Pendente'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground">{task.title}</h4>
                        {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                        {task.dueDate && <p className="text-xs text-muted-foreground mt-2">Prazo: {new Date(task.dueDate).toLocaleDateString('pt-PT')}</p>}
                      </div>
                      <div className="flex gap-1">
                        {task.status !== 'completed' && (
                          <button onClick={() => handleCompleteTask(task.id)} className="p-2 hover:bg-green-500/10 rounded-lg transition-colors" title="Marcar como concluída">
                            <CheckCircle size={18} className="text-green-500" />
                          </button>
                        )}
                        <button onClick={() => setConfirmDeleteTaskId(task.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" title="Eliminar tarefa">
                          <Trash2 size={18} className="text-destructive" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma tarefa criada ainda. Clica em "Nova Tarefa" para começar.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
