import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Edit2, UserX, Search, Eye, EyeOff,
  Shield, Users as UsersIcon, GraduationCap, X, Check
} from "lucide-react";
import { toast } from "sonner";

type Role = "estagiario" | "tutor" | "admin";

const ROLE_META: Record<Role, { label: string; icon: any; color: string; bg: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/40" },
  tutor: { label: "Tutor", icon: UsersIcon, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/40" },
  estagiario: { label: "Estagiário", icon: GraduationCap, color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/40" },
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role] ?? ROLE_META.estagiario;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${meta.color} ${meta.bg}`}>
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

const EMPTY_FORM = { name: "", email: "", username: "", password: "", role: "estagiario" as Role, department: "", position: "" };

export default function Users() {
  const { user: me } = useAuth();
  const { data: users, refetch } = trpc.users.list.useQuery();
  const createUserMutation = trpc.users.create.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();
  const deactivateMutation = trpc.users.deactivate.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "all">("all");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isAdmin = me?.role === "admin";

  const filteredUsers = users?.filter((u: any) => {
    const matchSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Nome é obrigatório";
    if (!formData.email.trim()) errs.email = "Email é obrigatório";
    if (!editingId) {
      if (!formData.username.trim()) errs.username = "Username é obrigatório";
      if (!/^[a-z0-9._-]+$/.test(formData.username)) errs.username = "Só letras minúsculas, números, pontos, hífens";
      if (!formData.password) errs.password = "Password é obrigatória";
      if (formData.password.length < 4) errs.password = "Mínimo 4 caracteres";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingId) {
        const updatePayload: any = { id: editingId, name: formData.name, email: formData.email, role: formData.role };
        if (formData.department) updatePayload.department = formData.department;
        if (formData.position) updatePayload.position = formData.position;
        if (formData.password) updatePayload.password = formData.password;
        await updateUserMutation.mutateAsync(updatePayload);
        toast.success("Utilizador atualizado com sucesso");
      } else {
        await createUserMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          department: formData.department || undefined,
          position: formData.position || undefined,
        });
        toast.success("Utilizador criado com sucesso");
      }
      resetForm();
      refetch();
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "Erro ao guardar utilizador";
      toast.error(msg);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      username: "",
      password: "",
      role: user.role as Role,
      department: user.department || "",
      position: user.position || "",
    });
    setEditingId(user.id);
    setShowForm(true);
    setFormErrors({});
  };

  const handleDeactivate = async (userId: number, name: string) => {
    if (!confirm(`Desativar o utilizador "${name}"?`)) return;
    try {
      await deactivateMutation.mutateAsync({ id: userId });
      toast.success("Utilizador desativado");
      refetch();
    } catch {
      toast.error("Erro ao desativar utilizador");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowPassword(false);
  };

  const countByRole = (role: Role) => users?.filter((u: any) => u.role === role).length ?? 0;

  return (
    <DashboardLayout title="Gestão de Utilizadores">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Utilizadores</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {users?.length ?? 0} utilizador(es) registado(s)
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={18} />
              Novo Utilizador
            </Button>
          )}
        </div>

        {/* Role summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {(["admin", "tutor", "estagiario"] as Role[]).map(role => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <button
                key={role}
                onClick={() => setFilterRole(filterRole === role ? "all" : role)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  filterRole === role
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{countByRole(role)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meta.label}{countByRole(role) !== 1 ? "s" : ""}</p>
              </button>
            );
          })}
        </div>

        {/* Form */}
        {showForm && isAdmin && (
          <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Utilizador" : "Novo Utilizador"}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome completo *" error={formErrors.name}>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ana Silva" />
                </Field>
                <Field label="Email *" error={formErrors.email}>
                  <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="ana@exemplo.com" />
                </Field>
              </div>

              {!editingId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Username *" error={formErrors.username}>
                    <Input
                      value={formData.username}
                      onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") }))}
                      placeholder="ana.silva"
                    />
                  </Field>
                  <Field label="Password *" error={formErrors.password}>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                        placeholder="Mínimo 4 caracteres"
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                </div>
              )}

              {editingId && (
                <Field label="Nova Password (deixar em branco para manter)" error={formErrors.password}>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Função *">
                  <select
                    value={formData.role}
                    onChange={e => setFormData(p => ({ ...p, role: e.target.value as Role }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="estagiario">Estagiário</option>
                    <option value="tutor">Tutor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </Field>
                <Field label="Departamento">
                  <Input value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} placeholder="Engenharia" />
                </Field>
                <Field label="Cargo">
                  <Input value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))} placeholder="Estagiário de Software" />
                </Field>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button
                  type="submit"
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  <Check size={16} />
                  {editingId ? "Atualizar" : "Criar Utilizador"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User list */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
          {filteredUsers && filteredUsers.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ROLE_META[user.role as Role]?.bg ?? "bg-slate-100"}`}>
                    <span className={`text-sm font-bold ${ROLE_META[user.role as Role]?.color ?? "text-slate-600"}`}>
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <RoleBadge role={user.role as Role} />
                      {!user.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Inativo</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    {(user.department || user.position) && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {[user.position, user.department].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-1 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(user)} title="Editar">
                        <Edit2 size={15} />
                      </Button>
                      {user.id !== me?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeactivate(user.id, user.name)}
                          title="Desativar"
                        >
                          <UserX size={15} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <UsersIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {searchTerm || filterRole !== "all" ? "Nenhum utilizador encontrado" : "Nenhum utilizador registado"}
              </p>
              {isAdmin && !searchTerm && filterRole === "all" && (
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4 gap-2">
                  <Plus size={16} /> Criar Primeiro Utilizador
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
