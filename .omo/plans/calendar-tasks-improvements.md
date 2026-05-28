# Calendário e Tarefas - Melhorias

## TL;DR

> **Quick Summary**: Adicionar data de início às tarefas, melhorar visibilidade dos marcadores do calendário, e mostrar datas dos planos diretamente no calendário sem criar tarefas automáticas.
>
> **Deliverables**:
> - `drizzle/schema.ts` — startDate em tasks, startDate/endDate em plans
> - `server/db.ts` — CRUD atualizado para startDate, SQL tables atualizadas
> - `server/routers.ts` — endpoints atualizados, remoção de auto-tasks
> - `client/src/pages/Tasks.tsx` — formulário + display com startDate
> - `client/src/pages/PlanDetail.tsx` — formulário + display com startDate
> - `client/src/pages/Plans.tsx` — datas de plano funcionais sem criar tarefas
> - `client/src/pages/Calendar.tsx` — marcadores maiores + planos no calendário
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Schema → Backend → Frontend Forms → Calendar

---

## Context

### Original Request
Utilizador pediu 3 melhorias no calendário/tarefas:
1. Tarefas devem ter data de início **e** data de fim
2. Marcadores no calendário estão praticamente invisíveis
3. Planos com datas não devem criar tarefas — só aparecer no calendário

### Interview Summary
**Decisões**:
- **startDate**: Opcional (como dueDate)
- **Marcadores**: Maiores (10-12px) + efeito de brilho/ring
- **Tarefas no calendário**: Marcadores nos extremos (início/fim), não barra
- **Planos no calendário**: Marcadores especiais (verde início, roxo fim)
- **Testes**: Não (sem testes unitários)

**Ficheiros a alterar**:
- `drizzle/schema.ts` — schema Drizzle
- `server/db.ts` — SQL init e CRUD + fallback in-memory
- `server/routers.ts` — tRPC endpoints
- `client/src/pages/Tasks.tsx` — Kanban + Lista de tarefas
- `client/src/pages/PlanDetail.tsx` — Detalhe do plano
- `client/src/pages/Plans.tsx` — Lista de planos (já tem datas no form)
- `client/src/pages/Calendar.tsx` — Calendário
- `data/local-db.json` — Formato de dados local (atualização implícita)

---

## Work Objectives

### Core Objective
Implementar data de início nas tarefas e melhorar a visualização de datas no calendário.

### Concrete Deliverables
- Tarefas passam a ter `startDate` + `dueDate` (data de fim)
- Calendário mostra marcadores visíveis e diferenciados (tarefas, planos)
- Criação de planos com datas NÃO gera tarefas automáticas
- Datas dos planos aparecem como marcadores especiais no calendário

### Must Have
- Schema atualizado com startDate em tasks e startDate/endDate em plans
- CRUD completo para startDate (criar, listar, atualizar tarefas)
- Formulários de criação/edição de tarefas com campo startDate
- Remoção da criação automática de tarefas marco nos planos
- Calendário com marcadores >=10px com glow/ring
- Calendário com marcadores especiais para planos (verde=início, roxo=fim)
- Calendário com marcador para startDate das tarefas (teal/cyan)

### Must NOT Have (Guardrails)
- Não modificar autenticação/autorização
- Não modificar mensagens, ficheiros, comentários
- Não adicionar testes
- Não quebrar o drag-and-drop das tarefas (Kanban)
- Não quebrar a atribuição de planos a utilizadores

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — TODA a verificação é executada pelo agente.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: None
- **QA Policy**: Agent-executed QA scenarios apenas (sem testes unitários)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — schema + backend foundation):
├── Task 1: Schema Drizzle — startDate em tasks + dates em plans
├── Task 2: db.ts SQL init — ALTER TABLE para novas colunas
├── Task 3: db.ts CRUD tasks — adicionar startDate nas operações
└── Task 4: db.ts CRUD plans — adicionar startDate/endDate nas operações

Wave 2 (After Wave 1 — backend API + remoção auto-tasks):
├── Task 5: routers.ts tasks — adicionar startDate nos endpoints
├── Task 6: routers.ts plans — remover auto-tasks, salvar dates no plano
└── Task 7: routers.ts plans.list — incluir dates na resposta

