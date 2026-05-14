import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// ── Role-based procedures ──────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

/** Tutores e admins */
const tutorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "tutor") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a tutores e administradores" });
  }
  return next({ ctx });
});

const roleSchema = z.enum(["estagiario", "tutor", "admin"]);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  users: router({
    list: tutorProcedure.query(async () => await db.getAllUsers()),
    getById: tutorProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => await db.getUserById(input.id)),

    create: adminProcedure.input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("Email inválido"),
      username: z.string().min(3, "Username deve ter pelo menos 3 caracteres")
        .regex(/^[a-z0-9._-]+$/, "Username só pode conter letras minúsculas, números, pontos, hífens e underscores"),
      password: z.string().min(4, "Password deve ter pelo menos 4 caracteres"),
      role: roleSchema.default("estagiario"),
      department: z.string().optional(),
      position: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Check if username is already taken
      const existing = await db.getUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Username já existe" });
      }
      const openId = `local-dyn-${input.username}`;
      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        department: input.department,
        position: input.position,
        role: input.role,
        isActive: true,
        passwordHash: input.password, // plain text for local dev
        loginMethod: "local",
      });
      const newUser = await db.getUserByUsername(input.username);
      db.addActivityLog({
        userId: newUser?.id ?? 0,
        userName: input.name,
        action: "user_created",
        description: `Utilizador "${input.name}" (${input.username}) foi criado com o papel de ${input.role}`,
        entityType: "user",
        entityId: newUser?.id ?? null,
      });
      return { success: true };
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: roleSchema.optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      password: z.string().min(4).optional(),
    })).mutation(async ({ input }) => {
      const { id, password, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (password) updateData.passwordHash = password;
      await db.updateUser(id, updateData as any);
      return { success: true };
    }),

    deactivate: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deactivateUser(input.id);
      return { success: true };
    }),

    // FIX: was "delete" but router only had "deactivate" — now both exist
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deactivateUser(input.id);
      return { success: true };
    }),
  }),

  plans: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Estagiários only see plans assigned to them
      if (ctx.user.role === "estagiario") {
        return await db.getPlansAssignedToUser(ctx.user.id);
      }
      return await db.getAllOnboardingPlans();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const plan = await db.getOnboardingPlanById(input.id);
      // Estagiários can only view plans assigned to them
      if (ctx.user.role === "estagiario") {
        const assignedPlans = await db.getPlansAssignedToUser(ctx.user.id);
        if (!assignedPlans.some((p: any) => p.id === input.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a este plano" });
        }
      }
      const tasks = await db.getTasksByPlanId(input.id);
      return { ...plan, tasks };
    }),
    create: tutorProcedure.input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      assignedToUserId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { assignedToUserId, ...planData } = input;
      const plan = await db.createOnboardingPlan({ ...planData, createdBy: ctx.user.id });
      // If a user was specified, immediately create an assignment
      if (assignedToUserId) {
        await db.assignPlanToUser({
          planId: plan.id,
          userId: assignedToUserId,
          assignedBy: ctx.user.id,
          startDate: new Date(),
        });
        const assignedUser = await db.getUserById(assignedToUserId);
        db.addActivityLog({
          userId: ctx.user.id,
          userName: (ctx.user as any).name ?? ctx.user.openId,
          action: "plan_assigned",
          description: `Plano "${input.title}" foi atribuído a ${assignedUser?.name ?? "utilizador"}`,
          entityType: "plan",
          entityId: plan.id,
        });
      } else {
        db.addActivityLog({
          userId: ctx.user.id,
          userName: (ctx.user as any).name ?? ctx.user.openId,
          action: "plan_created",
          description: `Plano "${input.title}" foi criado`,
          entityType: "plan",
          entityId: plan.id,
        });
      }
      return { success: true };
    }),
    update: tutorProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "active", "completed", "archived"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await db.updateOnboardingPlan(id, updateData);
      // If plan became active, check if it has no tasks and auto-complete
      if (input.status === 'active') {
        await db.checkAndAutoCompletePlan(id);
      }
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteOnboardingPlan(input.id);
      return { success: true };
    }),
  }),

  tasks: router({
    listAll: protectedProcedure.query(async () => await db.getAllTasks()),
    getByPlanId: protectedProcedure.input(z.object({ planId: z.number() })).query(async ({ input }) => await db.getTasksByPlanId(input.planId)),
    create: tutorProcedure.input(z.object({
      planId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      order: z.number(),
      dueDate: z.date().optional(),
      assignedTo: z.number().optional(),
    })).mutation(async ({ input }) => {
      await db.createOnboardingTask(input);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      assignedTo: z.number().optional(),
      dueDate: z.date().optional(),
    })).mutation(async ({ input, ctx }) => {
      // Estagiários can only toggle status to "completed"
      if (ctx.user.role === "estagiario") {
        const allowed = Object.keys(input).filter(k => k !== "id");
        if (allowed.some(k => k !== "status") || (input.status && input.status !== "completed" && input.status !== "pending")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Estagiários só podem marcar tarefas como concluídas" });
        }
      }
      const { id, ...updateData } = input;
      await db.updateOnboardingTask(id, updateData);
      // Auto-complete plan if all tasks are done
      if (input.status) {
        const task = await db.getTaskById(id);
        if (task) await db.checkAndAutoCompletePlan((task as any).planId);
      }
      if (input.status) {
        const statusLabels: Record<string, string> = { pending: "Pendente", in_progress: "Em Progresso", completed: "Concluída" };
        db.addActivityLog({
          userId: ctx.user.id,
          userName: (ctx.user as any).name ?? ctx.user.openId,
          action: "task_status_changed",
          description: `Tarefa #${id} marcada como "${statusLabels[input.status] ?? input.status}"`,
          entityType: "task",
          entityId: id,
        });
      }
      return { success: true };
    }),
    delete: tutorProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteOnboardingTask(input.id);
      return { success: true };
    }),
  }),

  assignments: router({
    getByUserId: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input, ctx }) => {
      const isPrivileged = ctx.user.role === "admin" || ctx.user.role === "tutor";
      if (!isPrivileged && ctx.user.id !== input.userId) throw new TRPCError({ code: "FORBIDDEN" });
      return await db.getPlanAssignmentsByUserId(input.userId);
    }),
    getByPlanId: tutorProcedure.input(z.object({ planId: z.number() })).query(async ({ input }) => await db.getPlanAssignmentsByPlanId(input.planId)),
    assign: tutorProcedure.input(z.object({
      planId: z.number(),
      userId: z.number(),
      startDate: z.date(),
      expectedEndDate: z.date().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.assignPlanToUser({ ...input, assignedBy: ctx.user.id });
      return { success: true };
    }),
    updateProgress: protectedProcedure.input(z.object({
      id: z.number(),
      progress: z.number().min(0).max(100),
      status: z.enum(["active", "completed", "paused", "cancelled"]).optional(),
    })).mutation(async ({ input, ctx }) => {
      const assignment = await db.getPlanAssignmentsByUserId(ctx.user.id);
      const isPrivileged = ctx.user.role === "admin" || ctx.user.role === "tutor";
      const hasAccess = assignment.some(a => a.id === input.id) || isPrivileged;
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...updateData } = input;
      await db.updatePlanAssignment(id, updateData);
      return { success: true };
    }),
  }),

  taskCompletions: router({
    getByUserId: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input, ctx }) => {
      const isPrivileged = ctx.user.role === "admin" || ctx.user.role === "tutor";
      if (!isPrivileged && ctx.user.id !== input.userId) throw new TRPCError({ code: "FORBIDDEN" });
      return await db.getTaskCompletionsByUserId(input.userId);
    }),
    create: protectedProcedure.input(z.object({
      taskId: z.number(),
      userId: z.number(),
      status: z.enum(["pending", "in_progress", "completed"]),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const isPrivileged = ctx.user.role === "admin" || ctx.user.role === "tutor";
      if (!isPrivileged && ctx.user.id !== input.userId) throw new TRPCError({ code: "FORBIDDEN" });
      await db.createTaskCompletion(input);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      notes: z.string().optional(),
      completedAt: z.date().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await db.updateTaskCompletion(id, updateData);
      return { success: true };
    }),
  }),

  dashboard: router({
    metrics: tutorProcedure.query(async () => await db.getDashboardMetrics()),
    activityLog: tutorProcedure.input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional()).query(async ({ input }) => {
      return db.getActivityLog(input?.limit ?? 50);
    }),
    myProgress: protectedProcedure.query(async ({ ctx }) => {
      const assignments = await db.getPlanAssignmentsByUserId(ctx.user.id);
      const myPlans = await db.getPlansAssignedToUser(ctx.user.id);
      let totalTasks = 0;
      let completedTasks = 0;
      for (const plan of myPlans) {
        const tasks = await db.getTasksByPlanId((plan as any).id);
        totalTasks += tasks.length;
        completedTasks += tasks.filter((t: any) => t.status === "completed").length;
      }
      return {
        assignedPlans: myPlans.length,
        activePlans: assignments.filter((a: any) => a.status === "active").length,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
