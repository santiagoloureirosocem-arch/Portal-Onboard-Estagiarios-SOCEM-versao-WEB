import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, onboardingPlans, onboardingTasks, planAssignments, taskCompletions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── File-backed persistent store (used when DATABASE_URL is not set) ────────
import fs from "fs";
import path from "path";

const LOCAL_DB_PATH = path.resolve(process.cwd(), "data", "local-db.json");

interface LocalDb {
  nextId: number;
  users: User[];
  plans: any[];
  tasks: any[];
  assignments: any[];
  completions: any[];
}

function loadLocalDb(): LocalDb {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      const parsed = JSON.parse(raw) as LocalDb;
      parsed.users = (parsed.users || []).map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
        lastSignedIn: new Date(u.lastSignedIn),
        passwordHash: u.passwordHash ?? null,
      }));
      return parsed;
    }
  } catch (e) {
    console.warn("[LocalDB] Failed to load, starting fresh:", e);
  }
  return { nextId: 1, users: [], plans: [], tasks: [], assignments: [], completions: [] };
}

export function saveLocalDb(): void {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data: LocalDb = {
      nextId: _nextId,
      users: Array.from(memUsers.values()),
      plans: memPlans,
      tasks: memTasks,
      assignments: memAssignments,
      completions: memCompletions,
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("[LocalDB] Failed to save:", e);
  }
}

const _localDb = loadLocalDb();
let _nextId = _localDb.nextId;
const memUsers = new Map<string, User>((_localDb.users || []).map((u: User) => [u.openId, u]));
const memPlans: any[] = _localDb.plans || [];
const memTasks: any[] = _localDb.tasks || [];
const memAssignments: any[] = _localDb.assignments || [];
const memCompletions: any[] = _localDb.completions || [];

function makeUser(data: InsertUser): User {
  const now = new Date();
  return {
    id: _nextId++,
    openId: data.openId!,
    name: data.name ?? null,
    email: data.email ?? null,
    loginMethod: data.loginMethod ?? null,
    role: (data.role ?? "estagiario") as any,
    department: data.department ?? null,
    position: data.position ?? null,
    isActive: data.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    passwordHash: data.passwordHash ?? null,
  };
}
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();

  if (!db) {
    // In-memory fallback
    const existing = memUsers.get(user.openId);
    if (existing) {
      // Only merge fields that are explicitly provided (not undefined)
      // to avoid accidentally overwriting passwordHash, role, isActive, etc.
      const patch: Partial<User> = { updatedAt: new Date() };
      if (user.name !== undefined) patch.name = user.name ?? null;
      if (user.email !== undefined) patch.email = user.email ?? null;
      if (user.loginMethod !== undefined) patch.loginMethod = user.loginMethod ?? null;
      if (user.department !== undefined) patch.department = user.department ?? null;
      if (user.position !== undefined) patch.position = user.position ?? null;
      if (user.role !== undefined) patch.role = user.role as any;
      if (user.isActive !== undefined) patch.isActive = user.isActive;
      if (user.lastSignedIn !== undefined) patch.lastSignedIn = user.lastSignedIn;
      if (user.passwordHash !== undefined) patch.passwordHash = user.passwordHash ?? null;
      memUsers.set(user.openId, { ...existing, ...patch });
    } else {
      memUsers.set(user.openId, makeUser(user));
    }
    saveLocalDb();
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "department", "position"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (user.isActive !== undefined) { values.isActive = user.isActive; updateSet.isActive = user.isActive; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return memUsers.get(openId) ?? undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Find a dynamic local user by their username (stored as openId = "local-<username>") */
export async function getUserByUsername(username: string) {
  const openId = `local-dyn-${username}`;
  const db = await getDb();
  if (!db) return memUsers.get(openId) ?? undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    for (const u of memUsers.values()) if (u.id === id) return u;
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return Array.from(memUsers.values()).filter(u => u.isActive);
  return await db.select().from(users).where(eq(users.isActive, true));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    for (const [key, u] of memUsers.entries()) {
      if (u.id === id) { memUsers.set(key, { ...u, ...data as any, updatedAt: new Date() }); saveLocalDb(); return memUsers.get(key); }
    }
    return undefined;
  }
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
  return await getUserById(id);
}

export async function deactivateUser(id: number) {
  const db = await getDb();
  if (!db) {
    for (const [key, u] of memUsers.entries()) {
      if (u.id === id) { memUsers.set(key, { ...u, isActive: false, updatedAt: new Date() }); saveLocalDb(); return memUsers.get(key); }
    }
    return undefined;
  }
  await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, id));
  return await getUserById(id);
}

// Onboarding Plans
export async function createOnboardingPlan(data: { title: string; description?: string; createdBy: number }) {
  const db = await getDb();
  if (!db) {
    const plan = { id: _nextId++, ...data, status: 'draft' as const, createdAt: new Date(), updatedAt: new Date() };
    memPlans.push(plan); saveLocalDb(); return plan;
  }
  const result = await db.insert(onboardingPlans).values({ title: data.title, description: data.description, createdBy: data.createdBy });
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  return { id: insertId, ...data, status: 'draft' as const };
}

