import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  CheckCircle2, Clock, Circle, ChevronDown, ChevronRight,
  Eye, FileText, Plus, X, CalendarIcon, Trash2,
  MessageSquare, Paperclip, Send, Upload, Image as ImageIcon, File,
  ChevronRight as ChevronRightIcon, Kanban, List,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TaskStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type ViewMode = 'list' | 'kanban';

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

// Column config for Kanban
const KANBAN_COLUMNS: { id: string; label: string; color: string; headerBg: string }[] = [
  { id: 'pending',     label: 'Pendente',     color: 'border-yellow-400', headerBg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  { id: 'in_progress', label: 'Em Progresso', color: 'border-blue-400',   headerBg: 'bg-blue-50 dark:bg-blue-950/20'   },
  { id: 'completed',   label: 'Concluída',    color: 'border-green-400',  headerBg: 'bg-green-50 dark:bg-green-950/20' },
];

// ── File icon helper ──────────────────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon size={14} className="text-blue-500" />;
  if (['pdf'].includes(ext)) return <FileText size={14} className="text-red-500" />;
  return <File size={14} className="text-muted-foreground" />;
}

// ── Task panel (comments + attachments) ──────────────────────────────────────
function TaskPanel({ task, onClose, canEdit }: { task: any; onClose: () => void; canEdit: boolean }) {
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const { data: comments = [], refetch: refetchComments } = trpc.taskComments.getByTaskId.useQuery({ taskId: task.id });
  const { data: attachments = [], refetch: refetchAttachments } = trpc.taskAttachments.getByTaskId.useQuery({ taskId: task.id });

  const createComment = trpc.taskComments.create.useMutation();
  const deleteComment = trpc.taskComments.delete.useMutation();
  const createAttachment = trpc.taskAttachments.create.useMutation();
  const deleteAttachment = trpc.taskAttachments.delete.useMutation();

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await createComment.mutateAsync({ taskId: task.id, text: comment.trim() });
      setComment('');
      refetchComments();
      toast.success('Comentário adicionado');
    } catch {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await deleteComment.mutateAsync({ id });
      refetchComments();
      toast.success('Comentário eliminado');
    } catch {
      toast.error('Erro ao eliminar comentário');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', `tasks/${task.id}/${file.name}`);
      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData });
      const size = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const url = res.ok ? (await res.json()).url : URL.createObjectURL(file);
      await createAttachment.mutateAsync({ taskId: task.id, fileName: file.name, fileUrl: url, fileSize: size });
      refetchAttachments();
      toast.success('Ficheiro anexado');
    } catch {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    try {
      await deleteAttachment.mutateAsync({ id });
      refetchAttachments();
      toast.success('Anexo eliminado');
    } catch {
      toast.error('Erro ao eliminar anexo');
    }
  };

  const formatDate = (d: any) => {
    if (!d) return '';
    return new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tarefa</p>
            <h3 className="font-bold text-foreground text-base leading-snug">{task.title}</h3>
            {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            {task.dueDate && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <CalendarIcon size={11} />Prazo: {new Date(task.dueDate).toLocaleDateString('pt-PT')}
              </p>
            )}
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-2 ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
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
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 transition-colors">
                <Upload size={13} />{uploading ? 'A enviar...' : 'Anexar ficheiro'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
            {attachments.length === 0 ? (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                <Upload size={20} className="mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Clica para anexar um ficheiro</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, imagens, documentos</p>
              </button>
            ) : (
              <div className="space-y-2">
                {attachments.map((att: any) => (
                  <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group border border-border/50">
                    <a href={att.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                        <FileIcon name={att.fileName} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{att.fileName}</p>
                        {att.fileSize && <p className="text-xs text-muted-foreground">{att.fileSize}</p>}
                      </div>
                      <ChevronRightIcon size={14} className="text-muted-foreground flex-shrink-0" />
                    </a>
                    <button onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      title="Eliminar anexo">
                      <Trash2 size={13} />
                    </button>
                  </div>
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
                {comments.map((c: any) => (
                  <div key={c.id} className="flex gap-3 group">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      {(c.userName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{c.userName}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                        </div>
                        {(canEdit || (user as any)?.id === c.userId) && (
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            title="Eliminar">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
              placeholder="Adicionar comentário..."
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={handleComment} disabled={!comment.trim() || createComment.isPending}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Form ─────────────────────────────────────────────────────────────
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

// ── Sortable Kanban Card ──────────────────────────────────────────────────────
function KanbanCard({
  task, canEdit, onOpen, onStatusChange, onDelete,
}: {
  task: any; canEdit: boolean;
  onOpen: (task: any) => void;
  onStatusChange: (task: any) => void;
  onDelete: (taskId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `${task.id}`, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-background border border-border rounded-xl p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-shadow"
      onClick={() => onOpen(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium leading-snug flex-1 ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        {canEdit && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            title="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-2.5">
        {task.dueDate ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarIcon size={10} />{new Date(task.dueDate).toLocaleDateString('pt-PT')}
          </p>
        ) : <span />}
        <button
          onClick={e => { e.stopPropagation(); onStatusChange(task); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Avançar estado"
        >
          {STATUS_ICON[task.status]}
        </button>
      </div>
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────
function KanbanColumn({
  column, tasks, canEdit, onOpen, onStatusChange, onDelete,
}: {
  column: typeof KANBAN_COLUMNS[number];
  tasks: any[];
  canEdit: boolean;
  onOpen: (task: any) => void;
  onStatusChange: (task: any) => void;
  onDelete: (taskId: number) => void;
}) {
  const ids = tasks.map((t: any) => String(t.id));

  return (
    <div className={`flex flex-col rounded-2xl border-t-4 ${column.color} bg-muted/30 min-h-[300px]`}>
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${column.headerBg}`}>
        <div className="flex items-center gap-2">
          {STATUS_ICON[column.id]}
          <span className="text-sm font-semibold text-foreground">{column.label}</span>
        </div>
        <span className="text-xs font-bold bg-background border border-border text-muted-foreground px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-2">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <KanbanCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              onOpen={onOpen}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
            Sem tarefas
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Board for a single plan ────────────────────────────────────────────
function KanbanBoard({ plan, canEdit }: { plan: any; canEdit: boolean }) {
  const [, setLocation] = useLocation();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);

  const { data: planDetail, isLoading, refetch } = trpc.plans.getById.useQuery({ id: plan.id });
  const updateTaskMutation = trpc.tasks.update.useMutation();
  const deleteTaskMutation = trpc.tasks.delete.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const allTasks: any[] = planDetail?.tasks || [];
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter((t: any) => t.status === 'completed').length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const tasksByStatus = {
    pending:     allTasks.filter((t: any) => t.status === 'pending'),
    in_progress: allTasks.filter((t: any) => t.status === 'in_progress'),
    completed:   allTasks.filter((t: any) => t.status === 'completed'),
  };

  const handleStatusChange = async (task: any) => {
    const cycle: Record<string, string> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
    const nextStatus = canEdit ? cycle[task.status] : (task.status === 'completed' ? 'pending' : 'completed');
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

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find((t: any) => String(t.id) === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    // Find what column the card was dropped into — the over.id can be a task id or a column id
    const draggedTask = allTasks.find((t: any) => String(t.id) === active.id);
    if (!draggedTask) return;

    // Determine target column
    let targetStatus: string | null = null;

    // If dropped directly onto a column id
    if (['pending', 'in_progress', 'completed'].includes(String(over.id))) {
      targetStatus = String(over.id);
    } else {
      // Dropped onto another card — use that card's status
      const overTask = allTasks.find((t: any) => String(t.id) === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (!targetStatus || targetStatus === draggedTask.status) return;

    try {
      await updateTaskMutation.mutateAsync({ id: draggedTask.id, status: targetStatus as any });
      refetch();
      toast.success(`Movida para "${STATUS_LABELS[targetStatus]}"`);
    } catch {
      toast.error('Erro ao mover tarefa');
    }
  };

  if (isLoading) {
    return <Card className="p-4"><div className="animate-pulse h-6 bg-muted rounded w-1/3" /></Card>;
  }

  return (
    <Card className="overflow-hidden">
      {/* Plan header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
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
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Adicionar tarefa"
            >
              <Plus size={15} />
            </button>
          )}
          <button
            onClick={() => setLocation(`/plans/${plan.id}`)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Ver plano"
          >
            <Eye size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddTaskForm
          planId={plan.id}
          nextOrder={totalCount + 1}
          onSuccess={() => { setShowAddForm(false); refetch(); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByStatus[col.id as keyof typeof tasksByStatus]}
              canEdit={canEdit}
              onOpen={setSelectedTask}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-background border border-primary rounded-xl p-3 shadow-2xl rotate-2 opacity-95">
              <p className="text-sm font-medium text-foreground">{activeTask.title}</p>
              {activeTask.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activeTask.description}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskPanel task={selectedTask} onClose={() => setSelectedTask(null)} canEdit={canEdit} />
      )}
    </Card>
  );
}

// ── List view plan group (original) ──────────────────────────────────────────
function PlanTaskGroup({ plan, filterStatus, canEdit }: {
  plan: any; filterStatus: TaskStatus; canEdit: boolean;
}) {
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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

  const handleStatusChange = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
              <div
                key={task.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 group cursor-pointer ${idx > 0 ? 'border-t border-border/50' : ''}`}
                onClick={() => setSelectedTask(task)}
              >
                {canEdit ? (
                  <button onClick={(e) => handleStatusChange(task, e)} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
                    {STATUS_ICON[task.status as keyof typeof STATUS_ICON] || <Circle size={16} />}
                  </button>
                ) : (
                  <button onClick={(e) => handleStatusChange(task, e)} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
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
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <MessageSquare size={13} className="text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                  {canEdit && (
                    <button onClick={(e) => handleDelete(task.id, e)} className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} />
                    </button>
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

      {selectedTask && (
        <TaskPanel task={selectedTask} onClose={() => setSelectedTask(null)} canEdit={canEdit} />
      )}
    </Card>
  );
}

// ── Main Tasks page ───────────────────────────────────────────────────────────
export default function Tasks() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';
  const [filterStatus, setFilterStatus] = useState<TaskStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { data: plans, isLoading } = trpc.plans.list.useQuery();

  const filterButtons: { label: string; value: TaskStatus; icon: React.ReactNode }[] = [
    { label: 'Todas', value: 'all', icon: <Circle size={14} /> },
    { label: 'Pendentes', value: 'pending', icon: <Circle size={14} className="text-yellow-500" /> },
    { label: 'Em Progresso', value: 'in_progress', icon: <Clock size={14} className="text-blue-500" /> },
    { label: 'Concluídas', value: 'completed', icon: <CheckCircle2 size={14} className="text-green-500" /> },
  ];

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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista Lista"
              >
                <List size={15} />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'kanban' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista Kanban"
              >
                <Kanban size={15} />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
            {canEdit && (
              <Button onClick={() => setLocation('/plans')} variant="outline" className="gap-2">
                <FileText size={16} /> Gerir Planos
              </Button>
            )}
          </div>
        </div>

        {/* Status filter — only shown in list mode */}
        {viewMode === 'list' && (
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
        )}

        {/* Kanban tip banner */}
        {viewMode === 'kanban' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-2">
            <Kanban size={13} />
            Arrasta os cartões entre colunas para mudar o estado da tarefa.
          </div>
        )}

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
            {plans.map((plan: any) =>
              viewMode === 'kanban' ? (
                <KanbanBoard key={plan.id} plan={plan} canEdit={canEdit} />
              ) : (
                <PlanTaskGroup key={plan.id} plan={plan} filterStatus={filterStatus} canEdit={canEdit} />
              )
            )}
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
