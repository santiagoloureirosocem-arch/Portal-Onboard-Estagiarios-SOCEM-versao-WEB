import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignPlan() {
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const assignMutation = trpc.assignments.assign.useMutation();

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');

  const handleToggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (!selectedPlan || selectedUsers.length === 0 || !startDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await assignMutation.mutateAsync({
          planId: selectedPlan,
          userId,
          startDate: new Date(startDate),
          expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
        });
      }
      toast.success(`Plano atribuído a ${selectedUsers.length} utilizador(es)`);
      setSelectedPlan(null);
      setSelectedUsers([]);
      setStartDate('');
      setExpectedEndDate('');
    } catch (error) {
      toast.error('Erro ao atribuir plano');
    }
  };

  return (
    <DashboardLayout title="Atribuir Plano">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-foreground">
            Atribuir Plano de Integração
          </h1>
          <p className="text-muted-foreground mt-2">
            Selecione um plano e os estagiários para atribuição
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Selection */}
          <div className="lg:col-span-1">
            <Card className="card-elevated p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Selecione o Plano
              </h2>
              <div className="space-y-2">
                {plans && plans.length > 0 ? (
                  plans.map((plan: any) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedPlan === plan.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-foreground">{plan.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.status === 'active' ? 'Ativo' : 'Rascunho'}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhum plano disponível
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* User Selection & Dates */}
          <div className="lg:col-span-2">
            <Card className="card-elevated p-6 space-y-6">
              {/* Dates */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Datas de Atribuição
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Data de Início *
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Data de Fim Esperada
                    </label>
                    <Input
                      type="date"
                      value={expectedEndDate}
                      onChange={(e) => setExpectedEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Users Selection */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Selecione os Estagiários
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users && users.length > 0 ? (
                    users.map((user: any) => (
                      <button
                        key={user.id}
                        onClick={() => handleToggleUser(user.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors flex items-center justify-between ${
                          selectedUsers.includes(user.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <Check size={20} className="text-primary" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Nenhum utilizador disponível
                    </p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Resumo:</strong> Atribuir plano a{' '}
                  <strong>{selectedUsers.length}</strong> utilizador(es)
                </p>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleAssign}
                disabled={!selectedPlan || selectedUsers.length === 0 || !startDate}
                className="w-full gap-2"
              >
                <Plus size={20} />
                Atribuir Plano
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
