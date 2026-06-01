import React, { useState, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Briefcase, Calendar, CheckCircle, Clock, Settings, Award, Download, FileText, Heart, Star, Flame, Trophy, Zap, BadgeCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

async function downloadCertificate(userName: string, department: string, plansCompleted: number) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Border decorativa
    doc.setDrawColor(204, 0, 0);
    doc.setLineWidth(3);
    doc.rect(10, 10, pageW - 20, pageH - 20);
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, pageW - 26, pageH - 26);

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(204, 0, 0);
    doc.text("SOCEM", pageW / 2, 50, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(80);
    doc.text("Certificado de Conclusão", pageW / 2, 65, { align: "center" });

    // Texto principal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(60);
    const textLines = [
      "Certificamos que",
    ];
    textLines.forEach((line, i) => {
      doc.text(line, pageW / 2, 85 + i * 8, { align: "center" });
    });

    // Nome do estagiário
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(26, 26, 26);
    doc.text(userName || "Estagiário", pageW / 2, 100, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(60);
    const moreLines = [
      `concluiu com sucesso ${plansCompleted} plano(s) de integração no`,
      "departamento de " + (department || "Integração"),
      "da SOCEM, demonstrando dedicação e competência.",
    ];
    moreLines.forEach((line, i) => {
      doc.text(line, pageW / 2, 118 + i * 8, { align: "center" });
    });

    // Data
    const today = new Date();
    const dateStr = today.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Lisboa, ${dateStr}`, pageW / 2, 155, { align: "center" });

    // Linha de assinatura
    doc.setDrawColor(150);
    doc.setLineWidth(0.5);
    doc.line(pageW / 2 - 40, 175, pageW / 2 + 40, 175);
    doc.setFontSize(10);
    doc.text("Direção SOCEM", pageW / 2, 182, { align: "center" });

    doc.save(`Certificado_SOCEM_${(userName || "Estagiario").replace(/\s+/g, "_")}.pdf`);
  } catch {
    toast.error("Erro ao gerar certificado. Tenta novamente.");
  }
}

const MOOD_EMOJI: Record<string, string> = {
  great: '😄', good: '🙂', okay: '😐', bad: '😟', terrible: '😢',
};
const MOOD_VALUE: Record<string, number> = {
  great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
};
const MOOD_COLOR: Record<string, string> = {
  great: '#22c55e', good: '#86efac', okay: '#facc15', bad: '#f97316', terrible: '#ef4444',
};

function ProfileMoodChart() {
  const { data: checkins } = trpc.dailyCheckins.history.useQuery({ limit: 30 });

  const chartData = useMemo(() => {
    if (!checkins) return [];
    const days: { date: string; mood: number; label: string; emoji: string; fill: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const checkin = (checkins as any[]).find((c: any) => {
        const cd = new Date(c.date);
        return `${cd.getFullYear()}-${String(cd.getMonth()+1).padStart(2,'0')}-${String(cd.getDate()).padStart(2,'0')}` === key;
      });
      days.push({
        date: key,
        mood: checkin ? MOOD_VALUE[checkin.mood] || 0 : 0,
        label: d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        emoji: checkin ? MOOD_EMOJI[checkin.mood] || '' : '',
        fill: checkin ? MOOD_COLOR[checkin.mood] || '#e5e7eb' : '#e5e7eb',
      });
    }
    return days;
  }, [checkins]);

  if (!checkins || checkins.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="font-bold text-foreground text-base mb-1 flex items-center gap-2">
        <Heart size={18} className="text-red-400" />
        Meu Humor (últimos 30 dias)
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        A evolução do teu humor ao longo dos últimos dias. Fazer check-in diário ajuda a perceber o teu bem-estar.
      </p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#888' }}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
                    <p className="font-medium text-foreground">{d.date}</p>
                    <p className="text-muted-foreground">{d.mood > 0 ? `${d.emoji} Valor: ${d.mood}/5` : 'Sem check-in'}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="mood" radius={[3, 3, 0, 0]} maxBarSize={12}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
        <span>😢</span><div className="w-6 h-1.5 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400" /><span>😄</span>
      </div>
    </Card>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: assignments } = trpc.assignments.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );
  const { data: certStatus } = trpc.dashboard.certificateStatus.useQuery();
  const { data: badges } = trpc.dashboard.myBadges.useQuery();
  const { data: streak } = trpc.dashboard.myStreak.useQuery();
  const { data: checkins } = trpc.dailyCheckins.history.useQuery({ limit: 30 });
  const [downloading, setDownloading] = useState(false);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const avatar = (user as any)?.avatar;

  return (
    <DashboardLayout title="Meu Perfil">
      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="card-elevated p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-playfair font-bold text-foreground">
                {user?.name || 'Utilizador'}
              </h1>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={16} />
                  <span>{user?.email}</span>
                </div>
                {user?.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase size={16} />
                    <span>{user.department}</span>
                  </div>
                )}
                {user?.position && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase size={16} />
                    <span>{user.position}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  user?.role === 'admin'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary/20 text-secondary'
                }`}
              >
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'tutor' ? 'Tutor' : 'Estagiário'}
              </span>
              <Button variant="outline" size="sm" onClick={() => setLocation('/settings')} className="gap-2">
                <Settings size={14} /> Editar Perfil
              </Button>
            </div>
          </div>
        </Card>

        {/* Integration Plans */}
        <div>
          <h2 className="text-2xl font-playfair font-bold text-foreground mb-4">
            Meus Planos de Integração
          </h2>

          {assignments && assignments.filter((a: any) => a.status === 'active' || a.status === 'completed').length > 0 ? (
            <div className="space-y-4">
              {assignments.filter((a: any) => a.status === 'active' || a.status === 'completed').map((assignment: any) => (
                <Card key={assignment.id} className="card-elevated p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {assignment.planTitle ?? `Plano #${assignment.planId}`}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>
                              Início: {new Date(assignment.startDate).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                          {assignment.expectedEndDate && (
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>
                                Fim: {new Date(assignment.expectedEndDate).toLocaleDateString('pt-PT')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          assignment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : assignment.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {assignment.status === 'active'
                          ? 'Em Progresso'
                          : assignment.status === 'completed'
                          ? 'Concluído'
                          : assignment.status === 'cancelled'
                          ? 'Cancelado'
                          : 'Pausado'}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          Progresso
                        </span>
                        <span className={`text-sm font-semibold ${getProgressColor(assignment.progress)}`}>
                          {assignment.progress}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressBarColor(assignment.progress)} transition-all duration-300`}
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tarefas Concluídas</p>
                          <p className="text-lg font-semibold text-foreground">
                            {Math.floor((assignment.progress / 100) * 10)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tarefas Pendentes</p>
                          <p className="text-lg font-semibold text-foreground">
                            {Math.ceil((100 - assignment.progress) / 100 * 10)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-elevated p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum plano de integração atribuído ainda.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Contacte o administrador para ser atribuído a um plano.
              </p>
            </Card>
          )}
        </div>

        {/* Certificado */}
        {user?.role === 'estagiario' && certStatus && (
          <Card className={`p-6 border-2 ${certStatus.eligible ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/10'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${certStatus.eligible ? 'bg-green-500/10' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <Award size={28} className={certStatus.eligible ? 'text-green-600' : 'text-slate-400'} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-base">
                  {certStatus.eligible ? 'Certificado de Conclusão' : 'Progresso para Certificado'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {certStatus.eligible
                    ? 'Parabéns! Concluíste todos os teus planos de integração. Já podes descarregar o teu certificado.'
                    : `Concluíste ${certStatus.completedPlans} de ${certStatus.totalPlans} plano(s) de integração.`
                  }
                </p>
                <div className="mt-3">
                  {certStatus.totalPlans > 0 && (
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full transition-all ${certStatus.eligible ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${(certStatus.completedPlans / certStatus.totalPlans) * 100}%` }} />
                    </div>
                  )}
                  <Button
                    onClick={async () => {
                      setDownloading(true);
                      await downloadCertificate(user.name || 'Estagiário', user.department || 'Integração', certStatus.completedPlans);
                      setDownloading(false);
                    }}
                    disabled={!certStatus.eligible || downloading}
                    size="sm"
                    className={`gap-2 ${certStatus.eligible ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {downloading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    {certStatus.eligible ? 'Descarregar Certificado' : 'Completa todos os planos para obteres o teu certificado'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Conquistas */}
        <Card className="p-6">
            <h2 className="text-2xl font-playfair font-bold text-foreground mb-1 flex items-center gap-2">
              <Trophy size={22} className="text-amber-500" />
              Conquistas
            </h2>
            <p className="text-sm text-muted-foreground mb-6">As tuas conquistas, sequência de check-ins e estado de humor.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Badges */}
              <div className="space-y-3">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Award size={16} className="text-amber-500" />
                  Distintivos
                </h3>
                {badges && badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                          <Star size={18} className="text-white fill-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 truncate">{b.label}</p>
                          {b.description && <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 truncate">{b.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                    <Award size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-400">Nenhum distintivo ainda</p>
                    <p className="text-xs text-slate-400 mt-1">Faz check-ins diários para ganhares distintivos!</p>
                  </div>
                )}
              </div>

              {/* Streak + Check-in Stats */}
              <div className="space-y-3">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  Sequência
                </h3>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/20 border border-orange-200 dark:border-orange-800/50">
                  <div className="relative shrink-0">
                    <Flame size={48} className="text-orange-500" />
                    <span className="absolute -top-1 -right-1 text-sm font-bold text-orange-600 dark:text-orange-400">{streak?.currentStreak || 0}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-800 dark:text-orange-300">{streak?.currentStreak || 0} dias</p>
                    <p className="text-xs text-orange-600/70 dark:text-orange-400/70">sequência atual</p>
                    <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">Recorde: {streak?.longestStreak || 0} dias</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Zap size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{checkins?.length || 0}</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">check-ins registados no total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mood trend mini-chart */}
            {checkins && checkins.length > 0 && <ProfileMoodChart />}
          </Card>

        {/* Info Section */}
        <Card className="card-elevated p-6 bg-accent/5 border-accent/20">
          <h3 className="font-semibold text-foreground mb-2">
            📋 Sobre o Plano de Integração
          </h3>
          <p className="text-sm text-muted-foreground">
            O seu plano de integração contém todas as tarefas e etapas necessárias para 
            uma integração bem-sucedida. Acompanhe o seu progresso e conclua as tarefas 
            conforme indicado.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
