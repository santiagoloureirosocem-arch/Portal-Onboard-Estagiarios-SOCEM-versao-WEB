import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, Lock, User, Moon, Sun, Eye, EyeOff, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function PasswordInput({ value, onChange, placeholder, show, onToggle }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative mt-1">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "estagiario");
  const [saving, setSaving] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any)?.avatar || null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAdmin = user?.role === "admin";

  const updateSelfMutation = trpc.users.updateSelf.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();
  const changePasswordMutation = trpc.users.changePassword.useMutation();
  const updateAvatarMutation = trpc.auth.updateAvatar.useMutation();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem não pode ter mais de 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setSavingAvatar(true);
    try {
      await updateAvatarMutation.mutateAsync({ avatar: avatarPreview });
      if (refresh) await refresh();
      toast.success("Foto de perfil atualizada");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao guardar foto");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateSelfMutation.mutateAsync({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });
      if (isAdmin && role !== user.role) {
        await updateUserMutation.mutateAsync({ id: user.id, role: role as any });
      }
      if (refresh) await refresh();
      toast.success("Perfil atualizado com sucesso");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Preenche todos os campos de password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As passwords novas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova password deve ter pelo menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast.success("Password alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout title="Definições">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Definições</h1>
          <p className="text-muted-foreground mt-1">Personaliza a tua experiência no portal</p>
        </div>

        {/* Foto de Perfil */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Camera size={17} className="text-primary" /> Foto de Perfil
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-primary" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Escolhe uma foto</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP. Máximo 2MB.</p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar || !avatarPreview || avatarPreview === (user as any)?.avatar}
                >
                  {savingAvatar ? "A guardar..." : "Guardar Foto"}
                </Button>
                {avatarPreview && avatarPreview !== (user as any)?.avatar && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAvatarPreview((user as any)?.avatar || null)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Perfil */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User size={17} className="text-primary" /> Perfil
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="O seu nome" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="O seu email" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              Função {!isAdmin && <span className="text-xs text-muted-foreground">(só admins podem alterar)</span>}
            </label>
            {isAdmin ? (
              <select value={role} onChange={e => setRole(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                <option value="estagiario">Estagiário</option>
                <option value="tutor">Tutor</option>
                <option value="admin">Administrador</option>
              </select>
            ) : (
              <p className="mt-1 px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground text-sm capitalize">
                {user?.role === "estagiario" ? "Estagiário" : user?.role === "tutor" ? "Tutor" : user?.role}
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-1.5">
              {saving ? "A guardar..." : "Guardar Perfil"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              setName(user?.name || ""); setEmail(user?.email || ""); setRole(user?.role || "estagiario");
            }}>Cancelar</Button>
          </div>
        </Card>

        {/* Password */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Lock size={17} className="text-primary" /> Alterar Password
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Password atual</label>
              <PasswordInput value={currentPassword} onChange={setCurrentPassword}
                placeholder="A tua password atual" show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nova password</label>
              <PasswordInput value={newPassword} onChange={setNewPassword}
                placeholder="Mínimo 6 caracteres" show={showNew} onToggle={() => setShowNew(v => !v)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Confirmar nova password</label>
              <PasswordInput value={confirmPassword} onChange={setConfirmPassword}
                placeholder="Repete a nova password" show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">As passwords não coincidem</p>
              )}
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword} size="sm" variant="outline" className="gap-1.5">
            {savingPassword ? "A alterar..." : "Alterar Password"}
          </Button>
        </Card>

        {/* Aparência */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            {theme === "dark" ? <Moon size={17} className="text-primary" /> : <Sun size={17} className="text-primary" />}
            Aparência
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Tema da Aplicação</p>
              <p className="text-xs text-muted-foreground mt-0.5">{theme === "light" ? "Tema Claro ativo" : "Tema Escuro ativo"}</p>
            </div>
            <Button onClick={() => { if (toggleTheme) { toggleTheme(); toast.success(`Tema ${theme === "light" ? "escuro" : "claro"} ativado`); } }}
              variant="outline" size="sm" className="gap-2">
              {theme === "light" ? <><Moon size={15} /> Escuro</> : <><Sun size={15} /> Claro</>}
            </Button>
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Bell size={17} className="text-primary" /> Notificações
          </h2>
          <div className="space-y-4">
            {[
              { label: "Notificações no Sistema", desc: "Alertas sobre atividades importantes", value: notificationsEnabled, set: setNotificationsEnabled },
              { label: "Resumo por Email", desc: "Resumo semanal das atividades", value: emailDigest, set: setEmailDigest },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <button onClick={() => { item.set(!item.value); toast.success(`${item.label} ${!item.value ? "ativado" : "desativado"}`); }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
