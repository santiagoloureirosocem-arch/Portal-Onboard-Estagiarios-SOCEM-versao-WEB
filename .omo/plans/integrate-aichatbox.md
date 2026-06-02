# Integrate AIChatBox into Portal

## TL;DR

> **Quick Summary**: Integrate the existing AIChatBox component into the Portal Onboarding app as a usable AI assistant — accessible as a standalone page, embedded in the Dashboard, and embedded in PlanDetail with page-aware context.
>
> **Deliverables**:
> - tRPC backend endpoint `ai.chat` calling `invokeLLM()`
> - Context prompt builders for Dashboard (metrics) and PlanDetail (plan + tasks)
> - Standalone AI Chat page at `/ai` with sidebar entry
> - Floating AIChatPanel component for embedding in pages
> - AI mini-chat integrated in Dashboard (with metrics context)
> - AI mini-chat integrated in PlanDetail (with plan context)
> - LLM API key documentation/setup
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Backend endpoint → Context builders → Frontend components → Page integration

---

## Context

### Original Request
> "faz o aichatbox integrado" — Integrate the AIChatBox into the real app (it currently only exists in ComponentShowcase demo)

### Interview Summary
**Key Discussions**:
- **Placement**: Standalone page `/ai` + embedded mini-chat on Dashboard + embedded mini-chat on PlanDetail
- **Context-awareness**: AI should receive page context (Dashboard: user metrics; PlanDetail: plan + tasks)
- **LLM API**: `BUILT_IN_FORGE_API_KEY` may not yet be configured — plan includes setup/documentation
- **Backend**: `invokeLLM()` exists in `server/_core/llm.ts` but has no tRPC endpoint yet

**Research Findings**:
- `AIChatBox.tsx` — complete React component (335 lines) with markdown rendering via Streamdown, loading states, suggested prompts, auto-scroll. Currently only used in `ComponentShowcase.tsx`.
- `llm.ts` — complete `invokeLLM()` function (332 lines) calling Forge API (OpenAI-compatible) with full TypeScript types. Uses `gemini-2.5-flash` model.
- `env.ts` — exposes `forgeApiUrl` (`BUILT_IN_FORGE_API_URL`) and `forgeApiKey` (`BUILT_IN_FORGE_API_KEY`)
- `routers.ts` — no AI router exists yet
- No streaming support (invokeLLM returns complete response)
- `.env.example` does NOT document LLM env vars

### Metis Review
*(Metis agent unavailable due to model issues — self-review substituted)*
**Addressable Gaps**:
- API key status unknown → include config task with documentation
- No test strategy defined → agent QA scenarios (no unit tests for LLM calls)
- Streaming vs non-streaming → stay non-streaming (invokeLLM doesn't support it)
- Message persistence → out of scope

---

## Work Objectives

### Core Objective
Integrate the AIChatBox into the Portal as a real, usable AI assistant with backend support and page-context awareness, accessible from 3 touchpoints (standalone page, Dashboard, PlanDetail).

### Concrete Deliverables
- Backend: `ai.chat` tRPC mutation endpoint
- Frontend: `AIChatPanel` reusable floating component
- Frontend: `AIChatPage` standalone page at `/ai`
- Sidebar: "Assistente IA" menu entry with Sparkles icon
- Dashboard: floating AI button opening panel with metrics context
- PlanDetail: floating AI button opening panel with plan context
- Docs: `.env.example` updated with LLM vars

### Definition of Done
- [ ] `/ai` page loads, accepts messages, returns AI responses
- [ ] Dashboard floating AI opens panel, AI knows user metrics
- [ ] PlanDetail floating AI opens panel, AI knows plan name + tasks
- [ ] Sidebar has "Assistente IA" entry visible to all roles
- [ ] LLM API key configured (or clear setup instructions exist)
- [ ] AIChatBox no longer only usable from ComponentShowcase

### Must Have
- Backend tRPC endpoint `ai.chat` calling `invokeLLM()`
- Standalone `/ai` page with full AIChatBox
- Floating mini-chat on Dashboard with dashboard context
- Floating mini-chat on PlanDetail with plan context
- Sidebar navigation entry
- LLM API key configuration

### Must NOT Have (Guardrails)
- NO streaming responses (invokeLLM is request-response only)
- NO message history persistence (in-memory only, lost on refresh)
- NO voice/image/file input for AI chat
- NO changes to existing `invokeLLM()` function signature
- NO excessive AI slop: keep system prompts minimal, no over-engineering

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: None (AI chat depends on external API — focus on agent QA)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend**: Bash (curl) + tRPC direct calls — send messages, assert response format
- **Frontend**: Playwright — navigate to page, interact with chat, screenshot

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — Backend Foundation):
├── Task 1: Add ai.chat tRPC endpoint [deep]
└── Task 2: Create context prompt builders [unspecified-high]