Wave 3 (After Wave 2 — frontend forms):
├── Task 8: Tasks.tsx — AddTaskForm + KanbanCard + TaskPanel + ListView (startDate)
├── Task 9: PlanDetail.tsx — formulário tarefa + display (startDate)
└── Task 10: Calendar.tsx ScheduleTaskModal — adicionar startDate

Wave 4 (After Wave 3 — calendário markers):
├── Task 11: Calendar.tsx — marcadores maiores com glow
├── Task 12: Calendar.tsx — marcadores para planos (startDate/endDate)
└── Task 13: Calendar.tsx — marcador para task.startDate (teal)

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 3 → Task 5 → Task 8 → Task 11 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

- **1**: - → 2, 3, 4
- **2**: 1 → 6
- **3**: 1 → 5
- **4**: 1 → 6, 7
- **5**: 3 → 8, 9, 10
- **6**: 2, 4 → 12
- **7**: 4 → 12
- **8**: 5 → 11
- **9**: 5 → 11
- **10**: 5 → 11
- **11**: 8, 9, 10 → 13
- **12**: 6, 7 → 13
- **13**: 11, 12 → F1-F4

### Agent Dispatch Summary

- **Wave 1**: 4 tasks → `quick` (schema), `unspecified-high` (CRUD)
- **Wave 2**: 3 tasks → `deep` (lógica de remoção), `unspecified-high`
- **Wave 3**: 3 tasks → `visual-engineering` (UI forms)
- **Wave 4**: 3 tasks → `visual-engineering` (UI calendário)
- **FINAL**: 4 tasks → `oracle`, `unspecified-high`, `deep`

---

## TODOs

- [ ] 1. **Schema Drizzle — Adicionar startDate a tasks + dates a plans**

  **What to do**:
  - Em `drizzle/schema.ts`:
    - Adicionar `startDate: datetime("startDate")` à tabela `onboardingTasks`
    - Adicionar `startDate: datetime("startDate")` à tabela `onboardingPlans`
    - Adicionar `endDate: datetime("endDate")` à tabela `onboardingPlans`
  - Atualizar os tipos `InsertOnboardingTask` e `InsertOnboardingPlan` (automático via Drizzle)
  - Atualizar `OnboardingTask` e `OnboardingPlan` types se necessário

  **Must NOT do**:
  - Não alterar outras colunas ou tabelas

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mudança trivial de schema, 3 novas colunas
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None (start immediately)

  **References**:
  - `drizzle/schema.ts:56-67` — Tabela `onboardingTasks` existente, adicionar após `dueDate`
  - `drizzle/schema.ts:40-48` — Tabela `onboardingPlans` existente, adicionar após `description`

  **Acceptance Criteria**:
  - [ ] Ficheiro `drizzle/schema.ts` alterado com sucesso
  - [ ] Tipos TypeScript compilam sem erros (`tsc --noEmit`)

  **QA Scenarios**:
  ```
  Scenario: Schema compila sem erros
    Tool: Bash
    Preconditions: Ficheiro schema.ts alterado
    Steps:
      1. Correr `npx tsc --noEmit` na raiz do projeto
    Expected Result: Compilação sem erros (exit code 0)
    Evidence: .omo/evidence/task-1-tsc-compile.txt
  ```

  **Commit**: YES
  - Message: `feat(schema): add startDate to tasks and startDate/endDate to plans`
  - Files: `drizzle/schema.ts`
  - Pre-commit: `npm run check`

---

