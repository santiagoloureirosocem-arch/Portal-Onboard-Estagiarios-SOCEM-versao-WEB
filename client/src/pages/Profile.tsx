import React from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { User, Mail, Briefcase, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { data: assignments } = trpc.assignments.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

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

  return (
    <DashboardLayout title="Meu Perfil">
      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="card-elevated p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={40} className="text-primary" />
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
            <div className="text-right">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  user?.role === 'admin'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary/20 text-secondary'
                }`}
              >
                {user?.role === 'admin' ? 'Administrador' : 'Estagiário'}
              </span>
            </div>
          </div>
        </Card>

        {/* Integration Plans */}
        <div>
          <h2 className="text-2xl font-playfair font-bold text-foreground mb-4">
            Meus Planos de Integração
          </h2>

          {assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment: any) => (
                <Card key={assignment.id} className="card-elevated p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          Plano #{assignment.planId}
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
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {assignment.status === 'active'
                          ? 'Em Progresso'
                          : assignment.status === 'completed'
                          ? 'Concluído'
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
