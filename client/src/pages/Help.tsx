import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  CheckCircle2,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

export default function Help() {
  return (
    <DashboardLayout title="Ajuda - Portal de Estagiários SOCEM">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Guia de Utilização
          </h1>
          <p className="text-slate-600">
            Aprenda como utilizar o Portal de Estagiários SOCEM de forma eficiente
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="dashboard" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Utilizadores</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="text-xs">
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Planos</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Definições</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Dashboard
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>O que é:</strong> A página inicial que mostra um resumo
                  de toda a atividade do portal.
                </p>
                <p>
                  <strong>Funcionalidades:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Estagiários Ativos:</strong> Número total de
                    estagiários registados e ativos no sistema
                  </li>
                  <li>
                    <strong>Planos em Curso:</strong> Quantidade de planos de
                    integração atualmente ativos
                  </li>
                  <li>
                    <strong>Tarefas Pendentes:</strong> Número de tarefas que
                    ainda não foram concluídas
                  </li>
                  <li>
                    <strong>Taxa de Conclusão:</strong> Percentagem de tarefas
                    completadas
                  </li>
                </ul>
                <p className="mt-4">
                  <strong>Ações Rápidas:</strong> Aceda rapidamente a Gerir
                  Utilizadores, Ver Planos, Criar Novo Plano ou Atribuir Plano.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Gestão de Utilizadores
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>O que é:</strong> Área onde pode gerir todos os
                  utilizadores do sistema (estagiários, tutores e administradores).
                </p>
                <p>
                  <strong>Funcionalidades:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Listar Utilizadores:</strong> Veja todos os
                    utilizadores registados
                  </li>
                  <li>
                    <strong>Criar Novo Utilizador:</strong> Clique em "Novo
                    Utilizador" para adicionar um novo membro
                  </li>
                  <li>
                    <strong>Editar:</strong> Modifique informações do utilizador
                    (nome, email, função)
                  </li>
                  <li>
                    <strong>Desativar:</strong> Desative uma conta sem a eliminar
                  </li>
                </ul>
                <p className="mt-4">
                  <strong>Dica:</strong> Apenas administradores podem gerir
                  utilizadores.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Planos de Integração
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>O que é:</strong> Planos estruturados que definem as
                  etapas e tarefas para o onboarding de estagiários.
                </p>
                <p>
                  <strong>Funcionalidades:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Ver Planos:</strong> Consulte todos os planos
                    disponíveis
                  </li>
                  <li>
                    <strong>Criar Plano:</strong> Clique em "Novo Plano" para
                    criar um novo plano de integração
                  </li>
                  <li>
                    <strong>Editar Plano:</strong> Modifique título, descrição e
                    tarefas
                  </li>
                  <li>
                    <strong>Ver Detalhes:</strong> Consulte todas as tarefas e
                    progresso
                  </li>
                  <li>
                    <strong>Atribuir Plano:</strong> Associe um plano a um ou
                    mais estagiários
                  </li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Gestão de Tarefas
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>O que é:</strong> Tarefas individuais que compõem um
                  plano de integração.
                </p>
                <p>
                  <strong>Funcionalidades:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Criar Tarefa:</strong> Adicione tarefas a um plano
                  </li>
                  <li>
                    <strong>Definir Prazos:</strong> Estabeleça datas de
                    conclusão
                  </li>
                  <li>
                    <strong>Atribuir Responsável:</strong> Designe um estagiário
                    para a tarefa
                  </li>
                  <li>
                    <strong>Acompanhar Progresso:</strong> Veja o status de cada
                    tarefa (Pendente, Em Progresso, Concluída)
                  </li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Calendário
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>O que é:</strong> Visualização de todas as datas
                  importantes e prazos dos planos de integração.
                </p>
                <p>
                  <strong>Funcionalidades:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Ver Prazos:</strong> Consulte todas as datas de
                    conclusão
                  </li>
                  <li>
                    <strong>Filtrar por Estagiário:</strong> Veja apenas os
                    prazos de um estagiário específico
                  </li>
                  <li>
                    <strong>Alertas:</strong> Receba notificações de prazos
                    próximos
                  </li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Definições
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>O que é:</strong> Configurações pessoais e do sistema.
                </p>
                <p>
                  <strong>Funcionalidades:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Perfil:</strong> Edite suas informações pessoais
                  </li>
                  <li>
                    <strong>Preferências:</strong> Personalize a experiência do
                    portal
                  </li>
                  <li>
                    <strong>Notificações:</strong> Controle quais alertas deseja
                    receber
                  </li>
                  <li>
                    <strong>Segurança:</strong> Gerencie sua senha e sessões
                  </li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-2">💡 Dicas Úteis</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              • Use a barra de pesquisa para encontrar rapidamente utilizadores
              ou planos
            </li>
            <li>
              • Clique nos ícones de ação (editar, eliminar) para gerir itens
            </li>
            <li>
              • A sidebar pode ser redimensionada arrastando a borda direita
            </li>
            <li>• Utilize o menu de perfil para sair ou acessar definições</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
