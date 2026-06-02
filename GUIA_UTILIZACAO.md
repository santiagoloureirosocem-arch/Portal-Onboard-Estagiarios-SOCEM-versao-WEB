# Portal de Estagiários SOCEM - Guia de Utilização

## 🚀 Como Usar a Aplicação

### 1. **Aceder à Aplicação**

- Abra o navegador e aceda a `http://localhost:3000`
- Clique em **"Entrar na Aplicação"** para fazer login
- Será criado automaticamente um utilizador de teste para você

### 2. **Navegação Principal**

A aplicação está organizada numa **sidebar** (coluna da esquerda) com as seguintes opções:

#### **Secção Principal**
- **Dashboard** - Visão geral com estatísticas e ações rápidas
- **Utilizadores** - Gestão de utilizadores (apenas admin)
- **Planos** - Gestão de planos de integração
- **Calendário** - Visualização de prazos e datas
- **Tarefas** - Acompanhamento de tarefas
- **Relatórios** - Análises e estatísticas (apenas admin)

#### **Secção Inferior**
- **Definições** - Configurações pessoais
- **Ajuda** - Guia completo de utilização

---

## 📊 Funcionalidades Principais

### **Dashboard**

O dashboard é a página inicial que mostra:

- **Estagiários Ativos**: Número total de estagiários registados
- **Planos em Curso**: Quantidade de planos ativos
- **Tarefas Pendentes**: Número de tarefas não concluídas
- **Taxa de Conclusão**: Percentagem de tarefas completadas

**Ações Rápidas:**
- Gerir Utilizadores
- Ver Planos
- Novo Plano
- Atribuir Plano

---

### **Gestão de Utilizadores**

Apenas **administradores** podem aceder a esta secção.

#### **Como Criar um Novo Utilizador:**

1. Clique em **"Utilizadores"** na sidebar
2. Clique em **"Novo Utilizador"**
3. Preencha os campos:
   - **Nome**: Nome completo do utilizador
   - **Email**: Endereço de email
   - **Função**: Selecione "Utilizador" ou "Administrador"
4. Clique em **"Criar"**

#### **Como Editar um Utilizador:**

1. Na lista de utilizadores, clique no ícone de **editar** (lápis)
2. Modifique os campos desejados
3. Clique em **"Guardar"**

#### **Como Desativar um Utilizador:**

1. Na lista de utilizadores, clique no ícone de **eliminar** (lixo)
2. Confirme a ação
3. O utilizador será marcado como inativo

---

### **Planos de Integração**

Os planos são estruturas que definem as etapas de onboarding.

#### **Como Criar um Novo Plano:**

1. Clique em **"Planos"** na sidebar ou no dashboard
2. Clique em **"Novo Plano"**
3. Preencha:
   - **Título**: Nome do plano (ex: "Onboarding Desenvolvimento")
   - **Descrição**: Detalhes do plano
4. Clique em **"Criar"**

#### **Como Adicionar Tarefas a um Plano:**

1. Abra o plano clicando em **"Ver Detalhes"**
2. Clique em **"Adicionar Tarefa"**
3. Preencha:
   - **Título**: Nome da tarefa
   - **Descrição**: Detalhes
   - **Data de Conclusão**: Prazo
   - **Responsável**: Quem fará a tarefa
4. Clique em **"Criar"**

#### **Como Atribuir um Plano a um Estagiário:**

1. Clique em **"Atribuir Plano"** (no dashboard ou em Planos)
2. Selecione:
   - **Plano**: Qual plano atribuir
   - **Estagiário(s)**: Um ou mais estagiários
   - **Data de Início**: Quando começa
   - **Data de Conclusão Esperada**: Quando deve terminar
3. Clique em **"Atribuir"**

---

### **Relatórios**

Apenas **administradores** podem aceder a esta secção.

Mostra:
- Taxa de conclusão global
- Estagiários concluídos
- Tempo médio de onboarding
- Progresso por departamento
- Estatísticas mensais
- Estagiários com melhor desempenho

---

### **Definições**

Personalize sua experiência:

- **Perfil**: Veja suas informações (nome, email, função)
- **Notificações**: Ative/desative alertas
- **Segurança**: Gerencie sua conta
- **Privacidade**: Aceda a políticas

---

## 🎯 Fluxo de Trabalho Típico

### **Para um Administrador:**

1. **Criar Utilizadores**
   - Aceda a Utilizadores
   - Crie estagiários e tutores

2. **Criar Planos de Integração**
   - Aceda a Planos
   - Crie novos planos
   - Adicione tarefas a cada plano

3. **Atribuir Planos**
   - Clique em "Atribuir Plano"
   - Selecione estagiários e planos
   - Defina datas

4. **Acompanhar Progresso**
   - Consulte o Dashboard
   - Veja Relatórios
   - Monitore tarefas concluídas

### **Para um Estagiário:**

1. **Ver seu Plano**
   - Aceda a Planos
   - Veja o plano atribuído a você

2. **Acompanhar Tarefas**
   - Veja o progresso das tarefas
   - Marque tarefas como concluídas

3. **Consultar Perfil**
   - Aceda a Perfil
   - Veja seu plano de integração

---

## 💡 Dicas Úteis

1. **Sidebar Redimensionável**: Pode arrastar a borda direita da sidebar para a tornar mais larga ou estreita
2. **Sidebar Colapsável**: Clique no ícone de menu para colapsar/expandir a sidebar
3. **Pesquisa**: Use a barra de pesquisa para encontrar utilizadores ou planos rapidamente
4. **Filtros**: Filtre utilizadores por departamento ou status
5. **Exportar**: Exporte relatórios em PDF ou Excel (em breve)

---

## ❓ Perguntas Frequentes

**P: Como faço login?**
R: Clique em "Entrar na Aplicação" na página inicial. Um utilizador de teste será criado automaticamente.

**P: Posso editar um plano depois de criado?**
R: Sim, clique no ícone de editar no plano que deseja modificar.

**P: Como vejo o progresso de um estagiário?**
R: Aceda ao Dashboard ou veja os Relatórios (apenas admin).

**P: Posso atribuir múltiplos planos a um estagiário?**
R: Sim, pode atribuir quantos planos desejar.

**P: Como desativo um utilizador sem o eliminar?**
R: Clique no ícone de eliminar na lista de utilizadores. O utilizador será marcado como inativo.

---

## 📞 Suporte

Para mais informações ou reportar problemas, contacte o administrador do sistema.

---

**Versão**: 1.0.0  
**Última atualização**: Maio de 2026
