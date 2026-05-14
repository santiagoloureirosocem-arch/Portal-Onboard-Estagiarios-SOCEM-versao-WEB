import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, Lock, User, Shield, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  const handleSaveSettings = () => {
    toast.success("Definições guardadas com sucesso");
  };

  const handleToggleTheme = () => {
    if (toggleTheme) {
      toggleTheme();
      toast.success(`Tema alterado para ${theme === 'light' ? 'escuro' : 'claro'}`);
    }
  };

  return (
    <DashboardLayout title="Definições - Portal de Estagiários SOCEM">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Definições</h1>
          <p className="text-slate-600 mt-1">
            Personalize sua experiência no Portal de Estagiários SOCEM
          </p>
        </div>

        {/* Perfil */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Perfil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome</label>
              <input
                type="text"
                defaultValue={user?.name || ""}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ""}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Função</label>
              <input
                type="text"
                defaultValue={user?.role === "admin" ? "Administrador" : "Utilizador"}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>
          </div>
        </Card>

        {/* Tema */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-indigo-600" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-600" />
            )}
            Aparência
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Tema da Aplicação
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {theme === 'light' ? 'Tema Claro' : 'Tema Escuro'}
                </p>
              </div>
              <Button
                onClick={handleToggleTheme}
                variant="outline"
                className="gap-2"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Escuro
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Claro
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alternar entre tema claro e escuro para melhor conforto visual
            </p>
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Notificações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">
                  Notificações no Sistema
                </p>
                <p className="text-sm text-slate-600">
                  Receba alertas sobre atividades importantes
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Resumo por Email</p>
                <p className="text-sm text-slate-600">
                  Receba um resumo semanal por email
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailDigest}
                onChange={(e) => setEmailDigest(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            Segurança
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-slate-700 mb-3">
                Sua conta está protegida com autenticação OAuth. Para alterar sua
                senha, aceda ao seu perfil na plataforma de autenticação.
              </p>
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Gerir Segurança
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacidade */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Privacidade
          </h2>
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Seus dados pessoais são tratados de acordo com a nossa Política de
              Privacidade. Apenas administradores podem aceder aos seus dados.
            </p>
            <div className="flex gap-3 pt-3">
              <Button variant="outline">Política de Privacidade</Button>
              <Button variant="outline">Termos de Serviço</Button>
            </div>
          </div>
        </Card>

        {/* Ações */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSaveSettings} className="gap-2">
            Guardar Definições
          </Button>
          <Button variant="outline">Cancelar</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