- [ ] 2. **db.ts SQL Init — Adicionar colunas nas tabelas**

  **What to do**:
  - Em `server/db.ts`, função `initTables`:
    - Adicionar ALTER TABLE para `startDate` em `onboarding_tasks`
    - Adicionar ALTER TABLE para `startDate` e `endDate` em `onboarding_plans`
    - Atualizar o CREATE TABLE SQL para `onboarding_tasks` incluir `startDate DATETIME`
    - Atualizar o CREATE TABLE SQL para `onboarding_plans` incluir `startDate DATETIME` e `endDate DATETIME`
  - Padrão: usar `try/catch` para ALTER TABLE (como já existe no código para `darkMode`, `avatar`, etc.)

  **Must NOT do**:
  - Não alterar outras tabelas ou colunas
  - Não quebrar ALTER TABLE existentes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requer cuidado com SQL migrations e compatibilidade com dados existentes
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:
  - `server/db.ts:21-138` — Função `initTables` com CREATE TABLE e ALTER TABLE
  - `server/db.ts:43-46` — Padrão de ALTER TABLE com try/catch: `try { await db.execute(sql`ALTER TABLE...`); } catch {}`
  - `server/db.ts:58-71` — CREATE TABLE para `onboarding_tasks` — adicionar `startDate DATETIME` após `dueDate`
  - `server/db.ts:48-57` — CREATE TABLE para `onboarding_plans` — adicionar `startDate DATETIME, endDate DATETIME` após `description`

  **Acceptance Criteria**:
  - [ ] `server/db.ts` com CREATE TABLEs atualizados
  - [ ] ALTER TABLE statements adicionados com try/catch
  - [ ] Server compila sem erros

  **QA Scenarios**:
  ```
  Scenario: SQL init não quebra
    Tool: Bash
    Preconditions: db.ts alterado
    Steps:
      1. Executar `npx tsx server/db.ts` para verificar se carrega sem erros
      2. Ou verificar compilação com `npx tsc --noEmit`
    Expected Result: Sem erros de compilação
    Evidence: .omo/evidence/task-2-db-compile.txt
  ```

  **Commit**: YES (with Task 1)
  - Message: `feat(schema): add startDate to tasks and startDate/endDate to plans`
  - Files: `drizzle/schema.ts`, `server/db.ts`

---

- [ ] 3. **db.ts CRUD Tasks — Adicionar startDate nas operações**

  **What to do**:
  - Em `server/db.ts`:
    - `createOnboardingTask`: Aceitar `startDate` no parâmetro `data`, salvar no objeto da task
    - `updateOnboardingTask`: Aceitar `startDate` no partial type, incluir na atualização
    - `getAllTasks`: Já retorna todas as tasks, startDate virá automaticamente
    - Atualizar o type do parâmetro `data` para incluir `startDate?: Date`
    - Para in-memory fallback: incluir `startDate` no objeto criado/atualizado

  **Must NOT do**:
  - Não alterar a lógica de negócio existente
  - Não quebrar o auto-complete de planos

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requer atenção ao CRUD in-memory + SQL e manter consistência
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:
  - `server/db.ts:401-408` — `createOnboardingTask` — adicionar `startDate?: Date` ao destructuring
  - `server/db.ts:423-432` — `updateOnboardingTask` — adicionar `startDate` ao type e ao spread
  - `server/db.ts:537-541` — `getAllTasks` — já retorna dados completos

  **Acceptance Criteria**:
  - [ ] `createOnboardingTask` aceita e persiste `startDate`
  - [ ] `updateOnboardingTask` aceita e atualiza `startDate`
  - [ ] Dados retornados incluem `startDate`

  **QA Scenarios**:
  ```
  Scenario: CRUD compila sem erros
    Tool: Bash
    Preconditions: schema.ts e db.ts alterados
    Steps:
      1. `npx tsc --noEmit`
    Expected Result: Exit code 0
    Evidence: .omo/evidence/task-3-crud-compile.txt
  ```

  **Commit**: YES (with Task 2)
  - Message: `feat(schema): add startDate to tasks and startDate/endDate to plans`
  - Files: `drizzle/schema.ts`, `server/db.ts`

---

- [ ] 4. **db.ts CRUD Plans — Adicionar startDate/endDate nas operações**

  **What to do**:
  - Em `server/db.ts`:
    - `createOnboardingPlan`: Aceitar `startDate` e `endDate` no parâmetro `data`, salvar no objeto
    - `updateOnboardingPlan`: Adicionar `startDate` e `endDate` ao partial type
    - `getAllOnboardingPlans`: Já retorna todos os campos
    - `getOnboardingPlanById`: Já retorna todos os campos
    - Para in-memory: incluir as dates no objeto criado/atualizado

  **Must NOT do**:
  - Não alterar `getPlansAssignedToUser` nem a lógica de filtragem por role

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Consistência entre CRUD SQL e in-memory
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Task 1

  **References**:
  - `server/db.ts:351-360` — `createOnboardingPlan` — adicionar `startDate` e `endDate` ao param/obj
  - `server/db.ts:389-398` — `updateOnboardingPlan` — adicionar `startDate`, `endDate` ao type

  **Acceptance Criteria**:
  - [ ] `createOnboardingPlan` aceita e persiste `startDate`, `endDate`
  - [ ] `updateOnboardingPlan` aceita e atualiza `startDate`, `endDate`
  - [ ] `getAllOnboardingPlans` retorna dados com dates

  **QA Scenarios**:
  ```
  Scenario: CRUD plans compila
    Tool: Bash
    Preconditions: Ficheiros alterados
    Steps:
      1. `npx tsc --noEmit`
    Expected Result: Exit code 0
    Evidence: .omo/evidence/task-4-plans-crud-compile.txt
  ```

  **Commit**: YES (with Task 2/3)
  - Message: `feat(schema): add startDate to tasks and startDate/endDate to plans`

