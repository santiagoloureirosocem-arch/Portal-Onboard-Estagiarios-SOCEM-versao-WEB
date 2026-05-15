import React, { useState, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Plus, CheckCircle, Clock, Circle, Trash2,
  MessageSquare, Paperclip, Send, X, LayoutGrid, List,
  ChevronRight, Upload, FileText, Image as ImageIcon, File
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

// ── File icon helper ──────────────────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon size={14} className="text-blue-500" />;
  if (['pdf'].includes(ext)) return <FileText size={14} className="text-red-500" />;
  return <File size={14} className="text-muted-foreground" />;
}

// ── Comments & Attachments panel ─────────────────────────────────────────────
function TaskPanel({ task, onClose, canEdit }: { task: any; onClose: () => void; canEdit: boolean }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{ id: number; author: string; text: string; date: string }[]>(
    (task._comments || [])
  );
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: string }[]>(
    task._attachments || []
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleComment = () => {
    if (!comment.trim()) return;
    const newComment = {
      id: Date.now(),
      author: (user as any)?.name ?? 'Eu',
      text: comment.trim(),
      date: new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };
    setComments(prev => [...prev, newComment]);
    setComment('');
    toast.success('Comentário adicionado');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload via presigned URL (server/storage.ts)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', `tasks/${task.id}/${file.name}`);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        const size = file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        setAttachments(prev => [...prev, { name: file.name, url, size }]);
        toast.success('Ficheiro anexado com sucesso');
      } else {
        // fallback: store locally for demo
        const url = URL.createObjectURL(file);
        const size = file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        setAttachments(prev => [...prev, { name: file.name, url, size }]);
        toast.success('Ficheiro anexado');
      }
    } catch {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tarefa</p>
            <h3 className="font-bold text-foreground text-base leading-snug">{task.title}</h3>
            {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Paperclip size={14} /> Anexos ({attachments.length})
              </h4>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 transition-colors"
              >
                <Upload size={13} />{uploading ? 'A enviar...' : 'Anexar ficheiro'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
            {attachments.length === 0 ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors group"
              >
                <Upload size={20} className="mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Clica para anexar um ficheiro</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, imagens, documentos</p>
              </button>
            ) : (
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                      <FileIcon name={att.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{att.size}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <MessageSquare size={14} /> Comentários ({comments.length})
            </h4>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem comentários ainda. Sê o primeiro!</p>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      {c.author[0].toUpperCase()}
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{c.author}</span>
                        <span className="text-xs text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
              placeholder="Adicionar comentário..."
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim()}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────
const KANBAN_COLS = [
  { key: 'pending',     label: 'Pendente',     color: 'bg-yellow-500', light: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-200 dark:border-yellow-800' },
  { key: 'in_progress', label: 'Em Progresso', color: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-950/20',    border: 'border-blue-200 dark:border-blue-800' },
  { key: 'completed',   label: 'Concluída',    color: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-950/20',  border: 'border-green-200 dark:border-green-800' },
];

function KanbanView({ tasks, onTaskClick, onStatusChange, onDelete, canEdit }: {
  tasks: any[]; onTaskClick: (t: any) => void;
  onStatusChange: (t: any, s: string) => void;
  onDelete: (id: number) => void; canEdit: boolean;
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
                  className="bg-background rounded-xl border border-border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => onTaskClick(task)}
                >
                  <p className="text-sm font-medium text-foreground leading-snug mb-2">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {task.dueDate ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />{new Date(task.dueDate).toLocaleDateString('pt-PT')}
                      </span>
                    ) : <span />}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      {canEdit && col.key !== 'pending' && (
                        <button onClick={() => onStatusChange(task, col.key === 'in_progress' ? 'pending' : 'in_progress')}
                          className="p-1 rounded hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground">←</button>
                      )}
                      {canEdit && col.key !== 'completed' && (
                        <button onClick={() => onStatusChange(task, col.key === 'pending' ? 'in_progress' : 'completed')}
                          className="p-1 rounded hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground">→</button>
                      )}
                      {!canEdit && col.key !== 'completed' && (
                        <button onClick={() => onStatusChange(task, 'completed')}
                          className="p-1 rounded hover:bg-green-100 transition-colors" title="Concluir">
                          <CheckCircle size={13} className="text-green-500" />
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
function ListView({ tasks, onTaskClick, onStatusChange, onDelete, canEdit }: {
  tasks: any[]; onTaskClick: (t: any) => void;
  onStatusChange: (t: any, s: string) => void;
  onDelete: (id: number) => void; canEdit: boolean;
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
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
          onClick={() => onTaskClick(task)}
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
            {task.dueDate && (
              <span className="hidden sm:flex text-xs text-muted-foreground items-center gap-1">
                <Clock size={11} />{new Date(task.dueDate).toLocaleDateString('pt-PT')}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button className="p-1 rounded hover:bg-muted transition-colors" title="Comentários">
                <MessageSquare size={14} className="text-muted-foreground" />
              </button>
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
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await createTaskMutation.mutateAsync({
        planId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
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
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {(a.userName ?? 'U')[0].toUpperCase()}
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
              <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'A criar...' : 'Criar Tarefa'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowTaskForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}

          {plan.tasks && plan.tasks.length > 0 ? (
            viewMode === 'kanban' ? (
              <KanbanView
                tasks={plan.tasks}
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
              />
            ) : (
              <ListView
                tasks={plan.tasks}
                onTaskClick={setSelectedTask}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canEdit={canEdit}
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

      {/* Task panel (comments + attachments) */}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          canEdit={canEdit}
        />
      )}
    </DashboardLayout>
  );
}
