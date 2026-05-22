import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, onboardingPlans, onboardingTasks, planAssignments, taskCompletions, taskComments, taskAttachments } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      await initTables(_db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function initTables(db: ReturnType<typeof drizzle>) {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('estagiario','tutor','admin') NOT NULL DEFAULT 'estagiario',
        passwordHash VARCHAR(255),
        department VARCHAR(255),
        position VARCHAR(255),
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS onboarding_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
        createdBy INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        \`order\` INT NOT NULL,
        dueDate DATETIME,
        status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
        assignedTo INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS plan_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planId INT NOT NULL,
        userId INT NOT NULL,
        assignedBy INT NOT NULL,
        startDate DATETIME NOT NULL,
        expectedEndDate DATETIME,
        status ENUM('active','completed','paused','cancelled') NOT NULL DEFAULT 'active',
        progress INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        taskId INT NOT NULL,
        userId INT NOT NULL,
        completedAt DATETIME,
        notes TEXT,
        status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        taskId INT NOT NULL,
        userId INT NOT NULL,
        userName VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        taskId INT NOT NULL,
        userId INT NOT NULL,
        fileName VARCHAR(255) NOT NULL,
        fileUrl TEXT NOT NULL,
        fileSize VARCHAR(50),
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        senderId INT NOT NULL,
        senderName VARCHAR(255) NOT NULL,
        receiverId INT NOT NULL,
        text TEXT NOT NULL DEFAULT '',
        fileName VARCHAR(255),
        fileUrl LONGTEXT,
        fileSize VARCHAR(50),
        fileType VARCHAR(50),
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[Database] Tables ready");
  } catch (err) {
    console.warn("[Database] Table init error:", err);
  }
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
  const results = await db
    .select({
      id: planAssignments.id,
      planId: planAssignments.planId,
      userId: planAssignments.userId,
      assignedBy: planAssignments.assignedBy,
      startDate: planAssignments.startDate,
      expectedEndDate: planAssignments.expectedEndDate,
      status: planAssignments.status,
      progress: planAssignments.progress,
      createdAt: planAssignments.createdAt,
      updatedAt: planAssignments.updatedAt,
      userName: users.name,
    })
    .from(planAssignments)
    .leftJoin(users, eq(planAssignments.userId, users.id))
    .where(eq(planAssignments.planId, planId));
  return results;
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

// ─── Task Comments ────────────────────────────────────────────────────────────
let _memComments: any[] = [];
let _commentNextId = 1;

export async function getCommentsByTaskId(taskId: number) {
  const dbConn = await getDb();
  if (!dbConn) return _memComments.filter(c => c.taskId === taskId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return await dbConn.select().from(taskComments).where(eq(taskComments.taskId, taskId));
}

export async function createComment(data: { taskId: number; userId: number; userName: string; text: string }) {
  const dbConn = await getDb();
  if (!dbConn) {
    const comment = { id: _commentNextId++, ...data, createdAt: new Date() };
    _memComments.push(comment);
    return comment;
  }
  await dbConn.insert(taskComments).values(data);
  const rows = await dbConn.select().from(taskComments).where(eq(taskComments.taskId, data.taskId));
  return rows[rows.length - 1];
}

export async function deleteComment(id: number) {
  const dbConn = await getDb();
  if (!dbConn) { _memComments = _memComments.filter(c => c.id !== id); return; }
  await dbConn.delete(taskComments).where(eq(taskComments.id, id));
}

// ─── Task Attachments ─────────────────────────────────────────────────────────
let _memAttachments: any[] = [];
let _attachmentNextId = 1;

export async function getAttachmentsByTaskId(taskId: number) {
  const dbConn = await getDb();
  if (!dbConn) return _memAttachments.filter(a => a.taskId === taskId);
  return await dbConn.select().from(taskAttachments).where(eq(taskAttachments.taskId, taskId));
}

export async function createAttachment(data: { taskId: number; userId: number; fileName: string; fileUrl: string; fileSize?: string }) {
  const dbConn = await getDb();
  if (!dbConn) {
    const att = { id: _attachmentNextId++, ...data, createdAt: new Date() };
    _memAttachments.push(att);
    return att;
  }
  await dbConn.insert(taskAttachments).values(data);
  const rows = await dbConn.select().from(taskAttachments).where(eq(taskAttachments.taskId, data.taskId));
  return rows[rows.length - 1];
}

// ─── Direct Messages ─────────────────────────────────────────────────────────
let _memMessages: any[] = [];
let _messageNextId = 1;

export async function getDirectMessages(userA: number, userB: number) {
  const dbConn = await getDb();
  const minId = Math.min(userA, userB);
  const maxId = Math.max(userA, userB);
  if (!dbConn) {
    return _memMessages
      .filter(m => (m.senderId === userA && m.receiverId === userB) || (m.senderId === userB && m.receiverId === userA))
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return await dbConn.execute(sql`
    SELECT * FROM direct_messages
    WHERE (senderId = ${userA} AND receiverId = ${userB})
       OR (senderId = ${userB} AND receiverId = ${userA})
    ORDER BY createdAt ASC
  `).then((r: any) => r[0] ?? r);
}

export async function createDirectMessage(data: {
  senderId: number; senderName: string; receiverId: number;
  text: string; fileName?: string; fileUrl?: string; fileSize?: string; fileType?: string;
}) {
  const dbConn = await getDb();
  if (!dbConn) {
    const msg = { id: _messageNextId++, ...data, isRead: false, createdAt: new Date() };
    _memMessages.push(msg);
    return msg;
  }
  await dbConn.execute(sql`
    INSERT INTO direct_messages (senderId, senderName, receiverId, text, fileName, fileUrl, fileSize, fileType)
    VALUES (${data.senderId}, ${data.senderName}, ${data.receiverId}, ${data.text},
            ${data.fileName ?? null}, ${data.fileUrl ?? null}, ${data.fileSize ?? null}, ${data.fileType ?? null})
  `);
  const rows: any = await dbConn.execute(sql`SELECT * FROM direct_messages WHERE senderId=${data.senderId} ORDER BY id DESC LIMIT 1`);
  return (rows[0] ?? rows)[0];
}

export async function markMessagesAsRead(receiverId: number, senderId: number) {
  const dbConn = await getDb();
  if (!dbConn) {
    _memMessages.forEach(m => { if (m.senderId === senderId && m.receiverId === receiverId) m.isRead = true; });
    return;
  }
  await dbConn.execute(sql`
    UPDATE direct_messages SET isRead = TRUE
    WHERE senderId = ${senderId} AND receiverId = ${receiverId} AND isRead = FALSE
  `);
}

export async function getUnreadCounts(userId: number) {
  const dbConn = await getDb();
  if (!dbConn) {
    const counts: Record<number, number> = {};
    _memMessages.filter(m => m.receiverId === userId && !m.isRead).forEach(m => {
      counts[m.senderId] = (counts[m.senderId] ?? 0) + 1;
    });
    return counts;
  }
  const rows: any = await dbConn.execute(sql`
    SELECT senderId, COUNT(*) as cnt FROM direct_messages
    WHERE receiverId = ${userId} AND isRead = FALSE
    GROUP BY senderId
  `);
  const result: Record<number, number> = {};
  (rows[0] ?? rows).forEach((r: any) => { result[Number(r.senderId)] = Number(r.cnt); });
  return result;
}

export async function deleteAttachment(id: number) {
  const dbConn = await getDb();
  if (!dbConn) { _memAttachments = _memAttachments.filter(a => a.id !== id); return; }
  await dbConn.delete(taskAttachments).where(eq(taskAttachments.id, id));
}