---

- [ ] 5. **routers.ts Tasks — Adicionar startDate nos endpoints**

  **What to do**:
  - Em `server/routers.ts`:
    - `tasks.create`: Adicionar `startDate: z.date().optional()` ao schema de input
    - `tasks.update`: Adicionar `startDate: z.date().optional()` ao schema de input
    - Passar `startDate` nas chamadas a `db.createOnboardingTask` e `db.updateOnboardingTask`

  **Must NOT do**:
  - Não alterar validação de role (estagiários só mudam status)
  - Não alterar o auto-complete de planos

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Consistência no schema zod + chamadas db
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7)
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Task 3

  **References**:
  - `server/routers.ts:281-291` — `tasks.create` — adicionar `startDate: z.date().optional()` no input e passar no `db.createOnboardingTask`
  - `server/routers.ts:292-327` — `tasks.update` — adicionar `startDate: z.date().optional()` no input

  **Acceptance Criteria**:
  - [ ] `tasks.create` aceita `startDate` no input
  - [ ] `tasks.update` aceita `startDate` no input
  - [ ] Dados são passados corretamente para db

  **QA Scenarios**:
  ```
  Scenario: Router tasks compila
    Tool: Bash
    Preconditions: routers.ts + db.ts alterados
    Steps:
      1. `npx tsc --noEmit`
    Expected Result: Exit code 0
    Evidence: .omo/evidence/task-5-router-tasks-compile.txt
  ```

  **Commit**: YES
  - Message: `feat(api): add startDate to task create/update endpoints`
  - Files: `server/routers.ts`

---

- [ ] 6. **routers.ts Plans — Remover auto-tasks e salvar dates**

  **What to do**:
  - Em `server/routers.ts`, função `plans.create`:
    - **REMOVER** blocos de criação automática de tarefas marco (linhas 200-217):
      ```typescript
      // REMOVER:
      if (startDate) {
        await db.createOnboardingTask({ ... })
      }
      if (endDate) {
        await db.createOnboardingTask({ ... })
      }
      ```
    - **ADICIONAR** `startDate` e `endDate` na chamada a `db.createOnboardingPlan`:
      ```typescript
      const plan = await db.createOnboardingPlan({
        ...planData,
        createdBy: ctx.user.id,
        startDate: startDate,
        endDate: endDate,
      });
      ```

  **Must NOT do**:
  - Não alterar a atribuição de planos (assignPlanToUser continua igual)
  - Não alterar o activity logging

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Remover código com cuidado para não partir fluxo existente
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 2, 4

  **References**:
  - `server/routers.ts:190-247` — Função `plans.create` completa
  - `server/routers.ts:200-217` — Bloco a REMOVER (if startDate / if endDate com createOnboardingTask)
  - `server/routers.ts:197-198` — Onde passar startDate/endDate para createOnboardingPlan

  **Acceptance Criteria**:
  - [ ] Criação de plano com datas NÃO cria tarefas marco
  - [ ] Datas são guardadas no plano via `createOnboardingPlan`
  - [ ] Atribuição de plano continua a funcionar com dates
  - [ ] Activity logging mantém-se

  **QA Scenarios**:
  ```
  Scenario: Criar plano não gera tarefas auto
    Tool: Bash (curl à API ou simulação)
    Preconditions: Servidor a correr
    Steps:
      1. Chamar API plans.create com startDate e endDate
      2. Verificar que NÃO foram criadas tarefas "🚀 Início" / "📅 Fim"
    Expected Result: Plano criado sem tarefas automáticas
    Evidence: .omo/evidence/task-6-no-autotasks.txt
  ```

  **Commit**: YES
  - Message: `feat(api): remove auto-task creation from plan creation, save dates on plan`
  - Files: `server/routers.ts`

