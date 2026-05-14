import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Eye, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface PlanFormData {
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  assignedToUserId: number | null;
}

export default function Plans() {
  const { user } = useAuth();
  const isIntern = user?.role === 'estagiario';
  const canEdit = user?.role === 'admin' || user?.role === 'tutor';

  const { data: plans, isLoading, refetch } = trpc.plans.list.useQuery();
  const { data: allUsers } = trpc.users.list.useQuery(undefined, { enabled: canEdit });
  const createPlanMutation = trpc.plans.create.useMutation();
  const updatePlanMutation = trpc.plans.update.useMutation();
  const deletePlanMutation = trpc.plans.delete.useMutation();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    title: '', description: '', status: 'draft', assignedToUserId: null,
  });

  // Only show estagiários in the user selector
  const estagiarios = (allUsers || []).filter((u: any) => u.role === 'estagiario' && u.isActive !== false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePlanMutation.mutateAsync({ id: editingId, title: formData.title, description: formData.description, status: formData.status });
        toast.success('Plano atualizado com sucesso');
      } else {
        await createPlanMutation.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          assignedToUserId: formData.assignedToUserId || undefined,
        });
        toast.success(formData.assignedToUserId ? 'Plano criado e atribuído com sucesso' : 'Plano criado com sucesso');
      }
      setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch {
      toast.error('Erro ao guardar plano');
    }
  };

  const handleEdit = (plan: any) => {
    setFormData({ title: plan.title, description: plan.description || '', status: plan.status, assignedToUserId: null });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePlanMutation.mutateAsync({ id });
      toast.success('Plano eliminado');
      setConfirmDeleteId(null);
      refetch();
    } catch {
      toast.error('Erro ao eliminar plano');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'draft': return 'Rascunho';
      case 'archived': return 'Arquivado';
      default: return status;
    }
  };

  return (
    <DashboardLayout title="Planos de Integração">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isIntern ? 'Os Meus Planos' : 'Planos de Integração'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isIntern ? 'Planos de onboarding atribuídos a ti' : 'Crie e gira os planos de onboarding'}
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => {
              setShowForm(!showForm);
              if (showForm) { setEditingId(null); setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null }); }
            }} className="gap-2">
              <Plus size={20} /> Novo Plano
            </Button>
          )}
        </div>

        {showForm && canEdit && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">{editingId ? 'Editar Plano' : 'Criar Novo Plano'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Título do Plano *" name="title" value={formData.title} onChange={handleInputChange} required />
              <textarea
                placeholder="Descrição" name="description" value={formData.description} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                rows={4}
              />
              {editingId && (
                <select name="status" value={formData.status} onChange={handleInputChange}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground w-full">
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativo</option>
                  <option value="completed">Concluído</option>
                  <option value="archived">Arquivado</option>
                </select>
              )}
              {/* Assign to user — only when creating */}
              {!editingId && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <User size={14} />
                    Atribuir a estagiário <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <select
                    name="assignedToUserId"
                    value={formData.assignedToUserId ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, assignedToUserId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">— Sem atribuição por agora —</option>
                    {estagiarios.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  {estagiarios.length === 0 && (
                    <p className="text-xs text-muted-foreground">Não há estagiários disponíveis. Crie um utilizador com o papel de Estagiário primeiro.</p>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                  {editingId ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', status: 'draft', assignedToUserId: null }); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-muted-foreground py-8">Carregando planos...</div>
          ) : plans && plans.length > 0 ? (
            plans.map((plan: any) => (
              <Card key={plan.id} className="p-6 flex flex-col">
                {confirmDeleteId === plan.id ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-foreground font-medium">Eliminar "{plan.title}"?</p>
                    <p className="text-sm text-muted-foreground">Esta ação não pode ser revertida.</p>
                    <div className="flex gap-2">
                      <Button variant="destructive" className="flex-1" onClick={() => handleDelete(plan.id)}>Eliminar</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-foreground flex-1">{plan.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(plan.status)}`}>
                        {getStatusLabel(plan.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{plan.description || 'Sem descrição'}</p>
                    <div className={`flex gap-2 pt-4 border-t border-border ${isIntern ? '' : ''}`}>
                      <button onClick={() => setLocation(`/plans/${plan.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        <Eye size={16} /> Ver
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => handleEdit(plan)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
                            <Edit2 size={16} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => setConfirmDeleteId(plan.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground font-medium mb-1">
                {isIntern ? 'Ainda não tens planos atribuídos' : 'Nenhum plano encontrado'}
              </p>
              {isIntern && <p className="text-sm text-muted-foreground">O teu tutor irá atribuir-te um plano em breve.</p>}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