export async function getOnboardingPlanById(id: number) {
  const db = await getDb();
  if (!db) return memPlans.find(p => p.id === id);
  const result = await db.select().from(onboardingPlans).where(eq(onboardingPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOnboardingPlans() {
  const db = await getDb();
  if (!db) return [...memPlans].reverse();
  return await db.select().from(onboardingPlans).orderBy(desc(onboardingPlans.createdAt));
}

export async function getPlansAssignedToUser(userId: number) {
  const db = await getDb();
  if (!db) {
    const assignedPlanIds = new Set(memAssignments.filter(a => a.userId === userId).map(a => a.planId));
    return memPlans.filter(p => assignedPlanIds.has(p.id));
  }
  // Join plan_assignments with onboarding_plans to get plans for this user
  const assignments = await db.select().from(planAssignments).where(eq(planAssignments.userId, userId));
  if (assignments.length === 0) return [];
  const planIds = assignments.map(a => a.planId);
  const plans = await db.select().from(onboardingPlans).orderBy(desc(onboardingPlans.createdAt));
  return plans.filter(p => planIds.includes(p.id));
}

export async function updateOnboardingPlan(id: number, data: Partial<{ title: string; description: string; status: 'draft' | 'active' | 'completed' | 'archived' }>) {
  const db = await getDb();
  if (!db) {
    const idx = memPlans.findIndex(p => p.id === id);
    if (idx >= 0) { memPlans[idx] = { ...memPlans[idx], ...data, updatedAt: new Date() }; return memPlans[idx]; }
    return undefined;
  }
  await db.update(onboardingPlans).set({ ...data, updatedAt: new Date() }).where(eq(onboardingPlans.id, id));
  return await getOnboardingPlanById(id);
}

// Onboarding Tasks
export async function createOnboardingTask(data: { planId: number; title: string; description?: string; order: number; dueDate?: Date; assignedTo?: number }) {
  const db = await getDb();
  if (!db) {
    const task = { id: _nextId++, ...data, status: 'pending' as const, createdAt: new Date(), updatedAt: new Date() };
    memTasks.push(task); saveLocalDb(); return task;
  }
  return await db.insert(onboardingTasks).values(data);
}

export async function getTasksByPlanId(planId: number) {
  const db = await getDb();
  if (!db) return memTasks.filter(t => t.planId === planId).sort((a, b) => a.order - b.order);
  return await db.select().from(onboardingTasks).where(eq(onboardingTasks.planId, planId)).orderBy(onboardingTasks.order);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return memTasks.find(t => t.id === id);
  const result = await db.select().from(onboardingTasks).where(eq(onboardingTasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOnboardingTask(id: number, data: Partial<{ title: string; description: string; status: 'pending' | 'in_progress' | 'completed'; assignedTo: number; dueDate: Date }>) {
  const db = await getDb();
  if (!db) {
    const idx = memTasks.findIndex(t => t.id === id);
    if (idx >= 0) memTasks[idx] = { ...memTasks[idx], ...data, updatedAt: new Date() };
    return memTasks.filter(t => t.id === id);
  }
  await db.update(onboardingTasks).set({ ...data, updatedAt: new Date() }).where(eq(onboardingTasks.id, id));
  return await db.select().from(onboardingTasks).where(eq(onboardingTasks.id, id)).limit(1);
}

// Plan Assignments
export async function assignPlanToUser(data: { planId: number; userId: number; assignedBy: number; startDate: Date; expectedEndDate?: Date }) {
  const db = await getDb();
  if (!db) {
    const a = { id: _nextId++, ...data, status: 'active' as const, progress: 0, createdAt: new Date(), updatedAt: new Date() };
    memAssignments.push(a); saveLocalDb(); return a;
  }
  return await db.insert(planAssignments).values(data);
}

export async function getPlanAssignmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return memAssignments.filter(a => a.userId === userId).reverse();
  return await db.select().from(planAssignments).where(eq(planAssignments.userId, userId)).orderBy(desc(planAssignments.createdAt));
}

export async function getPlanAssignmentsByPlanId(planId: number) {
  const db = await getDb();
  if (!db) {
    return memAssignments
      .filter(a => a.planId === planId)
      .map(a => {
        const user = Array.from(memUsers.values()).find(u => u.id === a.userId);
        return { ...a, userName: user?.name ?? null };
      });
  }
  return await db.select().from(planAssignments).where(eq(planAssignments.planId, planId));
}

export async function updatePlanAssignment(id: number, data: Partial<{ status: 'active' | 'completed' | 'paused' | 'cancelled'; progress: number }>) {
  const db = await getDb();
  if (!db) {
    const idx = memAssignments.findIndex(a => a.id === id);
    if (idx >= 0) memAssignments[idx] = { ...memAssignments[idx], ...data, updatedAt: new Date() };
    return memAssignments.filter(a => a.id === id);
  }
  await db.update(planAssignments).set({ ...data, updatedAt: new Date() }).where(eq(planAssignments.id, id));
  return await db.select().from(planAssignments).where(eq(planAssignments.id, id)).limit(1);
}

// Task Completions
export async function createTaskCompletion(data: { taskId: number; userId: number; status: 'pending' | 'in_progress' | 'completed'; notes?: string }) {
  const db = await getDb();
  if (!db) {
    const c = { id: _nextId++, ...data, completedAt: null, createdAt: new Date(), updatedAt: new Date() };
    memCompletions.push(c); saveLocalDb(); return c;
  }
  return await db.insert(taskCompletions).values(data);
}

export async function getTaskCompletionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return memCompletions.filter(c => c.userId === userId);
  return await db.select().from(taskCompletions).where(eq(taskCompletions.userId, userId));
}

export async function getTaskCompletionsByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return memCompletions.filter(c => c.taskId === taskId);
  return await db.select().from(taskCompletions).where(eq(taskCompletions.taskId, taskId));
}

export async function updateTaskCompletion(id: number, data: Partial<{ status: 'pending' | 'in_progress' | 'completed'; completedAt: Date; notes: string }>) {
  const db = await getDb();
  if (!db) {
    const idx = memCompletions.findIndex(c => c.id === id);
    if (idx >= 0) memCompletions[idx] = { ...memCompletions[idx], ...data, updatedAt: new Date() };
    return memCompletions.filter(c => c.id === id);
  }
  await db.update(taskCompletions).set({ ...data, updatedAt: new Date() }).where(eq(taskCompletions.id, id));
  return await db.select().from(taskCompletions).where(eq(taskCompletions.id, id)).limit(1);
}

// Auto-complete a plan if all its tasks are completed (or it has no tasks)
export async function checkAndAutoCompletePlan(planId: number) {
  const plan = await getOnboardingPlanById(planId);
  if (!plan || plan.status !== 'active') return; // only auto-complete active plans
  const tasks = await getTasksByPlanId(planId);
  const allDone = tasks.length === 0 || tasks.every((t: any) => t.status === 'completed');
  if (allDone) {
    await updateOnboardingPlan(planId, { status: 'completed' });
  }
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return memTasks;
  return await db.select().from(onboardingTasks).orderBy(onboardingTasks.dueDate);
}

// Dashboard metrics
export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) {
    return {
      activeInterns: Array.from(memUsers.values()).filter(u => u.isActive && u.role === 'estagiario').length,
      activePlans: memPlans.filter(p => p.status === 'active').length,
      pendingTasks: memTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      completionRate: memTasks.length > 0
        ? Math.round((memTasks.filter(t => t.status === 'completed').length / memTasks.length) * 100)
        : 0,
    };
  }
  const activeInterns = await db.select().from(users).where(and(eq(users.isActive, true), eq(users.role, 'estagiario')));
  const activePlans = await db.select().from(onboardingPlans).where(eq(onboardingPlans.status, 'active'));
  const allTasks = await db.select().from(onboardingTasks);
  const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const completionRate = allTasks.length > 0
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0;
  return {
    activeInterns: activeInterns.length,
    activePlans: activePlans.length,
    pendingTasks: pendingTasks.length,
    completionRate,
  };
}

export async function deleteOnboardingPlan(id: number) {
  const db = await getDb();
  if (!db) {
    const idx = memPlans.findIndex(p => p.id === id);
    if (idx >= 0) { memPlans.splice(idx, 1); saveLocalDb(); }
    return;
  }
  await db.delete(onboardingPlans).where(eq(onboardingPlans.id, id));
}

export async function deleteOnboardingTask(id: number) {
  const db = await getDb();
  if (!db) {
    const idx = memTasks.findIndex(t => t.id === id);
    if (idx >= 0) { memTasks.splice(idx, 1); saveLocalDb(); }
    return;
  }
  await db.delete(onboardingTasks).where(eq(onboardingTasks.id, id));
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityLogEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;       // e.g. "task_completed", "plan_created", "user_created"
  description: string;  // human-readable, e.g. "Concluiu a tarefa 'Reunião inicial'"
  entityType: 'task' | 'plan' | 'user' | 'assignment';
  entityId: number | null;
  createdAt: Date;
}

const MAX_LOG_ENTRIES = 200;
let _activityLog: ActivityLogEntry[] = [];
let _activityLogNextId = 1;

export function addActivityLog(entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>): void {
  const newEntry: ActivityLogEntry = {
    ...entry,
    id: _activityLogNextId++,
    createdAt: new Date(),
  };
  _activityLog.unshift(newEntry); // newest first
  if (_activityLog.length > MAX_LOG_ENTRIES) {
    _activityLog = _activityLog.slice(0, MAX_LOG_ENTRIES);
  }
}

export function getActivityLog(limit = 50): ActivityLogEntry[] {
  return _activityLog.slice(0, limit);
}