---

- [ ] 7. **routers.ts Plans — Incluir dates na resposta**

  **What to do**:
  - Em `server/routers.ts`, as queries `plans.list` e `plans.getById`:
    - Os dados retornados por `db.getAllOnboardingPlans()`, `db.getPlansAssignedToUser()` e `db.getOnboardingPlanById()` já incluirão `startDate` e `endDate` após Task 4
    - Nenhuma alteração necessária nos routers — apenas verificar que os types incluam as dates

  **Must NOT do**:
  - Não alterar a lógica de filtragem por role

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Apenas verificação, mudança mínima ou nenhuma
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 12
  - **Blocked By**: Task 4

  **References**:
  - `server/routers.ts:170-189` — `plans.list` e `plans.getById`

  **Acceptance Criteria**:
  - [ ] `plans.list` retorna objetos com `startDate` e `endDate`
  - [ ] `plans.getById` retorna objeto com `startDate` e `endDate`

  **QA Scenarios**:
  ```
  Scenario: Plans retornam dates
    Tool: Bash
    Preconditions: API funcional
    Steps:
      1. Chamar API plans.list
      2. Verificar que objetos incluem startDate/endDate
    Expected Result: Campos presentes na resposta
    Evidence: .omo/evidence/task-7-plans-dates.txt
  ```

  **Commit**: YES (with Task 6)
  - Message: `feat(api): remove auto-task creation from plan creation, save dates on plan`

---

- [ ] 8. **Tasks.tsx — AddTaskForm + Display com startDate**

  **What to do**:
  - No ficheiro `client/src/pages/Tasks.tsx`:

  **AddTaskForm** (linhas 264-311):
  - Adicionar `startDate` ao estado: `const [startDate, setStartDate] = useState('')`
  - Adicionar campo de input date para startDate ANTES do dueDate
  - Passar `startDate` na mutation: `startDate: startDate ? new Date(startDate) : undefined`
  - Layout: grid 2 colunas para startDate e dueDate lado a lado

  **KanbanCard** (linhas 314-369):
  - Mostrar startDate se existir (com ícone de calendário verde/teal)
  - Formato: `🟢 Início: 10/05/2026` + `📅 Fim: 20/05/2026`

  **TaskPanel** (linhas 70-261):
  - Na secção de info da tarefa (linhas 153-157):
    - Mostrar startDate se existir: `🟢 Início: ...`
    - Mostrar dueDate: `📅 Prazo: ...`

  **ListView (PlanTaskGroup)** (linhas 731-737):
  - Adicionar display de startDate

  **Must NOT do**:
  - Não quebrar drag-and-drop
  - Não alterar cores/estado das tarefas

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modificações de UI com formulários e display
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Task 11
  - **Blocked By**: Task 5

  **References**:
  - `Tasks.tsx:267-269` — Estados: `const [dueDate, setDueDate] = useState('')` — adicionar startDate
  - `Tasks.tsx:295-299` — Input date para dueDate — adicionar startDate antes
  - `Tasks.tsx:357-363` — Display de dueDate no KanbanCard — adicionar startDate
  - `Tasks.tsx:150-157` — Display de info no TaskPanel — adicionar startDate

  **Acceptance Criteria**:
  - [ ] Formulário "Adicionar Tarefa" tem campo startDate (date input)
  - [ ] startDate aparece nos cartões Kanban
  - [ ] startDate aparece no painel lateral da tarefa
  - [ ] startDate aparece na vista de lista

  **QA Scenarios**:
  ```
  Scenario: Formulário tem startDate
    Tool: Bash + inspeção de código
    Preconditions: Ficheiro Tasks.tsx alterado
    Steps:
      1. Verificar que existe input type="date" para startDate no AddTaskForm
      2. Verificar que a mutation inclui startDate no objeto
    Expected Result: startDate presente no form e na mutation
    Evidence: .omo/evidence/task-8-form-startdate.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add startDate to task create form and display in Tasks page`
  - Files: `client/src/pages/Tasks.tsx`

---

