import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";


// ── Default avatar for new users ─────────────────────────────────────────────
const DEFAULT_AVATAR = "data:image/png;base64,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";

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
    updateTheme: protectedProcedure
      .input(z.object({ darkMode: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, { darkMode: input.darkMode } as any);
        return { success: true };
      }),
    updateAvatar: protectedProcedure
      .input(z.object({ avatar: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, { avatar: input.avatar } as any);
        return { success: true };
      }),
    updatePresence: protectedProcedure
      .input(z.object({ presence: z.enum(["online", "ausente", "offline"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.updatePresence(ctx.user.id, input.presence);
        return { success: true };
      }),
  }),

  users: router({
    list: tutorProcedure.query(async () => await db.getAllUsers()),
    listForMessaging: protectedProcedure.query(async ({ ctx }) => {
      // All authenticated users can see others for messaging (estagiários need to reach tutors)
      const all = await db.getAllUsers();
      return all.filter((u: any) => u.id !== ctx.user.id);
    }),
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
      avatar: z.string().optional(),
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
        avatar: input.avatar ?? DEFAULT_AVATAR,
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

    updateUserAvatar: adminProcedure.input(z.object({
      id: z.number(),
      avatar: z.string(),
    })).mutation(async ({ input }) => {
      await db.updateUser(input.id, { avatar: input.avatar } as any);
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

    // Allow any logged-in user to update their own profile (name, email, avatar)
    // Admins can also change role of any user via the regular update endpoint
    updateSelf: protectedProcedure.input(z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, input as any);
      return { success: true };
    }),

    changePassword: protectedProcedure.input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "A password deve ter pelo menos 6 caracteres"),
    })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Utilizador não encontrado" });
      if (user.passwordHash !== input.currentPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Password atual incorreta" });
      }
      await db.updateUser(ctx.user.id, { passwordHash: input.newPassword } as any);
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
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { assignedToUserId, startDate, endDate, ...planData } = input;
      const plan = await db.createOnboardingPlan({ ...planData, createdBy: ctx.user.id, startDate, endDate });
      // If a user was specified, immediately create an assignment
      if (assignedToUserId) {
        await db.assignPlanToUser({
          planId: plan.id,
          userId: assignedToUserId,
          assignedBy: ctx.user.id,
          startDate: startDate ?? new Date(),
          expectedEndDate: endDate,
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
      startDate: z.date().optional(),
      endDate: z.date().optional(),
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
    listAll: protectedProcedure.query(async ({ ctx }) => {
      // Estagiários only see tasks from their assigned plans
      if (ctx.user.role === 'estagiario') {
        const assignedPlans = await db.getPlansAssignedToUser(ctx.user.id);
        if (assignedPlans.length === 0) return [];
        const planIds = assignedPlans.map((p: any) => p.id);
        const allTasks = await db.getAllTasks();
        return allTasks.filter((t: any) => planIds.includes(t.planId));
      }
      return await db.getAllTasks();
    }),
    getByPlanId: protectedProcedure.input(z.object({ planId: z.number() })).query(async ({ input }) => await db.getTasksByPlanId(input.planId)),
    create: tutorProcedure.input(z.object({
      planId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      order: z.number(),
      startDate: z.date().optional(),
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
      startDate: z.date().optional(),
      dueDate: z.date().optional(),
      order: z.number().optional(),
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

  taskComments: router({
    getByTaskId: protectedProcedure.input(z.object({ taskId: z.number() })).query(async ({ input }) => {
      return await db.getCommentsByTaskId(input.taskId);
    }),
    create: protectedProcedure.input(z.object({
      taskId: z.number(),
      text: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      return await db.createComment({
        taskId: input.taskId,
        userId: ctx.user.id,
        userName: (ctx.user as any).name ?? ctx.user.openId,
        text: input.text,
      });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteComment(input.id);
      return { success: true };
    }),
  }),

  taskAttachments: router({
    getByTaskId: protectedProcedure.input(z.object({ taskId: z.number() })).query(async ({ input }) => {
      return await db.getAttachmentsByTaskId(input.taskId);
    }),
    create: protectedProcedure.input(z.object({
      taskId: z.number(),
      fileName: z.string(),
      fileUrl: z.string(),
      fileSize: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      return await db.createAttachment({
        taskId: input.taskId,
        userId: ctx.user.id,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
      });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAttachment(input.id);
      return { success: true };
    }),
  }),

  messages: router({
    getConversation: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ input, ctx }) => {
        const msgs = await db.getDirectMessages(ctx.user.id, input.otherUserId);
        await db.markMessagesAsRead(ctx.user.id, input.otherUserId);
        return msgs;
      }),

    send: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        text: z.string().default(""),
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        fileSize: z.string().optional(),
        fileType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const senderName = (ctx.user as any).name ?? ctx.user.openId;
        return await db.createDirectMessage({
          senderId: ctx.user.id,
          senderName,
          receiverId: input.receiverId,
          text: input.text,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          fileType: input.fileType,
        });
      }),

    unreadCounts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadCounts(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