Wave 2 (After Wave 1 — Frontend Core Components):
├── Task 3: Create AIChatPanel floating component [visual-engineering]
├── Task 4: Create standalone AIChatPage [visual-engineering]
└── Task 5: LLM API key config + docs [quick]

Wave 3 (After Wave 2 — Integration):
├── Task 6: Integrate into Dashboard (sidebar entry + fab + context) [visual-engineering]
└── Task 7: Integrate into PlanDetail (fab + context) [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user approval):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]
→ Present results → Get explicit user OK

Critical Path: Task 1 → Tasks 3+4 → Task 6 → F1-F4 → user OK
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 3 (Waves 2)
```

### Dependency Matrix
- **1**: None — 2-5, 1
- **2**: None — 3, 4, 1
- **3**: 1, 2 — 6, 7, 2
- **4**: 1 — 6, 7, 2
- **5**: None — 6, 7 (docs/blocker), 1
- **6**: 3, 4, 5 — F1-F4, 3
- **7**: 3, 5 — F1-F4, 3

### Agent Dispatch Summary
- **Wave 1 (2)**: T1 → `deep`, T2 → `unspecified-high`
- **Wave 2 (3)**: T3 → `visual-engineering`, T4 → `visual-engineering`, T5 → `quick`
- **Wave 3 (2)**: T6 → `visual-engineering`, T7 → `visual-engineering`
- **FINAL (4)**: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Add `ai.chat` tRPC endpoint to backend

  **What to do**:
  - In `server/routers.ts`, add a new `ai: router({...})` section to `appRouter`
  - Add a `chat` mutation under `protectedProcedure`:
    - Input: `z.object({ messages: z.array(z.object({ role: z.string(), content: z.string() })), context: z.string().optional() })`
    - If `context` is provided, prepend a system message `{ role: "system", content: context }` to the messages array
    - Call `invokeLLM({ messages: normalizedMessages })` from `../_core/llm`
    - Return the LLM response (the full `InvokeResult` or just `choices[0].message.content`)
  - Add `AppRouter` type update (already exported at bottom)
  - Import `invokeLLM` from `./_core/llm`

  **Must NOT do**:
  - Do NOT modify `invokeLLM` function signature or implementation
  - Do NOT add streaming support
  - Do NOT persist conversation history to DB

  **Recommended Agent Profile**:
  > - **Category**: `deep` — needs understanding of tRPC patterns, LLM types, and existing router structure
  > - **Skills**: none (intrinsic TypeScript + tRPC)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:
  - `server/routers.ts:31-485` — existing tRPC router structure to follow (pattern: `router({...})`, `protectedProcedure.input(z.object({...})).mutation(...)`)
  - `server/_core/llm.ts:268-332` — `invokeLLM()` function signature and types (`Message`, `InvokeParams`, `InvokeResult`)
  - `server/_core/trpc.ts:28` — `protectedProcedure` export
  - `server/routers.ts:7` — existing zod import and tRPC error pattern

  **Why Each Reference Matters**:
  - The existing router shows exactly how to structure endpoints, input validation, and error handling
  - `invokeLLM` types show the exact message format and response shape
  - The trpc.ts export shows which procedure type to use (protectedProcedure for any authenticated user)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Send chat message and receive AI response
    Tool: Bash (curl)
    Preconditions: Server running, valid session cookie obtained
    Steps:
      1. Send tRPC mutation: curl -X POST http://localhost:3000/trpc/ai.chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Say hello in Portuguese"}]}'
      2. Parse JSON response
    Expected Result: Response contains `choices[0].message.content` with a Portuguese greeting
    Failure Indicators: 400/500 error, missing `choices`, empty content
    Evidence: .omo/evidence/task-1-ai-chat-response.json

  Scenario: Context injection works
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. Send mutation with context: curl -X POST ... -d '{"messages":[{"role":"user","content":"What page am I on?"}],"context":"You are on the Dashboard. The user has 3 active plans and 5 tasks due today."}'
      2. Parse JSON response
    Expected Result: Response mentions "Dashboard", "3 active plans", or "5 tasks"
    Failure Indicators: Response doesn't reference the context
    Evidence: .omo/evidence/task-1-ai-context.json
  ```

  **Evidence to Capture**:
  - [ ] response JSON for basic chat
  - [ ] response JSON for context injection test

  **Commit**: NO