- [ ] 9. **PlanDetail.tsx — Formulário tarefa + display com startDate**

  **What to do**:
  - Em `client/src/pages/PlanDetail.tsx`:

  **Formulário de criação de tarefa** (linhas 190, 373-394):
  - Adicionar `startDate` ao estado: `const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', startDate: '' })`
  - Adicionar input date para startDate no formulário (antes do dueDate)
  - Passar `startDate` na mutation

  **ListView** (linhas 115-171):
  - Mostrar startDate se existir (com ícone)

  **KanbanView** (linhas 44-112):
  - Mostrar startDate se existir

  **Must NOT do**:
  - Não alterar navegação ou layout geral

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modificações UI consistentes com Tasks.tsx
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: Task 11
  - **Blocked By**: Task 5

  **References**:
  - `PlanDetail.tsx:190` — Estado taskForm — adicionar `startDate: ''`
  - `PlanDetail.tsx:387` — Input dueDate — adicionar input startDate antes
  - `PlanDetail.tsx:197-202` — Mutation — passar startDate
  - `PlanDetail.tsx:150-155` — Display data no ListView

  **Acceptance Criteria**:
  - [ ] Formulário de nova tarefa tem campo startDate
  - [ ] startDate aparece na lista e kanban do plano

  **QA Scenarios**:
  ```
  Scenario: Form tem startDate no PlanDetail
    Tool: Bash (grep) + inspeção
    Preconditions: PlanDetail.tsx alterado
    Steps:
      1. Verificar input type="date" para startDate
      2. Verificar que handleAddTask passa startDate
    Expected Result: startDate presente
    Evidence: .omo/evidence/task-9-plan-detail-startdate.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add startDate to task form in PlanDetail page`
  - Files: `client/src/pages/PlanDetail.tsx`

---

- [ ] 10. **Calendar.tsx ScheduleTaskModal — Adicionar startDate**

  **What to do**:
  - Em `client/src/pages/Calendar.tsx`:
    - No componente `ScheduleTaskModal` (linhas 42-121):
      - Adicionar estado `startDate` com valor inicial `''`
      - Adicionar input date para startDate no formulário
      - Passar `startDate` na mutation `createTask.mutateAsync`
      - Preencher startDate com a data selecionada no calendário (tal como dueDate já faz)

  **Must NOT do**:
  - Não alterar o layout do modal

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI consistente com os outros formulários
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 11
  - **Blocked By**: Task 5

  **References**:
  - `Calendar.tsx:48-50` — useState para title, description — adicionar startDate
  - `Calendar.tsx:57-60` — Mutation createTask — adicionar startDate
  - `Calendar.tsx:101-109` — Inputs do formulário — adicionar startDate antes de descrição

  **Acceptance Criteria**:
  - [ ] ScheduleTaskModal tem campo startDate
  - [ ] startDate é passado na mutation de criação

  **QA Scenarios**:
  ```
  Scenario: Modal tem startDate
    Tool: Bash (grep)
    Preconditions: Calendar.tsx alterado
    Steps:
      1. Verificar input startDate no ScheduleTaskModal
      2. Verificar que createTask.mutateAsync recebe startDate
    Expected Result: startDate presente
    Evidence: .omo/evidence/task-10-calendar-modal-startdate.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add startDate to schedule task modal in Calendar`
  - Files: `client/src/pages/Calendar.tsx`

---

