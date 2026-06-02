import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  ChevronLeft, ChevronRight, CalendarIcon, Clock,
  CheckCircle2, Circle, Plus, X, FileText, AlertCircle, List, Filter
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
  const canCreate = user?.role === 'admin' || user?.role === 'tutor';
  const [planId, setPlanId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const createTask = trpc.tasks.create.useMutation();
  const availablePlans = (plans || []).filter((p: any) => p.status !== 'archived');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !title.trim()) return;
    try {
      await createTask.mutateAsync({
        planId: Number(planId), title: title.trim(),
        description: description.trim() || undefined,
        order: 99,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: date,
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

        {!canCreate ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">Apenas tutores e administradores podem criar tarefas.</p>
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
              <input placeholder="Ex: Reunião de boas-vindas" value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <textarea placeholder="Descrição da tarefa..." value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Data de início <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
  const [hideCompleted, setHideCompleted] = useState(true);
  const planMap = Object.fromEntries((plans || []).map((p: any) => [p.id, p.title]));
  const allScheduled = tasks.filter(t => t.dueDate).sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const scheduled = hideCompleted
    ? allScheduled.filter(t => t.status !== 'completed')
    : allScheduled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg p-6 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Tarefas Agendadas</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{scheduled.length} tarefa{scheduled.length !== 1 ? 's' : ''}{hideCompleted ? ' por fazer' : ' (todas)'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-2 mb-3 shrink-0">
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all
              ${hideCompleted ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Filter size={13} />
            {hideCompleted ? 'Ocultando concluidas' : 'Mostrar todas'}
          </button>
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

// ── Legenda dos marcadores ────────────────────────────────────────────────────
function MarkerLegend() {
  const items = [
    { color: 'bg-green-500', ring: 'ring-green-300', label: 'Início do plano' },
    { color: 'bg-purple-500', ring: 'ring-purple-300', label: 'Fim do plano' },
    { color: 'bg-teal-500', ring: 'ring-teal-300', label: 'Início de tarefa' },
    { color: 'bg-primary', ring: 'ring-primary/40', label: 'Prazo de tarefa' },
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legenda</p>
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color} ring-2 ${item.ring}`} />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
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
  const [filterPlanId, setFilterPlanId] = useState<number | 'all'>('all');

  const { data: plans } = trpc.plans.list.useQuery();
  const { data: allTasksRaw, refetch: refetchTasks } = trpc.tasks.listAll.useQuery();
  const allTasks = allTasksRaw || [];

  // ── Filter by plan ────────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (filterPlanId === 'all') return allTasks;
    return allTasks.filter((t: any) => t.planId === filterPlanId);
  }, [allTasks, filterPlanId]);

  const filteredPlans = useMemo(() => {
    if (filterPlanId === 'all') return plans || [];
    return (plans || []).filter((p: any) => p.id === filterPlanId);
  }, [plans, filterPlanId]);

  // ── Marker sets ──────────────────────────────────────────────────────────────
  const datesWithTaskDueDates = new Set(
    filteredTasks.filter((t: any) => t.dueDate).map((t: any) => toDateKey(new Date(t.dueDate)))
  );
  const datesWithTaskStartDates = new Set(
    filteredTasks.filter((t: any) => t.startDate).map((t: any) => toDateKey(new Date(t.startDate)))
  );
  const datesWithPlanStarts = new Set(
    filteredPlans.filter((p: any) => p.startDate).map((p: any) => toDateKey(new Date(p.startDate)))
  );
  const datesWithPlanEnds = new Set(
    filteredPlans.filter((p: any) => p.endDate).map((p: any) => toDateKey(new Date(p.endDate)))
  );

  // ── Overdue dates ────────────────────────────────────────────────────────────
  const overdueDateKeys = useMemo(() => {
    const keys = new Set<string>();
    const now = new Date();
    for (const t of allTasks) {
      if (t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now) {
        keys.add(toDateKey(new Date(t.dueDate)));
      }
    }
    return keys;
  }, [allTasks]);

  // ── Task count per date ──────────────────────────────────────────────────────
  const taskCountByDate = useMemo(() => {
    const count = new Map<string, number>();
    for (const t of filteredTasks) {
      if (t.dueDate) {
        const key = toDateKey(new Date(t.dueDate));
        count.set(key, (count.get(key) || 0) + 1);
      }
      if (t.startDate) {
        const key = toDateKey(new Date(t.startDate));
        count.set(key, (count.get(key) || 0) + 1);
      }
    }
    return count;
  }, [filteredTasks]);

  // Selected date tasks (from FILTERED tasks)
  const selectedKey = toDateKey(selectedDate);
  const selectedDayTasks = filteredTasks.filter((t: any) =>
    (t.dueDate && toDateKey(new Date(t.dueDate!)) === selectedKey) ||
    (t.startDate && toDateKey(new Date(t.startDate!)) === selectedKey)
  );

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

  const scheduledCount = allTasks.filter((t: any) => t.dueDate || t.startDate).length;
  const selectedDayPlans = filteredPlans.filter((p: any) =>
    (p.startDate && toDateKey(new Date(p.startDate)) === selectedKey) ||
    (p.endDate && toDateKey(new Date(p.endDate)) === selectedKey)
  );

  // Plan filter options: distinct plans that have tasks or are visible
  const planOptions = useMemo(() => {
    const planSet = new Map<number, string>();
    for (const t of allTasks) {
      const plan = (plans || []).find((p: any) => p.id === t.planId);
      if (plan) planSet.set(plan.id, plan.title);
    }
    for (const p of plans || []) {
      planSet.set(p.id, p.title);
    }
    return Array.from(planSet.entries()).map(([id, title]) => ({ id, title }));
  }, [allTasks, plans]);

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
              Agendar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="p-6 lg:col-span-2">
            {/* Filtro por plano */}
            {planOptions.length > 1 && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <Filter size={14} className="text-muted-foreground shrink-0" />
                <select
                  value={filterPlanId}
                  onChange={e => setFilterPlanId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Todos os planos</option>
                  {planOptions.map(({ id, title }) => (
                    <option key={id} value={id}>{title}</option>
                  ))}
                </select>
                {filterPlanId !== 'all' && (
                  <button onClick={() => setFilterPlanId('all')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                    Limpar
                  </button>
                )}
              </div>
            )}

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
                const hasTaskDue = datesWithTaskDueDates.has(key);
                const hasTaskStart = datesWithTaskStartDates.has(key);
                const hasPlanStart = datesWithPlanStarts.has(key);
                const hasPlanEnd = datesWithPlanEnds.has(key);
                const isOverdue = overdueDateKeys.has(key);
                const taskCount = taskCountByDate.get(key) || 0;
                const todayCell = isToday(day);
                const selectedCell = isSelected(day);

                const markers: string[] = [];
                if (hasPlanStart) markers.push('bg-green-500 ring-2 ring-green-300 dark:ring-green-700');
                if (hasPlanEnd) markers.push('bg-purple-500 ring-2 ring-purple-300 dark:ring-purple-700');
                if (hasTaskStart) markers.push('bg-teal-500 ring-2 ring-teal-300 dark:ring-teal-700');
                if (hasTaskDue) markers.push('bg-primary ring-2 ring-primary/40');

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all relative
                      ${todayCell
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : selectedCell
                        ? 'bg-primary/15 text-primary border-2 border-primary'
                        : isOverdue
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        : 'hover:bg-muted text-foreground'
                      }
                    `}
                  >
                    {day}
                    {taskCount > 0 && (
                      <span className={`text-[9px] font-bold leading-none mt-0.5 ${
                        todayCell ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {taskCount}
                      </span>
                    )}
                    {markers.length > 0 && (
                      <div className="flex items-center gap-[2px] mt-0.5">
                        {markers.slice(0, 3).map((cls, i) => (
                          <span key={i} className={`w-2 h-2 rounded-full ${cls}`} />
                        ))}
                      </div>
                    )}
                    {isOverdue && !todayCell && !selectedCell && markers.length === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Legenda — sempre visível */}
            <Card className="p-4">
              <MarkerLegend />
            </Card>
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

              {selectedDayTasks.length === 0 && selectedDayPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa ou evento neste dia.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayPlans.map((p: any) => {
                    const isStart = p.startDate && toDateKey(new Date(p.startDate)) === selectedKey;
                    const isEnd = p.endDate && toDateKey(new Date(p.endDate)) === selectedKey;
                    return (
                      <button key={`plan-${p.id}-${isStart ? 'start' : 'end'}`}
                        onClick={() => setLocation(`/plans/${p.id}`)}
                        className={`w-full text-left flex items-start gap-2 p-2.5 rounded-lg border ${isStart ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'}`}>
                        <CalendarIcon size={14} className={`shrink-0 mt-0.5 ${isStart ? 'text-green-500' : 'text-purple-500'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${isStart ? 'text-green-700 dark:text-green-300' : 'text-purple-700 dark:text-purple-300'}`}>
                            {p.title}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${isStart ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                            {isStart ? 'Início do Plano' : 'Fim do Plano'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {selectedDayTasks.map(t => {
                    const onStartDate = t.startDate && toDateKey(new Date(t.startDate)) === selectedKey;
                    const onDueDate = t.dueDate && toDateKey(new Date(t.dueDate)) === selectedKey;
                    const isOverdue = onDueDate && t.status !== 'completed' && new Date(t.dueDate) < new Date();
                    return (
                      <div key={t.id} className={`flex items-start gap-2 p-2.5 rounded-lg border ${isOverdue ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' : 'bg-muted/50 border-border/50'}`}>
                        <span className="mt-0.5 shrink-0">{STATUS_ICON[t.status] || <Circle size={14} />}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.planName || `Plano #${t.planId}`}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {onStartDate && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                                Início
                              </span>
                            )}
                            {onDueDate && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
                                {t.status === 'completed' ? 'Concluída' : isOverdue ? 'Atrasada' : 'Prazo'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Active Plans */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Clock size={15} className="text-primary" />
                Planos Ativos
              </h3>
              {(plans || []).filter((p: any) => p.status === 'active').length > 0 ? (
                <div className="space-y-2">
                  {(plans || []).filter((p: any) => p.status === 'active').slice(0, 5).map((p: any) => (
                    <button key={p.id} onClick={() => setLocation(`/plans/${p.id}`)}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.description || 'Sem descrição'}</p>
                      </div>
                    </button>
                  ))}
                  {(plans || []).filter((p: any) => p.status === 'active').length > 5 && (
                    <button onClick={() => setLocation('/plans')} className="text-xs text-primary hover:underline w-full text-center pt-1">
                      Ver todos ({(plans || []).filter((p: any) => p.status === 'active').length})
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
                  { label: 'Planos Ativos', value: (plans || []).filter((p: any) => p.status === 'active').length, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Tarefas c/ data', value: scheduledCount, color: 'text-primary' },
                  { label: 'Tarefas concluídas', value: allTasks.filter(t => t.status === 'completed').length, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Tarefas pendentes', value: allTasks.filter(t => t.status === 'pending').length, color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Tarefas em atraso', value: overdueDateKeys.size, color: 'text-red-600 dark:text-red-400' },
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
