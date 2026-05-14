import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  ChevronLeft, ChevronRight, CalendarIcon, Clock,
  CheckCircle2, Circle, Plus, X, FileText, AlertCircle, List
} from 'lucide-react';
import { toast } from 'sonner';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:     <Circle size={14} className="text-yellow-500 shrink-0" />,
  in_progress: <Clock size={14} className="text-blue-500 shrink-0" />,
  completed:   <CheckCircle2 size={14} className="text-green-500 shrink-0" />,
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente', in_progress: 'Em Progresso', completed: 'Concluída',
};
const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

// ── Modal: Agendar Tarefa ────────────────────────────────────────────────────
function ScheduleTaskModal({
  date, plans, onClose, onSuccess,
}: { date: Date; plans: any[]; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [planId, setPlanId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createTask = trpc.tasks.create.useMutation();
  const availablePlans = (plans || []).filter((p: any) => p.status === 'active' || p.status === 'draft');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !title.trim()) return;
    try {
      await createTask.mutateAsync({
        planId: Number(planId), title: title.trim(),
        description: description.trim() || undefined,
        order: 99, dueDate: date,
      });
      toast.success('Tarefa agendada com sucesso!');
      onSuccess();
    } catch { toast.error('Erro ao agendar tarefa'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Agendar Tarefa</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={18} /></button>
        </div>

        {!isAdmin ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">Apenas administradores podem criar tarefas.</p>
          </div>
        ) : availablePlans.length === 0 ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <FileText size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">Não há planos disponíveis. Crie um plano primeiro.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Plano *</label>
              <select value={planId} onChange={e => setPlanId(e.target.value ? Number(e.target.value) : '')} required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecionar plano...</option>
                {availablePlans.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Título *</label>
              <Input placeholder="Ex: Reunião de boas-vindas" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <textarea placeholder="Descrição da tarefa..." value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 gap-2" disabled={createTask.isPending}>
                <Plus size={16} />{createTask.isPending ? 'A agendar...' : 'Agendar Tarefa'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

// ── Modal: Ver Tarefas Agendadas ─────────────────────────────────────────────
function ScheduledTasksModal({
  tasks, plans, onClose,
}: { tasks: any[]; plans: any[]; onClose: () => void }) {
  const planMap = Object.fromEntries((plans || []).map((p: any) => [p.id, p.title]));
  const scheduled = tasks.filter(t => t.dueDate).sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg p-6 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Tarefas Agendadas</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{scheduled.length} tarefa{scheduled.length !== 1 ? 's' : ''} com data definida</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {scheduled.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon size={40} className="text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">Nenhuma tarefa com data agendada.</p>
            </div>
          ) : (
            scheduled.map(task => {
              const due = new Date(task.dueDate);
              const isOverdue = task.status !== 'completed' && due < new Date();
              return (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
                  ${isOverdue ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-border bg-muted/30'}`}>
                  <span className="mt-0.5 shrink-0">{STATUS_ICON[task.status] || <Circle size={14} />}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{planMap[task.planId] || 'Plano desconhecido'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                        <CalendarIcon size={11} />
                        {due.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {isOverdue && ' · atrasada'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Calendar() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduledList, setShowScheduledList] = useState(false);

  const { data: plans } = trpc.plans.list.useQuery();
  // Single query for ALL tasks — no more per-plan queries
  const { data: allTasksRaw, refetch: refetchTasks } = trpc.tasks.listAll.useQuery();
  const allTasks = allTasksRaw || [];

  // Build set of date keys that have tasks with dueDate
  const datesWithTasks = new Set(
    allTasks.filter(t => t.dueDate).map(t => toDateKey(new Date(t.dueDate!)))
  );

  // Tasks for selected date
  const selectedKey = toDateKey(selectedDate);
  const selectedDayTasks = allTasks.filter(t => t.dueDate && toDateKey(new Date(t.dueDate!)) === selectedKey);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) => d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const isSelected = (d: number) => d === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();

  const activePlans = (plans || []).filter((p: any) => p.status === 'active');
  const scheduledCount = allTasks.filter(t => t.dueDate).length;

  return (
    <DashboardLayout title="Calendário">
      {showScheduleModal && (
        <ScheduleTaskModal
          date={selectedDate}
          plans={plans || []}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => { setShowScheduleModal(false); refetchTasks(); }}
        />
      )}
      {showScheduledList && (
        <ScheduledTasksModal
          tasks={allTasks}
          plans={plans || []}
          onClose={() => setShowScheduledList(false)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendário</h1>
            <p className="text-muted-foreground mt-1">Visualize e agende tarefas por data</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowScheduledList(true)}
              variant="outline"
              className="gap-2"
            >
              <List size={16} />
              Ver Agendadas
              {scheduledCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {scheduledCount}
                </span>
              )}
            </Button>
            <Button
              onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDate(today); }}
              variant="outline"
              className="gap-2"
            >
              <CalendarIcon size={16} />
              Hoje
            </Button>
            <Button onClick={() => setShowScheduleModal(true)} className="gap-2">
              <Plus size={16} />
              Agendar Tarefa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold text-foreground">{MONTHS_PT[currentMonth]} {currentYear}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS_PT.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasTasks = datesWithTasks.has(key);
                const todayCell = isToday(day);
                const selectedCell = isSelected(day);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${todayCell
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : selectedCell
                        ? 'bg-primary/15 text-primary border-2 border-primary'
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                  >
                    {day}
                    {hasTasks && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${todayCell ? 'bg-white/80' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Selected Date Tasks */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <CalendarIcon size={15} className="text-primary" />
                  {selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  title="Agendar tarefa neste dia"
                >
                  <Plus size={15} />
                </button>
              </div>

              {selectedDayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa neste dia.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map(t => (
                    <div key={t.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      {STATUS_ICON[t.status] || <Circle size={14} />}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {t.title}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_COLORS[t.status]}`}>
                          {STATUS_LABELS[t.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Plans */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Clock size={15} className="text-primary" />
                Planos Ativos
              </h3>
              {activePlans.length > 0 ? (
                <div className="space-y-2">
                  {activePlans.slice(0, 5).map((p: any) => (
                    <button key={p.id} onClick={() => setLocation(`/plans/${p.id}`)}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.description || 'Sem descrição'}</p>
                      </div>
                    </button>
                  ))}
                  {activePlans.length > 5 && (
                    <button onClick={() => setLocation('/plans')} className="text-xs text-primary hover:underline w-full text-center pt-1">
                      Ver todos ({activePlans.length})
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum plano ativo.</p>
              )}
            </Card>

            {/* Summary */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Resumo</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Total de Planos', value: (plans || []).length, color: 'text-foreground' },
                  { label: 'Planos Ativos', value: activePlans.length, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Tarefas agendadas', value: scheduledCount, color: 'text-primary' },
                  { label: 'Tarefas concluídas', value: allTasks.filter(t => t.status === 'completed').length, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Tarefas pendentes', value: allTasks.filter(t => t.status === 'pending').length, color: 'text-yellow-600 dark:text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className={`text-sm font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