- [ ] 11. **Calendar.tsx — Marcadores maiores com glow**

  **What to do**:
  - Em `client/src/pages/Calendar.tsx`:
    - **Marcador de tarefa com dueDate** (linha 329):
      - Atualizar de `w-1.5 h-1.5 rounded-full` para marcador maior
      - Novo: `w-3 h-3 rounded-full ring-2 ring-primary/30 shadow-sm bg-primary` (12px + ring)
    - **Dia selecionado** com tarefas: manter destaque
    - **Dia hoje** com tarefas: garantir que marcador é visível sobre fundo primário
      - Se `todayCell`, usar `bg-white` com `ring-white/50`
    - Marcador deve ser um `<span>` maior e mais visível

  **Cores dos marcadores**:
  - Tarefa com `dueDate`: `bg-primary ring-primary/30`
  - Tarefa com `startDate` (apenas startDate, sem dueDate): `bg-cyan-500 ring-cyan-500/30` (teal)

  **Lógica de deteção** (atualizar `datesWithTasks`):
  - Manter `datesWithTasks` para dueDate
  - Adicionar `datesWithStartDate` para tarefas com startDate (sem dueDate nesse dia)
  - No render, verificar se o dia tem dueDate e/ou startDate
  - Se tiver ambos, mostrar apenas o marcador de dueDate (ou os dois lado a lado)

  **Must NOT do**:
  - Não alterar navegação do calendário (mês anterior/seguinte)
  - Não alterar a seleção de dias

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI refinamento de marcadores com TailwindCSS
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 8, 9, 10

  **References**:
  - `Calendar.tsx:200-205` — Sets `datesWithTasks` e `datesWithMilestones`
  - `Calendar.tsx:328-330` — Render do marcador: `w-1.5 h-1.5 rounded-full mt-0.5`
  - `Calendar.tsx:317-325` — Classes do dia (todayCell, selectedCell)

  **Acceptance Criteria**:
  - [ ] Marcador de dueDate aumentou para 12px com ring
  - [ ] Marcador de startDate usa cor teal/cyan
  - [ ] Dias com startDate mostram marcador
  - [ ] Marcadores são visíveis em dias selecionados e hoje

  **QA Scenarios**:
  ```
  Scenario: Marcadores maiores e com ring
    Tool: Bash (grep + code review)
    Preconditions: Calendar.tsx alterado
    Steps:
      1. Verificar classes CSS dos marcadores: w-3 h-3, ring-*
      2. Verificar nova cor teal/cyan para startDate
    Expected Result: Marcadores ≥12px com efeito ring
    Evidence: .omo/evidence/task-11-markers-size.txt
  ```

  **Commit**: YES (with Task 12/13)
  - Message: `feat(ui): improve calendar markers with larger size and glow, add plan markers`

---

- [ ] 12. **Calendar.tsx — Marcadores para planos**

  **What to do**:
  - Em `client/src/pages/Calendar.tsx`:
    - **Buscar dados dos planos com dates**:
      - Já existe `const { data: plans } = trpc.plans.list.useQuery()`
      - Agora `plans` incluirá `startDate` e `endDate` (após Task 7)
    - **Criar sets de datas de planos**:
      ```typescript
      const planStartDates = new Set(
        (plans || [])
          .filter(p => p.startDate)
          .map(p => toDateKey(new Date(p.startDate)))
      );
      const planEndDates = new Set(
        (plans || [])
          .filter(p => p.endDate)
          .map(p => toDateKey(new Date(p.endDate)))
      );
      ```
    - **Remover lógica de milestones antiga**:
      - Remover `datesWithMilestones` baseado em títulos de tarefas (linhas 203-205)
      - Substituir por `datesWithPlanStart` e `datesWithPlanEnd`
    - **Atualizar render do dia** (linha 328-330):
      - Se dia tem `planStartDate`: marcador verde: `bg-green-500 ring-green-500/30`
      - Se dia tem `planEndDate`: marcador roxo: `bg-purple-500 ring-purple-500/30`
      - Prioridade visual: planStart > planEnd > taskDueDate > taskStartDate
      - Se múltiplos marcadores no mesmo dia, mostrar o mais prioritário

  **Must NOT do**:
  - Não remover a lógica de `datesWithTasks` (continuar a mostrar tarefas normais)
  - Não alterar o painel lateral "Os meus Planos"
  - Não alterar o ScheduleTaskModal

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Integração de dados de planos no calendário com UI
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 13)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 6, 7

  **References**:
  - `Calendar.tsx:194` — `trpc.plans.list.useQuery()` — já existe, dados agora incluem dates
  - `Calendar.tsx:200-205` — `datesWithTasks` e `datesWithMilestones` — substituir milestones
  - `Calendar.tsx:328-330` — Render do marcador — adicionar condições para planos
  - `Calendar.tsx:360-375` — Painel lateral mostra milestones — atualizar para planos

  **Acceptance Criteria**:
  - [ ] Planos com startDate mostram marcador verde no calendário
  - [ ] Planos com endDate mostram marcador roxo no calendário
  - [ ] Marcadores antigos de milestones (🚀/📅) já não aparecem

  **QA Scenarios**:
  ```
  Scenario: Planos aparecem no calendário
    Tool: Bash + code review
    Preconditions: Calendar.tsx alterado, plans.list retorna dates
    Steps:
      1. Verificar que datesWithMilestones foi removido/substituído
      2. Verificar que planStartDates e planEndDates são calculados
      3. Verificar que o render do dia usa as novas conditions
    Expected Result: Planos mostram marcadores verde/roxo
    Evidence: .omo/evidence/task-12-plan-markers.txt
  ```

  **Commit**: YES (with Task 11/13)
  - Message: `feat(ui): improve calendar markers with larger size and glow, add plan markers`

