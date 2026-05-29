import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Users, CheckCircle2, Clock, AlertTriangle, Smile, Meh, Frown,
  Loader, Activity, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const MOOD_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  great: { icon: Smile, color: "text-green-500", label: "Excelente" },
  good: { icon: Smile, color: "text-blue-500", label: "Bom" },
  okay: { icon: Meh, color: "text-amber-500", label: "Neutro" },
  bad: { icon: Frown, color: "text-orange-500", label: "Mau" },
  terrible: { icon: Frown, color: "text-red-500", label: "Terrível" },
};

const PRESENCE_LABELS: Record<string, string> = {
  online: "Online",
  ausente: "Ausente",
  offline: "Offline",
};

const PRESENCE_COLORS: Record<string, string> = {
  online: "bg-green-500",
  ausente: "bg-amber-500",
  offline: "bg-gray-400",
};

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function TeamPanel() {
  const { data: team, isLoading } = trpc.teamPanel.list.useQuery();

  const stats = {
    total: team?.length ?? 0,
    withOverdue: team?.filter(m => m.overdueTasks > 0).length ?? 0,
    withCheckin: team?.filter(m => m.todayCheckin).length ?? 0,
    avgCompletion: team && team.length > 0
      ? Math.round(team.reduce((acc, m) => acc + m.completionRate, 0) / team.length)
      : 0,
  };

  return (
    <DashboardLayout title="Equipa - Painel de Estagiários | Portal SOCEM">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users size={28} className="text-primary" />
            A Minha Equipa
          </h1>
          <p className="text-muted-foreground mt-2">
            Visão geral dos estagiários — progresso, check-ins e tarefas em atraso
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Estagiários</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.withCheckin}</p>
                <p className="text-xs text-muted-foreground">Check-in hoje</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Activity size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgCompletion}%</p>
                <p className="text-xs text-muted-foreground">Conclusão média</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.withOverdue}</p>
                <p className="text-xs text-muted-foreground">C/ tarefas em atraso</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Team Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : team && team.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map(member => {
              const moodConfig = member.latestCheckin
                ? MOOD_ICONS[member.latestCheckin.mood] ?? null
                : null;
              const MoodIcon = moodConfig?.icon ?? null;
              return (
                <Card key={member.id} className="p-5 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.name?.charAt(0)?.toUpperCase() ?? "?"
                        )}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${PRESENCE_COLORS[member.presence] ?? "bg-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.department ?? "Sem departamento"}
                        {member.position ? ` · ${member.position}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      member.presence === "online"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : member.presence === "ausente"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {PRESENCE_LABELS[member.presence] ?? "Offline"}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Progresso</span>
                      <span className="text-xs font-semibold text-foreground">{member.completionRate}%</span>
                    </div>
                    <ProgressBar value={member.completionRate} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-sm font-bold text-foreground">{member.totalTasks}</p>
                      <p className="text-[10px] text-muted-foreground">Tarefas</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm font-bold text-green-600">{member.completedTasks}</p>
                      <p className="text-[10px] text-green-600/70">Feitas</p>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${member.overdueTasks > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}>
                      <p className={`text-sm font-bold ${member.overdueTasks > 0 ? "text-red-600" : "text-foreground"}`}>{member.overdueTasks}</p>
                      <p className={`text-[10px] ${member.overdueTasks > 0 ? "text-red-600/70" : "text-muted-foreground"}`}>Atrasadas</p>
                    </div>
                  </div>

                  {/* Planos ativos */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Activity size={12} />
                    <span>{member.activePlans} plano{member.activePlans !== 1 ? "s" : ""} ativo{member.activePlans !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Mood / Check-in */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      {MoodIcon ? (
                        <>
                          <MoodIcon size={16} className={moodConfig?.color ?? "text-muted-foreground"} />
                          <span className="text-xs text-muted-foreground">
                            {member.latestCheckin
                              ? format(new Date(member.latestCheckin.date), "d MMM", { locale: pt })
                              : ""}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar size={12} /> Sem check-in recente
                        </span>
                      )}
                    </div>
                    {member.overdueTasks > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={12} />
                        {member.overdueTasks} em atraso
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum estagiário encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Os estagiários aparecerão aqui quando tiverem planos atribuídos.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
