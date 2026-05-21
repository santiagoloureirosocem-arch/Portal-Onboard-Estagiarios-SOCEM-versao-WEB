import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["estagiario", "tutor", "admin"]).default("estagiario").notNull(),
  /** Hashed password for local login. bcryptjs hash or plain for dev. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  // Additional fields for onboarding system
  department: varchar("department", { length: 255 }),
  position: varchar("position", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Onboarding plans table - defines the integration plan structure
 */
export const onboardingPlans = mysqlTable("onboarding_plans", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("draft").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingPlan = typeof onboardingPlans.$inferSelect;
export type InsertOnboardingPlan = typeof onboardingPlans.$inferInsert;

/**
 * Tasks/stages within an onboarding plan
 */
export const onboardingTasks = mysqlTable("onboarding_tasks", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").notNull(),
  dueDate: datetime("dueDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  assignedTo: int("assignedTo"), // User ID of person responsible
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = typeof onboardingTasks.$inferInsert;

/**
 * Assignments - links plans to interns/users
 */
export const planAssignments = mysqlTable("plan_assignments", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  userId: int("userId").notNull(),
  assignedBy: int("assignedBy").notNull(), // Admin who assigned
  startDate: datetime("startDate").notNull(),
  expectedEndDate: datetime("expectedEndDate"),
  status: mysqlEnum("status", ["active", "completed", "paused", "cancelled"]).default("active").notNull(),
  progress: int("progress").default(0).notNull(), // Percentage 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanAssignment = typeof planAssignments.$inferSelect;
export type InsertPlanAssignment = typeof planAssignments.$inferInsert;

/**
 * Task completion tracking for each user
 */
export const taskCompletions = mysqlTable("task_completions", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  userId: int("userId").notNull(),
  completedAt: datetime("completedAt"),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = typeof taskCompletions.$inferInsert;