---

- [ ] 13. **Calendar.tsx — Marcador para task.startDate (teal)**

  **What to do**:
  - Em `client/src/pages/Calendar.tsx`:
    - **Criar set de startDates**:
      ```typescript
      const datesWithStart = new Set(
        allTasks.filter(t => t.startDate).map(t => toDateKey(new Date(t.startDate)))
      );
      ```
    - **Atualizar o painel lateral** (dias selecionados, linhas 338-378):
      - No `selectedDayTasks`, mostrar `startDate` de cada tarefa
      - Se a tarefa tem `startDate`, mostrar: `🟢 Início: ...`
    - **Atualizar render do marcador**:
      - Se dia tem startDate (e não tem dueDate nem planDates): marcador teal
      - `bg-cyan-500 ring-cyan-500/30`

  **Must NOT do**:
  - Não duplicar marcadores (se dia já tem dueDate, não mostrar startDate)
  - Não sobrecarregar visualmente o calendário

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI refinamento
  - **Skills**: Nenhuma necessária

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12)
  - **Blocks**: None (final task before review)
  - **Blocked By**: Tasks 11, 12

  **References**:
  - `Calendar.tsx:200-205` — Sets existentes
  - `Calendar.tsx:328-330` — Render do marcador
  - `Calendar.tsx:358-375` — Painel lateral com tarefas do dia

  **Acceptance Criteria**:
  - [ ] Tarefas com startDate mostram marcador teal no calendário
  - [ ] Painel lateral mostra startDate das tarefas
  - [ ] Não há conflito visual com marcadores de dueDate

  **QA Scenarios**:
  ```
  Scenario: StartDate aparece no calendário
    Tool: Bash + code review
    Preconditions: Calendar.tsx alterado
    Steps:
      1. Verificar datesWithStart é populado
      2. Verificar marcador teal/cyan no render
      3. Verificar painel lateral mostra startDate
    Expected Result: Marcadores teal visíveis
    Evidence: .omo/evidence/task-13-startdate-markers.txt
  ```

  **Commit**: YES (with Task 11/12)
  - Message: `feat(ui): improve calendar markers with larger size and glow, add plan markers`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .omo/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + check for `as any`/`@ts-ignore`, empty catches, console.log, commented-out code, unused imports, AI slop.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Save to `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **1-4**: `feat(schema): add startDate to tasks and startDate/endDate to plans`
  - `drizzle/schema.ts`, `server/db.ts`

- **5**: `feat(api): add startDate to task create/update endpoints`
  - `server/routers.ts`

- **6-7**: `feat(api): remove auto-task creation from plan creation, save dates on plan`
  - `server/routers.ts`

- **8**: `feat(ui): add startDate to task create form and display in Tasks page`
  - `client/src/pages/Tasks.tsx`

- **9**: `feat(ui): add startDate to task form in PlanDetail page`
  - `client/src/pages/PlanDetail.tsx`

- **10**: `feat(ui): add startDate to schedule task modal in Calendar`
  - `client/src/pages/Calendar.tsx`

- **11-13**: `feat(ui): improve calendar markers with larger size and glow, add plan markers`
  - `client/src/pages/Calendar.tsx`

---

## Success Criteria

### Verification Commands
```bash
cd C:\Users\Santiago\Portal_Onboarding
npm run check  # tsc --noEmit - Expected: exit 0
npm run dev    # Server starts without errors
```

### Final Checklist
- [ ] Schema compila sem erros (`npm run check`)
- [ ] Backend CRUD funcional (criar/ler/atualizar tarefas com startDate)
- [ ] Criação de planos não gera tarefas automáticas
- [ ] Formulários de tarefa têm campo startDate
- [ ] Calendário mostra marcadores >=12px com glow
- [ ] Calendário mostra marcadores verdes/roxos para planos
- [ ] Calendário mostra marcador teal para startDate de tarefas
- [ ] Nenhuma funcionalidade existente quebrada