- [ ] 2. Create context prompt builders

  **What to do**:
  - Create new file `server/ai-context.ts`
  - Export two functions:
    - `buildDashboardContext(userId: number, user: any): Promise<string>` — fetches user metrics from `db.getDashboardMetrics()` and `db.myProgress` equivalent, returns a concise system prompt string describing: user role, active plans count, tasks due today/overdue, overall completion rate
    - `buildPlanDetailContext(planId: number): Promise<string>` — fetches plan by ID and its tasks, returns a system prompt describing: plan name, status, start/end dates, total tasks, completed/pending/in-progress counts, list of task titles with status
  - Use existing db functions: `getOnboardingPlanById`, `getTasksByPlanId`, `getPlanAssignmentsByUserId`

  **Must NOT do**:
  - Do NOT include user passwords, tokens, or sensitive data in context
  - Do NOT make the context prompt too verbose (aim for 3-5 sentences)
  - Do NOT add caching yet

  **Recommended Agent Profile**:
  > - **Category**: `unspecified-high` — requires understanding of db queries and constructing optimal LLM prompts
  > - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:
  - `server/db.ts:357-407` — `getOnboardingPlanById()`, `getTasksByPlanId()` — plan/task fetching
  - `server/db.ts:553-579` — `getDashboardMetrics()` — metrics query pattern
  - `server/routers.ts:384-401` — `dashboard.myProgress` route — how to compute user-specific progress
  - `server/_core/llm.ts:3` — `Message` type (role/content structure for context injection)

  **Why Each Reference Matters**:
  - The db functions show exactly what data is available for context
  - The myProgress route demonstrates the exact query pattern for user-specific data
  - The Message type ensures context format matches what invokeLLM expects

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Dashboard context is meaningful
    Tool: Bash (bun)
    Preconditions: Server has at least one user with plans
    Steps:
      1. Import buildDashboardContext and call it with a valid userId
      2. Print output to console
    Expected Result: Returns a non-empty string mentioning plans, tasks, or completion rate
    Failure Indicators: Empty string, throws error, contains sensitive data (passwords)
    Evidence: .omo/evidence/task-2-dashboard-context.txt

  Scenario: PlanDetail context includes plan name and tasks
    Tool: Bash (bun)
    Preconditions: Server has at least one plan with tasks
    Steps:
      1. Import buildPlanDetailContext and call with valid planId
      2. Print output to console
    Expected Result: Returns string mentioning plan title, task count, some task titles
    Failure Indicators: Empty string, throws error if plan has tasks but not mentioned
    Evidence: .omo/evidence/task-2-plandetail-context.txt
  ```

  **Evidence to Capture**:
  - [ ] dashboard context output
  - [ ] plandetail context output

  **Commit**: NO

- [ ] 3. Create AIChatPanel floating component

  **What to do**:
  - Create `client/src/components/AIChatPanel.tsx`
  - A reusable component with:
    - Floating action button (FAB) in bottom-right corner — circular with `Sparkles` icon, SOCEM red (`#CC0000`) background
    - Click FAB → opens a slide-up panel/drawer from bottom-right (not fullscreen, ~400px wide, ~500px tall)
    - Panel contains a mini version of AIChatBox (pass height="400px")
    - Close button (X) to collapse back to FAB
    - Props: `{ context?: string, contextLabel?: string }` — context string passed to backend, contextLabel shown as header
    - Uses `trpc.ai.chat.useMutation()` — import from `@/lib/trpc`
    - Manages its own messages state internally (useState)
    - Initial system message: `{ role: "system", content: "Tu és um assistente útil do Portal de Onboarding da SOCEM. Respondes em português de Portugal." }`
    - Suggested prompts based on context:
      - Default: ["Resume o meu progresso", "O que devo fazer a seguir?", "Ajuda-me com o plano"]
      - With plan context: ["Explica-me esta tarefa", "O que falta fazer?", "Quando é o prazo final?"]
  - Export as default

  **Must NOT do**:
  - Do NOT make the panel fullscreen
  - Do NOT persist messages to localStorage (in-memory is fine)
  - Do NOT add animations beyond simple slide-up (use CSS transitions, not framer-motion)

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering` — UI component with animation/positioning
  > - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `client/src/components/AIChatBox.tsx:113-335` — the full AIChatBox component to embed inside the panel
  - `client/src/components/DashboardLayout.tsx:33-68` — existing floating modal pattern (LogoutReminderModal for overlay positioning reference)
  - `client/src/lib/trpc.ts` — tRPC client setup

  **Why Each Reference Matters**:
  - AIChatBox must be embedded as the panel content — understand its props interface
  - DashboardLayout shows the app's floating overlay pattern (absolute/fixed positioning)
  - trpc.ts shows the exact import path for useMutation

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: FAB renders and opens panel
    Tool: Playwright
    Preconditions: User logged in, any page using DashboardLayout
    Steps:
      1. Navigate to /dashboard
      2. Assert floating button with Sparkles icon is visible in bottom-right
      3. Click the button
      4. Assert panel slides up with chat input and "Assistente IA" header
    Expected Result: FAB visible → click → panel with AIChatBox appears
    Failure Indicators: FAB not visible, panel doesn't open, chat input missing
    Evidence: .omo/evidence/task-3-fab-panel.png

  Scenario: Send a message in the panel
    Tool: Playwright
    Preconditions: Panel is open
    Steps:
      1. Type "Olá" in the textarea
      2. Press Enter
      3. Wait for loading state
      4. Assert response message appears with AI content
    Expected Result: User message appears first, then AI response appears
    Failure Indicators: Loading never completes, response doesn't render, error shown
    Evidence: .omo/evidence/task-3-chat-response.png
  ```

  **Evidence to Capture**:
  - [ ] screenshot of FAB on page
  - [ ] screenshot of panel open with chat response

  **Commit**: YES
  - Message: `feat(ui): add AIChatPanel floating component for AI assistant`
  - Files: `client/src/components/AIChatPanel.tsx`

