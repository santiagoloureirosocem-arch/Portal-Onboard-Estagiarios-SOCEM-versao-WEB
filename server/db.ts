import { eq, and, desc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, onboardingPlans, onboardingTasks, planAssignments, taskCompletions, taskComments, taskAttachments, directMessages, DirectMessage, InsertDirectMessage, notifications, dailyCheckins, aiUsage } from "../drizzle/schema";
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
        darkMode BOOLEAN NOT NULL DEFAULT FALSE,
        avatar TEXT,
        presence ENUM('online','ausente','offline') NOT NULL DEFAULT 'online',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Migração: adicionar colunas em falta se a tabela já existir
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN darkMode BOOLEAN NOT NULL DEFAULT FALSE`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN avatar TEXT`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN presence ENUM('online','ausente','offline') NOT NULL DEFAULT 'online'`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN emailTaskDeadline BOOLEAN NOT NULL DEFAULT TRUE`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN emailTaskOverdue BOOLEAN NOT NULL DEFAULT TRUE`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN emailNewMessage BOOLEAN NOT NULL DEFAULT TRUE`); } catch {}
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS onboarding_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        startDate DATETIME,
        endDate DATETIME,
        status ENUM('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
        createdBy INT NOT NULL,
        isTemplate BOOLEAN NOT NULL DEFAULT FALSE,
        templateOriginPlanId INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    try { await db.execute(sql`ALTER TABLE onboarding_plans ADD COLUMN startDate DATETIME`); } catch {}
    try { await db.execute(sql`ALTER TABLE onboarding_plans ADD COLUMN endDate DATETIME`); } catch {}
    try { await db.execute(sql`ALTER TABLE onboarding_plans ADD COLUMN isTemplate BOOLEAN NOT NULL DEFAULT FALSE`); } catch {}
    try { await db.execute(sql`ALTER TABLE onboarding_plans ADD COLUMN templateOriginPlanId INT`); } catch {}
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        \`order\` INT NOT NULL,
        startDate DATETIME,
        dueDate DATETIME,
        status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
        assignedTo INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    try { await db.execute(sql`ALTER TABLE onboarding_tasks ADD COLUMN startDate DATETIME`); } catch {}
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
        text TEXT NOT NULL,
        fileName VARCHAR(255),
        fileUrl LONGTEXT,
        fileSize VARCHAR(50),
        fileType VARCHAR(50),
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('task','plan','message','system','badge') NOT NULL DEFAULT 'system',
        link VARCHAR(500),
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        date DATETIME NOT NULL,
        mood ENUM('great','good','okay','bad','terrible') NOT NULL,
        note TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        date DATETIME NOT NULL,
        \`count\` INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  notifications: any[];
  dailyCheckins: any[];
  userBadges: any[];
  aiUsage: any[];
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
      parsed.plans = (parsed.plans || []).map((p: any) => ({
        ...p,
        startDate: p.startDate ? new Date(p.startDate) : null,
        endDate: p.endDate ? new Date(p.endDate) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
      parsed.tasks = (parsed.tasks || []).map((t: any) => ({
        ...t,
        startDate: t.startDate ? new Date(t.startDate) : null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
      parsed.assignments = (parsed.assignments || []).map((a: any) => ({
        ...a,
        startDate: new Date(a.startDate),
        expectedEndDate: a.expectedEndDate ? new Date(a.expectedEndDate) : null,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
      return parsed;
    }
  } catch (e) {
    console.warn("[LocalDB] Failed to load, starting fresh:", e);
  }
  return { nextId: 1, users: [], plans: [], tasks: [], assignments: [], completions: [], notifications: [], dailyCheckins: [], userBadges: [], aiUsage: [] };
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
      notifications: _memNotifications,
      dailyCheckins: _memDailyCheckins,
      userBadges: _memUserBadges,
      aiUsage: _memAiUsage,
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
let _memNotifications: any[] = _localDb.notifications || [];
let _notificationNextId = _memNotifications.length > 0 ? Math.max(..._memNotifications.map((n: any) => n.id)) + 1 : 1;
let _memDailyCheckins: any[] = _localDb.dailyCheckins || [];
let _checkinNextId = _memDailyCheckins.length > 0 ? Math.max(..._memDailyCheckins.map((c: any) => c.id)) + 1 : 1;
let _memUserBadges: any[] = _localDb.userBadges || [];
let _badgeNextId = _memUserBadges.length > 0 ? Math.max(..._memUserBadges.map((b: any) => b.id)) + 1 : 1;
let _memAiUsage: any[] = [];
let _aiUsageNextId = 1;

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
    darkMode: (data as any).darkMode ?? false,
    avatar: (data as any).avatar ?? null,
    presence: (data as any).presence ?? 'online',
    emailTaskDeadline: (data as any).emailTaskDeadline ?? true,
    emailTaskOverdue: (data as any).emailTaskOverdue ?? true,
    emailNewMessage: (data as any).emailNewMessage ?? true,
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
      if (user.avatar !== undefined) patch.avatar = user.avatar ?? null;
      if ((user as any).presence !== undefined) (patch as any).presence = (user as any).presence;
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
    if (user.passwordHash !== undefined) { (values as any).passwordHash = user.passwordHash; (updateSet as any).passwordHash = user.passwordHash; }
    if (user.avatar !== undefined) { (values as any).avatar = user.avatar; (updateSet as any).avatar = user.avatar; }
    if ((user as any).presence !== undefined) { (values as any).presence = (user as any).presence; (updateSet as any).presence = (user as any).presence; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function updatePresence(id: number, presence: 'online' | 'ausente' | 'offline') {
  const db = await getDb();
  if (!db) {
    for (const [key, u] of memUsers.entries()) {
      if (u.id === id) { memUsers.set(key, { ...u, presence, updatedAt: new Date() }); saveLocalDb(); return; }
    }
    return;
  }
  await db.update(users).set({ presence } as any).where(eq(users.id, id));
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

export async function getUsersWithLastMessage(userId: number) {
  const db = await getDb();
  if (!db) {
    const allUsers = Array.from(memUsers.values()).filter(u => u.isActive && u.id !== userId);
    const lastMsgMap: Record<number, string | null> = {};
    for (const msg of _memMessages) {
      let contactId: number | null = null;
      if (msg.senderId === userId) contactId = msg.receiverId;
      else if (msg.receiverId === userId) contactId = msg.senderId;
      if (contactId === null) continue;
      const msgTime = new Date(msg.createdAt).getTime();
      const existing = lastMsgMap[contactId];
      if (!existing || msgTime > new Date(existing).getTime()) {
        lastMsgMap[contactId] = new Date(msg.createdAt).toISOString();
      }
    }
    return allUsers.map(u => ({
      ...u,
      lastMessageAt: lastMsgMap[u.id] ?? null,
    }));
  }

  const rows = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      position: users.position,
      avatar: users.avatar,
      presence: users.presence,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      darkMode: users.darkMode,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastSignedIn: users.lastSignedIn,
      emailTaskDeadline: users.emailTaskDeadline,
      emailTaskOverdue: users.emailTaskOverdue,
      emailNewMessage: users.emailNewMessage,
      lastMessageAt: sql<string | null>`
        (SELECT MAX(dm.createdAt)
         FROM direct_messages dm
         WHERE (dm.senderId = users.id AND dm.receiverId = ${userId})
            OR (dm.senderId = ${userId} AND dm.receiverId = users.id))
      `,
    })
    .from(users)
    .where(and(eq(users.isActive, true), sql`${users.id} != ${userId}`));

  return rows;
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

export async function getUserEmailPreferences(userId: number) {
  const user = await getUserById(userId);
  if (!user) return { emailTaskDeadline: true, emailTaskOverdue: true, emailNewMessage: true };
  return {
    emailTaskDeadline: (user as any).emailTaskDeadline !== false,
    emailTaskOverdue: (user as any).emailTaskOverdue !== false,
    emailNewMessage: (user as any).emailNewMessage !== false,
  };
}

export async function updateEmailPreferences(userId: number, prefs: { emailTaskDeadline?: boolean; emailTaskOverdue?: boolean; emailNewMessage?: boolean }) {
  await updateUser(userId, prefs as any);
  return { success: true };
}

export async function deactivateUser(id: number) {
  const db = await getDb();
  if (!db) {
    for (const [key, u] of memUsers.entries()) {
      if (u.id === id) { memUsers.delete(key); saveLocalDb(); return; }
    }
    return undefined;
  }
  await db.delete(users).where(eq(users.id, id));
}

// Onboarding Plans
export async function createOnboardingPlan(data: { title: string; description?: string; createdBy: number; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) {
    const plan = { id: _nextId++, ...data, status: 'draft' as const, createdAt: new Date(), updatedAt: new Date() };
    memPlans.push(plan); saveLocalDb(); return plan;
  }
  const values: Record<string, unknown> = { title: data.title, description: data.description, createdBy: data.createdBy };
  if (data.startDate) values.startDate = data.startDate;
  if (data.endDate) values.endDate = data.endDate;
  const result = await db.insert(onboardingPlans).values(values as any);
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
    const assignedPlanIds = new Set(
      memAssignments
        .filter(a => a.userId === userId && (a.status === 'active' || a.status === 'completed'))
        .map(a => a.planId)
    );
    return memPlans.filter(p => assignedPlanIds.has(p.id));
  }
  const assignments = await db
    .select()
    .from(planAssignments)
    .where(and(
      eq(planAssignments.userId, userId),
      or(eq(planAssignments.status, 'active'), eq(planAssignments.status, 'completed'))
    ));
  if (assignments.length === 0) return [];
  const planIds = assignments.map(a => a.planId);
  const plans = await db.select().from(onboardingPlans).orderBy(desc(onboardingPlans.createdAt));
  return plans.filter(p => planIds.includes(p.id));
}

export async function updateOnboardingPlan(id: number, data: Partial<{ title: string; description: string; status: 'draft' | 'active' | 'completed' | 'archived'; startDate: Date; endDate: Date }>) {
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
export async function createOnboardingTask(data: { planId: number; title: string; description?: string; order: number; startDate?: Date; dueDate?: Date; assignedTo?: number }) {
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

export async function updateOnboardingTask(id: number, data: Partial<{ title: string; description: string; status: 'pending' | 'in_progress' | 'completed'; assignedTo: number; startDate: Date; dueDate: Date }>) {
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
  if (!db) {
    return memAssignments
      .filter(a => a.userId === userId)
      .reverse()
      .map(a => {
        const plan = memPlans.find(p => p.id === a.planId);
        return { ...a, planTitle: plan?.title ?? null };
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
      planTitle: onboardingPlans.title,
    })
    .from(planAssignments)
    .leftJoin(onboardingPlans, eq(planAssignments.planId, onboardingPlans.id))
    .where(eq(planAssignments.userId, userId))
    .orderBy(desc(planAssignments.createdAt));
  return results;
}

export async function getPlanAssignmentsByPlanId(planId: number) {
  const db = await getDb();
  if (!db) {
    return memAssignments
      .filter(a => a.planId === planId)
      .map(a => {
        const user = Array.from(memUsers.values()).find(u => u.id === a.userId);
        return { ...a, userName: user?.name ?? null, userAvatar: user?.avatar ?? null, userPresence: (user as any)?.presence ?? 'online' };
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
      userAvatar: users.avatar,
      userPresence: users.presence,
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

export async function getTemplatePlans() {
  const db = await getDb();
  if (!db) return memPlans.filter(p => (p as any).isTemplate);
  return await db.select().from(onboardingPlans).where(eq(onboardingPlans.isTemplate, true)).orderBy(desc(onboardingPlans.createdAt));
}

export async function savePlanAsTemplate(planId: number) {
  const plan = await getOnboardingPlanById(planId);
  if (!plan) throw new Error("Plano não encontrado");
  const db = await getDb();
  const { id, createdAt, updatedAt, status, isTemplate, ...planData } = plan as any;
  if (!db) {
    const template = { ...planData, id: _nextId++, title: `${planData.title} (Template)`, status: 'draft' as const, isTemplate: true, templateOriginPlanId: planId, createdAt: new Date(), updatedAt: new Date() };
    memPlans.push(template); saveLocalDb();
    const tasks = memTasks.filter(t => t.planId === planId);
    for (const t of tasks) {
      const { id: tid, planId: tpid, createdAt: tc, updatedAt: tu, status: ts, ...taskData } = t;
      memTasks.push({ ...taskData, id: _nextId++, planId: template.id, status: 'pending' as const, createdAt: new Date(), updatedAt: new Date() });
    }
    saveLocalDb();
    return template;
  }
  const values: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(planData)) {
    if (k !== 'id' && k !== 'createdAt' && k !== 'updatedAt') values[k] = v;
  }
  values.title = `${planData.title} (Template)`;
  values.status = 'draft';
  values.isTemplate = true;
  values.templateOriginPlanId = planId;
  const result = await db.insert(onboardingPlans).values(values as any);
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  const tasks = await getTasksByPlanId(planId);
  for (const t of tasks) {
    const { id: tid, planId: tpid, createdAt: tc, updatedAt: tu, status: ts, ...taskData } = t;
    await db.insert(onboardingTasks).values({ ...taskData, planId: insertId, status: 'pending' });
  }
  return { id: insertId, ...values, isTemplate: true };
}

export async function createPlanFromTemplate(templateId: number, newTitle: string, createdBy: number) {
  const template = await getOnboardingPlanById(templateId);
  if (!template) throw new Error("Template não encontrado");
  const db = await getDb();
  if (!db) {
    const plan = { id: _nextId++, title: newTitle, description: (template as any).description, createdBy, status: 'draft' as const, isTemplate: false, templateOriginPlanId: null, startDate: (template as any).startDate, endDate: (template as any).endDate, createdAt: new Date(), updatedAt: new Date() };
    memPlans.push(plan); saveLocalDb();
    const tasks = memTasks.filter(t => t.planId === templateId);
    for (const t of tasks) {
      const { id: tid, planId: tpid, createdAt: tc, updatedAt: tu, status: ts, ...taskData } = t;
      memTasks.push({ ...taskData, id: _nextId++, planId: plan.id, status: 'pending' as const, createdAt: new Date(), updatedAt: new Date() });
    }
    saveLocalDb();
    return plan;
  }
  const values: Record<string, unknown> = { title: newTitle, description: (template as any).description, createdBy, status: 'draft', isTemplate: false };
  if ((template as any).startDate) values.startDate = (template as any).startDate;
  if ((template as any).endDate) values.endDate = (template as any).endDate;
  const result = await db.insert(onboardingPlans).values(values as any);
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  const tasks = await getTasksByPlanId(templateId);
  for (const t of tasks) {
    const { id: tid, planId: tpid, createdAt: tc, updatedAt: tu, status: ts, ...taskData } = t;
    await db.insert(onboardingTasks).values({ ...taskData, planId: insertId, status: 'pending' });
  }
  return { id: insertId, ...values };
}

export async function getTeamPanelData(tutorId: number) {
  const db = await getDb();
  const allUsers = await getAllUsers();
  const estagiarios = allUsers.filter((u: any) => u.role === 'estagiario');
  const result = [];
    for (const estag of estagiarios) {
    const plans = await getPlansAssignedToUser(estag.id);
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    const activePlans = (plans as any[]).filter((p: any) => p.status === 'active');
    for (const plan of plans) {
      const tasks = await getTasksByPlanId((plan as any).id);
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t: any) => t.status === 'completed').length;
      overdueTasks += tasks.filter((t: any) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    }
    const todayCheckin = await getTodayCheckin(estag.id);
    const lastCheckins = await getDailyCheckinsByUserId(estag.id, 5);
    const latestCheckin = lastCheckins.length > 0 ? lastCheckins[0] : null;
    result.push({
      id: estag.id,
      name: estag.name,
      email: estag.email,
      avatar: (estag as any).avatar,
      department: (estag as any).department,
      position: (estag as any).position,
      presence: (estag as any).presence,
      totalTasks,
      completedTasks,
      overdueTasks,
      activePlans: activePlans.length,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      todayCheckin: todayCheckin ?? null,
      latestCheckin: latestCheckin ?? null,
    });
  }
  return result;
}

export async function deleteOnboardingPlan(id: number) {
  const db = await getDb();
  if (!db) {
    const idx = memPlans.findIndex(p => p.id === id);
    if (idx >= 0) { memPlans.splice(idx, 1); saveLocalDb(); }
    for (let i = memAssignments.length - 1; i >= 0; i--) {
      if (memAssignments[i].planId === id) memAssignments.splice(i, 1);
    }
    for (let i = memTasks.length - 1; i >= 0; i--) {
      if (memTasks[i].planId === id) memTasks.splice(i, 1);
    }
    return;
  }
  await db.delete(planAssignments).where(eq(planAssignments.planId, id));
  await db.delete(onboardingTasks).where(eq(onboardingTasks.planId, id));
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
  if (!dbConn) {
    return _memMessages
      .filter(m => (m.senderId === userA && m.receiverId === userB) || (m.senderId === userB && m.receiverId === userA))
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return await dbConn
    .select()
    .from(directMessages)
    .where(
      or(
        and(eq(directMessages.senderId, userA), eq(directMessages.receiverId, userB)),
        and(eq(directMessages.senderId, userB), eq(directMessages.receiverId, userA))
      )
    )
    .orderBy(directMessages.createdAt);
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
  await dbConn.insert(directMessages).values({
    senderId: data.senderId,
    senderName: data.senderName,
    receiverId: data.receiverId,
    text: data.text,
    fileName: data.fileName ?? null,
    fileUrl: data.fileUrl ?? null,
    fileSize: data.fileSize ?? null,
    fileType: data.fileType ?? null,
  });
  const rows = await dbConn
    .select()
    .from(directMessages)
    .where(eq(directMessages.senderId, data.senderId))
    .orderBy(desc(directMessages.id))
    .limit(1);
  return rows[0];
}

export async function markMessagesAsRead(receiverId: number, senderId: number) {
  const dbConn = await getDb();
  if (!dbConn) {
    _memMessages.forEach(m => { if (m.senderId === senderId && m.receiverId === receiverId) m.isRead = true; });
    return;
  }
  await dbConn
    .update(directMessages)
    .set({ isRead: true })
    .where(and(eq(directMessages.senderId, senderId), eq(directMessages.receiverId, receiverId), eq(directMessages.isRead, false)));
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
  const rows = await dbConn
    .select({ senderId: directMessages.senderId, cnt: sql<number>`COUNT(*)` })
    .from(directMessages)
    .where(and(eq(directMessages.receiverId, userId), eq(directMessages.isRead, false)))
    .groupBy(directMessages.senderId);
  const result: Record<number, number> = {};
  rows.forEach(r => { result[Number(r.senderId)] = Number(r.cnt); });
  return result;
}

export async function deleteAttachment(id: number) {
  const dbConn = await getDb();
  if (!dbConn) { _memAttachments = _memAttachments.filter(a => a.id !== id); return; }
  await dbConn.delete(taskAttachments).where(eq(taskAttachments.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: { userId: number; title: string; message: string; type?: string; link?: string }) {
  const dbConn = await getDb();
    const notif = { id: _notificationNextId++, ...data, type: (data.type ?? 'system') as any, isRead: false, createdAt: new Date() };
  if (!dbConn) {
    _memNotifications.unshift(notif);
    saveLocalDb();
    return notif;
  }
  await dbConn.insert(notifications).values(notif);
  return notif;
}

export async function getNotificationsByUserId(userId: number, limit = 20) {
  const dbConn = await getDb();
  if (!dbConn) return _memNotifications.filter((n: any) => n.userId === userId).slice(0, limit);
  return await dbConn.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationAsRead(id: number) {
  const dbConn = await getDb();
  if (!dbConn) {
    const n = _memNotifications.find((n: any) => n.id === id);
    if (n) n.isRead = true;
    saveLocalDb();
    return;
  }
  await dbConn.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const dbConn = await getDb();
  if (!dbConn) {
    _memNotifications.forEach((n: any) => { if (n.userId === userId) n.isRead = true; });
    saveLocalDb();
    return;
  }
  await dbConn.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadNotificationCount(userId: number) {
  const dbConn = await getDb();
  if (!dbConn) return _memNotifications.filter((n: any) => n.userId === userId && !n.isRead).length;
  const rows = await dbConn.select({ cnt: sql<number>`COUNT(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(rows[0]?.cnt ?? 0);
}

// ─── Daily Check-ins ──────────────────────────────────────────────────────────

export async function createDailyCheckin(data: { userId: number; date: Date; mood: string; note?: string }) {
  const dbConn = await getDb();
    const checkin = { id: _checkinNextId++, ...data, mood: data.mood as any, createdAt: new Date() };
  if (!dbConn) {
    _memDailyCheckins.push(checkin);
    saveLocalDb();
    return checkin;
  }
  await dbConn.insert(dailyCheckins).values(checkin);
  return checkin;
}

export async function getDailyCheckinsByUserId(userId: number, limit = 30) {
  const dbConn = await getDb();
  if (!dbConn) return _memDailyCheckins.filter((c: any) => c.userId === userId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  return await dbConn.select().from(dailyCheckins).where(eq(dailyCheckins.userId, userId)).orderBy(desc(dailyCheckins.date)).limit(limit);
}

export async function getTodayCheckin(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dbConn = await getDb();
  if (!dbConn) return _memDailyCheckins.find((c: any) => c.userId === userId && new Date(c.date) >= today && new Date(c.date) < tomorrow);
  const rows = await dbConn.select().from(dailyCheckins).where(and(eq(dailyCheckins.userId, userId), sql`${dailyCheckins.date} >= ${today}`, sql`${dailyCheckins.date} < ${tomorrow}`)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

export async function getUserStreak(userId: number) {
  const checkins = await getDailyCheckinsByUserId(userId, 365);
  if (checkins.length === 0) return { currentStreak: 0, longestStreak: 0 };
  const dates = checkins.map((c: any) => {
    const d = new Date(c.date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const uniqueDates = [...new Set(dates)].sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i-1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) currentStreak++;
      else break;
    }
  }
  let run = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i]);
    if (i === 0) { run = 1; continue; }
    const prev = new Date(uniqueDates[i-1]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) run++;
    else { longestStreak = Math.max(longestStreak, run); run = 1; }
  }
  longestStreak = Math.max(longestStreak, run);
  return { currentStreak, longestStreak };
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function getUserBadges(userId: number) {
  return _memUserBadges.filter((b: any) => b.userId === userId);
}

export async function awardBadge(data: { userId: number; badge: string; label: string; description?: string; icon?: string }) {
  const exists = _memUserBadges.find((b: any) => b.userId === data.userId && b.badge === data.badge);
  if (exists) return exists;
  const badge = { id: _badgeNextId++, ...data, awardedAt: new Date() };
  _memUserBadges.push(badge);
  saveLocalDb();
  return badge;
}

// ─── AI Usage / Quota ──────────────────────────────────────────────────────────

const AI_DAILY_LIMITS: Record<string, number> = {
  estagiario: 20,
  tutor: 100,
  admin: -1,
};

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function getAiUsageToday(userId: number): Promise<number> {
  const dbConn = await getDb();
  const todayStr = getTodayDateString();
  if (!dbConn) {
    const usage = _memAiUsage.find((u: any) => u.userId === userId && u.date === todayStr);
    return usage?.count ?? 0;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const rows = await dbConn
    .select({ cnt: sql<number>`COALESCE(SUM(\`count\`),0)` })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), sql`${aiUsage.date} >= ${today}`, sql`${aiUsage.date} < ${tomorrow}`));
  return Number(rows[0]?.cnt ?? 0);
}

