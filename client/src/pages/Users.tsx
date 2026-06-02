import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Edit2, UserX, Search, Eye, EyeOff,
  Shield, Users as UsersIcon, GraduationCap, X, Check, Camera, User, AlertTriangle, Upload, FileSpreadsheet
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

const EMPTY_FORM = { name: "", email: "", username: "", newUsername: "", password: "", role: "estagiario" as Role, department: "", position: "" };

export default function Users() {
  const { user: me } = useAuth();
  const { data: users, refetch } = trpc.users.list.useQuery(undefined, { refetchInterval: 30000 });
  const createUserMutation = trpc.users.create.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();
  const deactivateMutation = trpc.users.deactivate.useMutation();
  const updateUserAvatarMutation = trpc.users.updateUserAvatar.useMutation();
  const bulkImportMutation = trpc.admin.bulkImportUsers.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "all">("all");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);

  const isAdmin = me?.role === "admin";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem demasiado grande (máx. 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarPreview(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview || !editingId) return;
    setSavingAvatar(true);
    try {
      await updateUserAvatarMutation.mutateAsync({ id: editingId, avatar: avatarPreview });
      setCurrentAvatar(avatarPreview);
      toast.success("Foto de perfil atualizada");
      refetch();
    } catch {
      toast.error("Erro ao guardar foto de perfil");
    } finally {
      setSavingAvatar(false);
    }
  };

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
        if (formData.newUsername.trim()) updatePayload.username = formData.newUsername.trim();
        await updateUserMutation.mutateAsync(updatePayload);
        toast.success("Utilizador atualizado com sucesso");
      } else {
        const result = await createUserMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          department: formData.department || undefined,
          position: formData.position || undefined,
          avatar: avatarPreview || undefined,
        });
        if (result.emailSent) {
          toast.success("Utilizador criado. Email enviado para informatica@socem.pt");
        } else {
          toast.success("Utilizador criado com sucesso");
        }
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
      newUsername: user.openId?.replace(/^local-dyn-/, "") || "",
      password: "",
      role: user.role as Role,
      department: user.department || "",
      position: user.position || "",
    });
    setEditingId(user.id);
    setShowForm(true);
    setFormErrors({});
    setAvatarPreview(user.avatar || null);
    setCurrentAvatar(user.avatar || null);
  };

  const handleDeactivate = (userId: number, name: string) => {
    setConfirmDelete({ id: userId, name });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("Ficheiro vazio ou inválido"); return; }
      const headers = lines[0].toLowerCase().split(/[,;\t]/).map(h => h.trim().replace(/"/g, ""));
      const users = lines.slice(1).map(line => {
        const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/"/g, ""));
        const obj: any = {};
        headers.forEach((h, i) => { if (cols[i]) obj[h] = cols[i]; });
        return obj;
      }).filter((u: any) => u.nome || u.name);
      const mapped = users.map((u: any) => ({
        name: u.nome || u.name || "",
        email: u.email || "",
        username: (u.username || u.utilizador || (u.nome || u.name || "").toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]/g, "")),
        password: u.password || u.senha || "socem123",
        role: (u.role || u.funcao || u.perfil || "estagiario").toLowerCase(),
        department: u.department || u.departamento || "",
        position: u.position || u.cargo || u.funcao || "",
      }));
      setImportPreview(mapped);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (importPreview.length === 0) return;
    try {
      const result = await bulkImportMutation.mutateAsync({ users: importPreview });
      toast.success(`${result.created} utilizadores importados. ${result.skipped > 0 ? `${result.skipped} ignorados (duplicados).` : ""}`);
      setShowImport(false);
      setImportPreview([]);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erro na importação");
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deactivateMutation.mutateAsync({ id: confirmDelete.id });
      toast.success(`Utilizador "${confirmDelete.name}" eliminado permanentemente`);
      setConfirmDelete(null);
      refetch();
    } catch {
      toast.error("Erro ao eliminar utilizador");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowPassword(false);
    setAvatarPreview(null);
    setCurrentAvatar(null);
  };

  const countByRole = (role: Role) => users?.filter((u: any) => u.role === role).length ?? 0;

  return (
    <>
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
            <div className="flex gap-2">
              <Button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} />
                Novo Utilizador
              </Button>
              <Button
                onClick={() => setShowImport(true)}
                variant="outline"
                className="gap-2"
              >
                <Upload size={16} />
                Importar CSV
              </Button>
            </div>
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
              {/* Avatar upload */}
              <div className="flex items-center gap-5 p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-slate-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors"
                      title="Alterar foto"
                    >
                      <Camera size={13} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto de Perfil</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">JPG, PNG ou GIF · Máx. 2MB</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-7 px-3"
                      >
                        Escolher Ficheiro
                      </Button>
                      {editingId && avatarPreview && avatarPreview !== currentAvatar && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveAvatar}
                            disabled={savingAvatar}
                            className="text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700"
                          >
                            {savingAvatar ? "A guardar..." : "Guardar Foto"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setAvatarPreview(currentAvatar)}
                            className="text-xs h-7 px-3"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome completo *" error={formErrors.name}>
                  <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ana Silva" />
                </Field>
                <Field label="Email *" error={formErrors.email}>
                  <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="ana@exemplo.com" />
                </Field>
              </div>

              {editingId && (
                <Field label="Nome de utilizador (deixar em branco para manter)" error={formErrors.newUsername}>
                  <Input
                    value={formData.newUsername}
                    onChange={e => setFormData(p => ({ ...p, newUsername: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") }))}
                    placeholder="ana.silva"
                  />
                </Field>
              )}

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
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${ROLE_META[user.role as Role]?.bg ?? "bg-slate-100"}`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-sm font-bold ${ROLE_META[user.role as Role]?.color ?? "text-slate-600"}`}>
                          {(user.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      user.presence === "online" ? "bg-green-500" :
                      user.presence === "ausente" ? "bg-yellow-400" : "bg-slate-400"
                    }`} />
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

      {/* Modal de confirmação de eliminação permanente */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={28} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Eliminar utilizador?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Estás prestes a eliminar <span className="font-semibold text-slate-700 dark:text-slate-200">"{confirmDelete.name}"</span> permanentemente.<br />
                <span className="text-red-500 font-medium">Esta ação não pode ser revertida.</span>
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
              >
                Eliminar permanentemente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={22} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Importar Utilizadores</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowImport(false); setImportPreview([]); }}>
                <X size={18} />
              </Button>
            </div>

            {importPreview.length === 0 ? (
              <div className="text-center py-12">
                <Upload size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">Carrega um ficheiro CSV com colunas:<br/>
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">nome, email, username, password, role, department, position</code></p>
                <input ref={importFileRef} type="file" accept=".csv,.txt" onChange={handleFileImport} className="hidden" />
                <Button onClick={() => importFileRef.current?.click()} className="gap-2">
                  <Upload size={16} /> Selecionar Ficheiro
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-3">{importPreview.length} utilizadores detetados</p>
                <div className="max-h-64 overflow-auto border rounded-lg mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Nome</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Email</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Username</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {importPreview.map((u: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2">{u.name}</td>
                          <td className="px-3 py-2 text-slate-500">{u.email}</td>
                          <td className="px-3 py-2 text-slate-500">{u.username}</td>
                          <td className="px-3 py-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">{u.role}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setImportPreview([]); }}>
                    Cancelar
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleBulkImport}>
                    Importar {importPreview.length} Utilizadores
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