- [ ] 4. Create standalone AIChatPage and register route

  **What to do**:
  - Create `client/src/pages/AIChat.tsx`
  - Full-page chat with `DashboardLayout` wrapper (matches other pages)
  - Uses `trpc.ai.chat.useMutation()` for real AI calls
  - Manages its own messages state:
    - Initial messages: `{ role: "system", content: "Tu és um assistente útil do Portal de Onboarding da SOCEM. Respondes em português de Portugal." }`
    - On send: append user message → call mutation → on success append assistant response
  - Suggested prompts: ["O que posso fazer no portal?", "Como funcionam os planos?", "Ajuda-me com as tarefas", "O que é a SOCEM?"]
  - Layout: centered max-w-3xl, AIChatBox with height="calc(100vh - 200px)"
  - Title: "Assistente IA" with Sparkles icon in header
  - In `client/src/App.tsx`:
    - Add import: `import AIChat from "@/pages/AIChat";`
    - Add route: `<Route path={"/ai"} component={() => <ProtectedRoute component={AIChat} />} />`
  - In `client/src/components/DashboardLayout.tsx`:
    - Add import: `{ ..., Sparkles }` from "lucide-react" (if not already imported)
    - Add to `menuItems`: `{ icon: Sparkles, label: "Assistente IA", path: "/ai", roles: ["estagiario", "tutor", "admin"] }`

  **Must NOT do**:
  - Do NOT remove existing routes
  - Do NOT change the 404 fallback
  - Do NOT add the sidebar entry under footerItems (belongs in main menuItems)

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering` — new page layout with existing component
  > - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:
  - `client/src/pages/Dashboard.tsx:1-16` — page wrapper pattern (DashboardLayout, useAuth, trpc)
  - `client/src/components/AIChatBox.tsx:113-335` — component to render, props: messages, onSendMessage, isLoading, suggestedPrompts, height
  - `client/src/App.tsx:53-77` — route import and registration pattern (import + Route + Switch)
  - `client/src/components/DashboardLayout.tsx:74-83` — sidebar menu items array structure
  - `client/src/components/DashboardLayout.tsx:25` — existing lucide-react imports, pattern for adding Sparkles

  **Why Each Reference Matters**:
  - Dashboard.tsx shows the standard page template with DashboardLayout wrapper
  - AIChatBox.tsx shows the exact props needed for integration
  - App.tsx shows how to add the route (import, Route component)
  - DashboardLayout shows the menu structure and imports pattern

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Standalone AI page loads and responds
    Tool: Playwright
    Preconditions: User logged in
    Steps:
      1. Navigate to /ai
      2. Assert page title "Assistente IA" is visible
      3. Assert suggested prompts are visible (4 prompts)
      4. Type "Olá, quem és?" and press Enter
      5. Wait for response
      6. Assert AI response appears with markdown rendering
    Expected Result: Page renders, chat works end-to-end
    Failure Indicators: 404, no response from AI, suggested prompts missing
    Evidence: .omo/evidence/task-4-ai-page-chat.png

  Scenario: Sidebar has AI entry and navigates correctly
    Tool: Playwright
    Preconditions: User logged in
    Steps:
      1. Navigate to /dashboard
      2. Assert sidebar contains "Assistente IA" with Sparkles icon
      3. Click the sidebar entry
      4. Assert URL changes to /ai
    Expected Result: Sidebar item visible, click navigates to AI page
    Evidence: .omo/evidence/task-4-sidebar-nav.png
  ```

  **Evidence to Capture**:
  - [ ] screenshot of AI page with response
  - [ ] screenshot of sidebar with "Assistente IA" entry

  **Commit**: YES (groups with Tasks 3)
  - Message: `feat(ui): add AI Chat page and floating AIChatPanel component`
  - Files: `client/src/pages/AIChat.tsx`, `client/src/App.tsx`, `client/src/components/DashboardLayout.tsx`

