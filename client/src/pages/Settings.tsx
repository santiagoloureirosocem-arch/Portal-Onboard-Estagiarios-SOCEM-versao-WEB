import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, Lock, User, Shield, Moon, Sun, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "estagiario");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const updateSelfMutation = trpc.users.updateSelf.useMutation();
  const updateUserMutation = trpc.users.update.useMutation();

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateSelfMutation.mutateAsync({
        name: name || undefined,
        email: email || undefined,
      });

      if (isAdmin && role !== user.role) {
        await updateUserMutation.mutateAsync({ id: user.id, role: role as any });
      }

      toast.success("Perfil atualizado com sucesso");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTheme = () => {
    if (toggleTheme) {
      toggleTheme();
      toast.success(`Tema alterado para ${theme === "light" ? "escuro" : "claro"}`);
    }
  };

  return (
    <DashboardLayout title="Definições - Portal de Estagiários SOCEM">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Definições</h1>
          <p className="text-muted-foreground mt-1">
            Personalize a sua experiência no Portal de Estagiários SOCEM
          </p>
        </div>

        {/* Perfil */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Perfil
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="O seu nome"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="O seu email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Função
                {!isAdmin && (
                  <span className="ml-2 text-xs text-muted-foreground">(apenas administradores podem alterar)</span>
                )}
              </label>
              {isAdmin ? (
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="estagiario">Estagiário</option>
                  <option value="tutor">Tutor</option>
                  <option value="admin">Administrador</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={{ admin: "Administrador", tutor: "Tutor", estagiario: "Estagiário" }[user?.role ?? "estagiario"] ?? user?.role ?? ""}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                  disabled
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "A guardar..." : "Guardar Perfil"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setName(user?.name || "");
                setEmail(user?.email || "");
                setRole(user?.role || "estagiario");
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>

        {/* Tema */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-indigo-600" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-600" />
            )}
            Aparência
          </h2>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div>
              <p className="font-medium text-foreground">Tema da Aplicação</p>
              <p className="text-sm text-muted-foreground">
                {theme === "light" ? "Tema Claro" : "Tema Escuro"}
              </p>
            </div>
            <Button onClick={handleToggleTheme} variant="outline" className="gap-2">
              {theme === "light" ? (
                <><Moon className="h-4 w-4" />Escuro</>
              ) : (
                <><Sun className="h-4 w-4" />Claro</>
              )}
            </Button>
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Notificações
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Notificações no Sistema</p>
                <p className="text-sm text-muted-foreground">Receba alertas sobre atividades importantes</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={e => setNotificationsEnabled(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Resumo por Email</p>
                <p className="text-sm text-muted-foreground">Receba um resumo semanal por email</p>
              </div>
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={e => setEmailDigest(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            Segurança
          </h2>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-foreground mb-3">
              A sua conta está protegida. Para alterar a sua senha, contacte o administrador.
            </p>
            <Button variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              Gerir Segurança
            </Button>
          </div>
        </Card>

        {/* Privacidade */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Privacidade</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Os seus dados pessoais são tratados de acordo com a nossa Política de Privacidade.
            </p>
            <div className="flex gap-3 pt-3">
              <Button variant="outline">Política de Privacidade</Button>
              <Button variant="outline">Termos de Serviço</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
