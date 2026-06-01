import React, { useState, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Plus, CheckCircle, Clock, Circle, Trash2,
  X, LayoutGrid, List, ChevronRight, FileText, Upload, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-foreground mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[\*\-] (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)(\n<li)/g, '$1$2')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>)+/g, '<ul class="space-y-1 my-2">$&</ul>')
    .replace(/^(?!<[a-z])(.+)$/gm, '<p class="text-muted-foreground leading-relaxed">$1</p>')
    .replace(/\n{2,}/g, '\n');
}

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;
  return <div className="prose-sm max-w-none space-y-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
}


// ── Kanban column ─────────────────────────────────────────────────────────────
// ── Kanban column ─────────────────────────────────────────────────────────────
const KANBAN_COLS = [
  { key: 'pending',     label: 'Pendente',     color: 'bg-yellow-500', light: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-200 dark:border-yellow-800' },
  { key: 'in_progress', label: 'Em Progresso', color: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-950/20',    border: 'border-blue-200 dark:border-blue-800' },
  { key: 'completed',   label: 'Concluída',    color: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-950/20',  border: 'border-green-200 dark:border-green-800' },
];

function KanbanView({ tasks, onStatusChange, onDelete, canEdit, onFileUpload, uploadingTaskId }: {
  tasks: any[];
  onStatusChange: (t: any, s: string) => void;
  onDelete: (id: number) => void; canEdit: boolean;
  onFileUpload?: (taskId: number) => void;
  uploadingTaskId?: number | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} className={`rounded-2xl border ${col.border} ${col.light} p-3 min-h-[200px]`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">{col.label}</span>
              <span className="ml-auto text-xs font-semibold text-muted-foreground bg-background rounded-full px-2 py-0.5 border border-border">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-background rounded-xl border border-border p-3 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <p className="text-sm font-medium text-foreground leading-snug mb-2">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {task.startDate && (
                        <span className="text-xs text-teal-500 flex items-center gap-1">
                          <Clock size={10} />{new Date(task.startDate).toLocaleDateString('pt-PT')}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />{new Date(task.dueDate).toLocaleDateString('pt-PT')}
                        </span>
                      )}
                      {!task.startDate && !task.dueDate && <span />}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      {col.key !== 'pending' && (
                        <button onClick={() => onStatusChange(task, col.key === 'in_progress' ? 'pending' : 'in_progress')}
                          className="p-1 rounded hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground" title="Anterior">←</button>
                      )}
                      {col.key !== 'completed' && (
                        <button onClick={() => onStatusChange(task, col.key === 'pending' ? 'in_progress' : 'completed')}
                          className="p-1 rounded hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground" title="Seguinte">→</button>
                      )}
                      {!canEdit && (
                        <button onClick={() => onFileUpload?.(task.id)}
                          className="p-1 rounded hover:bg-blue-100 transition-colors" title="Submeter ficheiro">
                          {uploadingTaskId === task.id
                            ? <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin block" />
                            : <Upload size={13} className="text-blue-500" />}
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => onDelete(task.id)}
                          className="p-1 rounded hover:bg-destructive/10 transition-colors">
                          <Trash2 size={13} className="text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Sem tarefas</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ tasks, onStatusChange, onDelete, canEdit, onFileUpload, uploadingTaskId }: {
  tasks: any[];
  onStatusChange: (t: any, s: string) => void;
  onDelete: (id: number) => void; canEdit: boolean;
  onFileUpload?: (taskId: number) => void;
  uploadingTaskId?: number | null;
}) {
  const STATUS_COLORS: Record<string, string> = {
    pending:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };
  const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Progresso', completed: 'Concluída' };

  return (
    <div className="space-y-2">
      {tasks.map((task, idx) => (
        <div key={task.id}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
        >
          <button
            onClick={e => { e.stopPropagation(); onStatusChange(task, task.status === 'completed' ? 'pending' : canEdit ? (task.status === 'pending' ? 'in_progress' : 'completed') : 'completed'); }}
            className="flex-shrink-0 hover:scale-110 transition-transform"
          >
            {task.status === 'completed'
              ? <CheckCircle size={20} className="text-green-500" />
              : task.status === 'in_progress'
              ? <Clock size={20} className="text-blue-500" />
              : <Circle size={20} className="text-muted-foreground" />
            }
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </p>
            {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.startDate && (
              <span className="hidden sm:flex text-xs text-teal-500 items-center gap-1">
                <Clock size={11} />{new Date(task.startDate).toLocaleDateString('pt-PT')}
              </span>
            )}
            {task.dueDate && (
              <span className="hidden sm:flex text-xs text-muted-foreground items-center gap-1">
                <Clock size={11} />{new Date(task.dueDate).toLocaleDateString('pt-PT')}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              {!canEdit && (
                <button onClick={() => onFileUpload?.(task.id)} className="p-1 rounded hover:bg-blue-100 transition-colors" title="Submeter ficheiro">
                  {uploadingTaskId === task.id
                    ? <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin block" />
                    : <Upload size={14} className="text-blue-500" />}
                </button>
              )}
              {canEdit && (
                <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                  <Trash2 size={14} className="text-destructive" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlanDetail() {
  const [, params] = useRoute('/plans/:id');
  const [, setLocation] = useLocation();
  const planId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';

  const { data: plan, isLoading, refetch } = trpc.plans.getById.useQuery({ id: planId }, { enabled: !!planId });
  const { data: assignments } = trpc.assignments.getByPlanId.useQuery({ planId }, { enabled: !!planId && canEdit });

  const createTaskMutation = trpc.tasks.create.useMutation();
  const updateTaskMutation = trpc.tasks.update.useMutation();
  const deleteTaskMutation = trpc.tasks.delete.useMutation();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', startDate: '', dueDate: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<number | null>(null);
  const createAttachmentMutation = trpc.taskAttachments.create.useMutation();

  const handleFileUploadClick = (taskId: number) => {
    setUploadingTaskId(taskId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingTaskId) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/storage/upload', { method: 'POST', body: formData });
      if (!resp.ok) throw new Error('Upload failed');
      const data = await resp.json();
      await createAttachmentMutation.mutateAsync({
        taskId: uploadingTaskId,
        fileName: file.name,
        fileUrl: data.url,
        fileSize: file.size.toString(),
      });
      toast.success('Ficheiro submetido com sucesso!');
      refetch();
    } catch {
      toast.error('Erro ao submeter ficheiro');
    } finally {
      setUploadingTaskId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await createTaskMutation.mutateAsync({
        planId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        order: (plan?.tasks?.length || 0) + 1,
        startDate: taskForm.startDate ? new Date(taskForm.startDate) : undefined,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
      });
      toast.success('Tarefa criada com sucesso');
      setTaskForm({ title: '', description: '', startDate: '', dueDate: '' });
      setShowTaskForm(false);
      refetch();
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleStatusChange = async (task: any, newStatus: string) => {
    try {
      await updateTaskMutation.mutateAsync({ id: task.id, status: newStatus as any });
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

  if (isLoading) {
    return (
      <DashboardLayout title="Detalhes do Plano">
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!plan) {
    return (
      <DashboardLayout title="Detalhes do Plano">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Plano não encontrado</p>
          <Button onClick={() => setLocation('/plans')}>Voltar aos Planos</Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedTasks = plan.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const totalTasks = plan.tasks?.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusColors: Record<string, string> = {
    active:    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    draft:     'bg-muted text-muted-foreground border-border',
    completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    archived:  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  const statusLabels: Record<string, string> = { active: 'Ativo', draft: 'Rascunho', completed: 'Concluído', archived: 'Arquivado' };

  return (
    <DashboardLayout title={plan.title}>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={() => setLocation('/plans')} className="mt-1 p-2 hover:bg-muted rounded-xl transition-colors flex-shrink-0">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{plan.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[plan.status] || statusColors.draft}`}>
                {statusLabels[plan.status] || plan.status}
              </span>
            </div>
            {plan.description && (
              <div className="mt-1">
                <MarkdownRenderer content={plan.description} />
              </div>
            )}
          </div>
        </div>

        {/* Duração do Plano */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Duração do Plano
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${plan.startDate ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-800/40 border-dashed border-slate-200 dark:border-slate-700'}`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Início</p>
              {plan.startDate ? (
                <p className="text-lg font-bold text-foreground">{new Date(plan.startDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Não definida</p>
              )}
            </div>
            <div className={`p-4 rounded-xl border ${plan.endDate ? 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/40 border-dashed border-slate-200 dark:border-slate-700'}`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Fim</p>
              {plan.endDate ? (
                <p className="text-lg font-bold text-foreground">{new Date(plan.endDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Não definida</p>
              )}
            </div>
          </div>
        </Card>

        {/* Progress bar */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Progresso Geral</p>
              <p className="text-xs text-muted-foreground mt-0.5">{completedTasks} de {totalTasks} tarefas concluídas</p>
            </div>
            <span className="text-3xl font-bold text-primary tabular-nums">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" />{completedTasks} concluídas</span>
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-500" />{plan.tasks?.filter((t: any) => t.status === 'in_progress').length || 0} em progresso</span>
            <span className="flex items-center gap-1.5"><Circle size={12} className="text-yellow-500" />{plan.tasks?.filter((t: any) => t.status === 'pending').length || 0} pendentes</span>
          </div>
        </Card>

        {/* Assignments — só para tutores/admins */}
        {canEdit && assignments && assignments.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">Estagiários Atribuídos ({assignments.length})</h2>
            <div className="flex flex-wrap gap-2">
              {assignments.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border border-border">
                  <div className="relative">
                    {a.userAvatar
                      ? <img src={a.userAvatar} alt={a.userName ?? ''} className="w-5 h-5 rounded-full object-cover" />
                      : <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(a.userName ?? 'U')[0].toUpperCase()}
                        </div>
                    }
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${
                      a.userPresence === "online" ? "bg-green-500" :
                      a.userPresence === "ausente" ? "bg-yellow-400" : "bg-slate-400"
                    }`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{a.userName ?? `#${a.userId}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    {a.status === 'active' ? 'Ativo' : 'Concluído'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tasks section */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-bold text-foreground">Tarefas ({totalTasks})</h2>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Vista em lista"
                >
                  <List size={15} />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Vista Kanban"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
              {canEdit && (
                <Button onClick={() => setShowTaskForm(v => !v)} size="sm" className="gap-1.5">
                  <Plus size={14} /> Nova Tarefa
                </Button>
              )}
            </div>
          </div>

          {/* Add task form */}
          {showTaskForm && (
            <form onSubmit={handleAddTask} className="mb-4 p-4 bg-muted/50 rounded-xl border border-border space-y-3">
              <Input
                placeholder="Título da tarefa *"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                required autoFocus
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={taskForm.startDate} onChange={e => setTaskForm({ ...taskForm, startDate: e.target.value })} placeholder="Data de início" />
                <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} placeholder="Data de fim" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'A criar...' : 'Criar Tarefa'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowTaskForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" />
          {plan.tasks && plan.tasks.length > 0 ? (
            viewMode === 'kanban' ? (
              <KanbanView
                tasks={plan.tasks}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
                onFileUpload={handleFileUploadClick}
                uploadingTaskId={uploadingTaskId}
              />
            ) : (
              <ListView
                tasks={plan.tasks}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
                onFileUpload={handleFileUploadClick}
                uploadingTaskId={uploadingTaskId}
              />
            )
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <CheckCircle size={36} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-foreground font-medium mb-1">Sem tarefas ainda</p>
              <p className="text-muted-foreground text-sm">
                {canEdit ? 'Clica em "Nova Tarefa" para começar.' : 'O teu tutor irá adicionar tarefas em breve.'}
              </p>
            </div>
          )}
        </div>
      </div>

    </DashboardLayout>
  );
}