- [ ] 5. LLM API key setup and documentation

  **What to do**:
  - Check if `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are set in the environment
  - If not set, determine the correct values (Forge API URL defaults to `https://forge.manus.im/v1/chat/completions` in `llm.ts`)
  - Update `.env.example` with LLM env vars:
    ```
    # Forge LLM API — usado pelo assistente AI
    # Obter em: https://forge.manus.im
    BUILT_IN_FORGE_API_URL=https://forge.manus.im/v1/chat/completions
    BUILT_IN_FORGE_API_KEY=fk-...
    ```
  - Update `server/_core/env.ts` if needed (already reads `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`)
  - Create a `.env.local` or instruct user to set the env vars
  - Restart the dev server and verify

  **Must NOT do**:
  - Do NOT commit real API keys to the repo
  - Do NOT change the default model (gemini-2.5-flash) in llm.ts

  **Recommended Agent Profile**:
  > - **Category**: `quick` — config change, straightforward
  > - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Tasks 6, 7 (functional blocking — AI won't work without this)
  - **Blocked By**: None

  **References**:
  - `server/_core/env.ts:9-10` — env var names: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`
  - `server/_core/llm.ts:213-215` — default Forge API URL resolution
  - `.env.example` — existing format for env documentation

  **Why Each Reference Matters**:
  - env.ts shows the exact variable names used by the app
  - llm.ts shows the default URL if not configured
  - .env.example shows the documentation pattern

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: API key is configured and working
    Tool: Bash (bun)
    Preconditions: env vars set, server ready to start
    Steps:
      1. Start server: bun run dev
      2. Wait for startup
      3. Check server logs for successful initialization
      4. Send test request via curl to ai.chat endpoint
    Expected Result: Server starts without LLM-related errors, ai.chat returns response
    Failure Indicators: "OPENAI_API_KEY is not configured" error, server crash
    Evidence: .omo/evidence/task-5-server-logs.txt
  ```

  **Evidence to Capture**:
  - [ ] server startup logs

  **Commit**: YES
  - Message: `chore: document LLM API vars in .env.example`
  - Files: `.env.example`

- [ ] 6. Integrate AIChatPanel into Dashboard with context

  **What to do**:
  - In `client/src/pages/Dashboard.tsx`:
    - Import `AIChatPanel` from `@/components/AIChatPanel`
    - Import `trpc` from `@/lib/trpc`
    - Add state: `const [chatContext, setChatContext] = useState<string | null>(null);`
    - On page mount (useEffect), fetch dashboard metrics via `trpc.dashboard.metrics.useQuery()` or `trpc.dashboard.myProgress.useQuery()`
    - Use `buildDashboardContext` from server (call the tRPC endpoint to get context) OR build a simple context string client-side from the metrics data
    - Simpler approach: build context string client-side from existing query data:
      ```
      const context = chatContext ?? undefined;
      ```
    - Place `<AIChatPanel context={context} contextLabel="Dashboard" />` near the end of the component
    - Context format: `"Estás no Dashboard. Tens {completionRate}% de conclusão, {activePlans} planos ativos, {pendingTasks} tarefas pendentes. O teu papel é {role}."`

  **Must NOT do**:
  - Do NOT make multiple unnecessary API calls — reuse existing metrics queries
  - Do NOT block the page if the AI panel context fails to load (graceful fallback)
  - Do NOT use server-side context builder for this (keep it simple with client-side string formatting)

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering` — integrating a component into an existing page
  > - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3, 4, 5

  **References**:
  - `client/src/pages/Dashboard.tsx:1-16` — full component, understand where to add imports and place the AIChatPanel
  - `client/src/components/AIChatPanel.tsx` — the component to integrate (props: context, contextLabel)
  - `client/src/pages/Dashboard.tsx:380-400` — around end of return, where to place the panel component

  **Why Each Reference Matters**:
  - Dashboard.tsx is the target — need to understand its structure to add the panel correctly
  - AIChatPanel is the component being integrated — understand its props
  - The return JSX shows where to place the floating component

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Dashboard has floating AI button with context
    Tool: Playwright
    Preconditions: User logged in as estagiario with active plans
    Steps:
      1. Navigate to /dashboard
      2. Assert FAB with Sparkles is visible (from AIChatPanel)
      3. Click FAB to open panel
      4. Type "Resume o meu progresso" and press Enter
      5. Wait for AI response
      6. Assert response mentions specific numbers (completion rate, plans count) from the dashboard context
    Expected Result: AI response includes actual dashboard metrics
    Failure Indicators: Generic response without specific metrics, no FAB
    Evidence: .omo/evidence/task-6-dashboard-ai.png
  ```

  **Evidence to Capture**:
  - [ ] screenshot of dashboard with AI panel open showing context-aware response

  **Commit**: YES (groups with Tasks 7)
  - Message: `feat(ui): integrate AI chat into Dashboard and PlanDetail with context`
  - Files: `client/src/pages/Dashboard.tsx`

- [ ] 7. Integrate AIChatPanel into PlanDetail with context

  **What to do**:
  - In `client/src/pages/PlanDetail.tsx`:
    - Import `AIChatPanel` from `@/components/AIChatPanel`
    - Import `trpc` from `@/lib/trpc`
    - Import `useParams` or get the plan ID from existing props/state
    - Build context string from the plan data:
      ```
      const plan = ... // from existing useQuery or tRPC call
      const context = React.useMemo(() => {
        if (!plan) return undefined;
        const tasks = plan.tasks || [];
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        return `Estás no plano "${plan.title}". Estado: ${plan.status}. Datas: ${plan.startDate ?? "sem inicio"} a ${plan.endDate ?? "sem fim"}. Total de tarefas: ${tasks.length} (${completed} concluídas, ${inProgress} em progresso, ${pending} pendentes).`;
      }, [plan]);
      ```
    - Place `<AIChatPanel context={context} contextLabel={plan?.title ?? "Plano"} />` near the end of the return JSX
    - Ensure the context updates when plan data changes (useMemo dependency)

  **Must NOT do**:
  - Do NOT add a second AI panel if DashboardLayout already has one (AIChatPanel is page-level)
  - Do NOT block the page render while context is being computed
  - Do NOT include sensitive data in context

  **Recommended Agent Profile**:
  > - **Category**: `visual-engineering` — integrating a component into an existing page
  > - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 3, 5

  **References**:
  - `client/src/pages/PlanDetail.tsx:1-40` — full component structure
  - `client/src/components/AIChatPanel.tsx` — the component to integrate
  - `client/src/pages/PlanDetail.tsx:` — find the return JSX to place AIChatPanel

  **Why Each Reference Matters**:
  - PlanDetail.tsx is the target — understand existing structure to integrate properly
  - AIChatPanel shows component props for integration

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: PlanDetail has floating AI button with plan context
    Tool: Playwright
    Preconditions: User logged in, at least one plan with tasks exists
    Steps:
      1. Navigate to /plans/1 (or any valid plan ID)
      2. Assert FAB with Sparkles is visible
      3. Click FAB to open panel
      4. Type "O que falta fazer?" and press Enter
      5. Wait for AI response
      6. Assert response mentions the plan name or specific task titles
    Expected Result: AI response references the specific plan and its tasks
    Failure Indicators: Generic response without plan context, no FAB
    Evidence: .omo/evidence/task-7-plandetail-ai.png
  ```

  **Evidence to Capture**:
  - [ ] screenshot of PlanDetail with AI panel open showing context-aware response

  **Commit**: YES (groups with Tasks 6)
  - Message: `feat(ui): integrate AI chat into Dashboard and PlanDetail with context`
  - Files: `client/src/pages/PlanDetail.tsx`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .omo/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: Skip (backend endpoint — commit with frontend tasks later)
- **2**: Skip (context builders — commit with backend tasks)
- **3**: `feat(ui): add AIChatPanel floating component for AI assistant` — `client/src/components/AIChatPanel.tsx`
- **4+3**: `feat(ui): add AI Chat page and floating AIChatPanel component` — `client/src/pages/AIChat.tsx`, `client/src/App.tsx`, `client/src/components/DashboardLayout.tsx`, `client/src/components/AIChatPanel.tsx`
- **5**: `chore: document LLM API vars in .env.example` — `.env.example`
- **6+7**: `feat(ui): integrate AI chat into Dashboard and PlanDetail with context` — `client/src/pages/Dashboard.tsx`, `client/src/pages/PlanDetail.tsx`

All commits should start from clean working tree. Use `bun check && bun test` before each commit.

---

## Success Criteria

### Verification Commands
```bash
# Server check
bun run dev
# Type check
bun run check
# Test existing test suite
bun test
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `/ai` page loads and responds
- [ ] Dashboard FAB opens panel with context-aware AI
- [ ] PlanDetail FAB opens panel with context-aware AI
- [ ] Sidebar has "Assistente IA" entry
- [ ] `.env.example` documents LLM vars
- [ ] All QA evidence files exist in `.omo/evidence/`
- [ ] All tests pass