export async function incrementAiUsage(userId: number): Promise<void> {
  const dbConn = await getDb();
  const todayStr = getTodayDateString();
  if (!dbConn) {
    const existing = _memAiUsage.find((u: any) => u.userId === userId && u.date === todayStr);
    if (existing) {
      existing.count++;
    } else {
      _memAiUsage.push({ id: _aiUsageNextId++, userId, date: todayStr, count: 1, createdAt: new Date() });
    }
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await dbConn
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), sql`${aiUsage.date} >= ${today}`))
    .limit(1);
  if (existing.length > 0) {
    await dbConn.update(aiUsage).set({ count: sql`\`count\` + 1` }).where(eq(aiUsage.id, existing[0].id));
  } else {
    await dbConn.insert(aiUsage).values({ userId, date: today, count: 1 });
  }
}

export async function getAiQuota(userId: number, role: string) {
  const limit = AI_DAILY_LIMITS[role] ?? AI_DAILY_LIMITS.estagiario;
  const used = await getAiUsageToday(userId);
  const today = new Date();
  const resetDate = new Date(today);
  resetDate.setDate(resetDate.getDate() + 1);
  resetDate.setHours(0, 0, 0, 0);
  return {
    limit,
    used,
    remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    resetDate,
    isUnlimited: limit === -1,
  };
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export async function hasCompletedAllPlans(userId: number) {
  const assignments = await getPlanAssignmentsByUserId(userId);
  if (assignments.length === 0) return false;
  return assignments.every((a: any) => a.status === 'completed');
}
