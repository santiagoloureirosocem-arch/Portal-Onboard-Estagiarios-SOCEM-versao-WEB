import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as db from "./db";
import { invokeLLM, type Message, type Tool } from "./_core/llm";
import { sendEmail } from "./_core/email";
import { ENV } from "./_core/env";


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
    emailPreferences: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserEmailPreferences(ctx.user.id);
    }),
    updateEmailPreferences: protectedProcedure
      .input(z.object({
        emailTaskDeadline: z.boolean().optional(),
        emailTaskOverdue: z.boolean().optional(),
        emailNewMessage: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateEmailPreferences(ctx.user.id, input);
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
      return await db.getUsersWithLastMessage(ctx.user.id);
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
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        department: input.department,
        position: input.position,
        role: input.role,
        isActive: true,
        passwordHash: hashedPassword,
        loginMethod: "local",
        avatar: input.avatar ?? DEFAULT_AVATAR,
      });
      const newUser = await db.getUserByUsername(input.username);
      await db.addActivityLog({
        userId: newUser?.id ?? 0,
        userName: input.name,
        action: "user_created",
        description: `Utilizador "${input.name}" (${input.username}) foi criado com o papel de ${input.role}`,
        entityType: "user",
        entityId: newUser?.id ?? null,
      });
      // Send email notification for new interns
      let emailSent = false;
      if (input.role === "estagiario") {
        const appUrl = process.env.APP_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined) ?? process.env.ORIGIN ?? "http://localhost:3000";
        const result = await sendEmail({
          to: "informatica@socem.pt",
          toName: "Informática SOCEM",
          subject: `Novo Estagiário Registado — ${input.name}`,
          heading: "Novo Estagiário Registado",
          bodyHtml: `<p>Foi criado um novo estagiário no Portal SOCEM:</p>
<div style="background:#fdf2f2;border:1px solid #f5c6c6;border-radius:10px;padding:20px 24px;margin:20px 0;">
  <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a1a;">${input.name}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <tr><td style="padding:10px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Email</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${input.email}</td></tr>
  <tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Username</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${input.username}</td></tr>
  ${input.department ? `<tr><td style="padding:10px 16px;font-size:13px;color:#777;border-bottom:1px solid #f5f5f5;">Departamento</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${input.department}</td></tr>` : ""}
  ${input.position ? `<tr style="background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#777;">Cargo</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1a1a;">${input.position}</td></tr>` : ""}
</table>
<p style="margin-top:20px;"><a href="${appUrl}/dashboard" style="background:#c0392b;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Aceder ao Portal</a></p>`,
        }).catch(() => ({ ok: false }));
        emailSent = result?.ok ?? false;
      }
      return { success: true, emailSent };
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
      if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
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
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash ?? "");
      if (!valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Password atual incorreta" });
      }
      const hashedNew = await bcrypt.hash(input.newPassword, 12);
      await db.updateUser(ctx.user.id, { passwordHash: hashedNew } as any);
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
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: (ctx.user as any).name ?? ctx.user.openId,
          action: "plan_assigned",
          description: `Plano "${input.title}" foi atribuído a ${assignedUser?.name ?? "utilizador"}`,
          entityType: "plan",
          entityId: plan.id,
        });
      } else {
        await db.addActivityLog({
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

    saveTemplate: tutorProcedure.input(z.object({ planId: z.number() })).mutation(async ({ input }) => {
      await db.savePlanAsTemplate(input.planId);
      return { success: true };
    }),

    listTemplates: tutorProcedure.query(async () => {
      return await db.getTemplatePlans();
    }),

    createFromTemplate: tutorProcedure.input(z.object({
      templateId: z.number(),
      title: z.string().min(1),
      assignedToUserId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const plan = await db.createPlanFromTemplate(input.templateId, input.title, ctx.user.id);
      if (input.assignedToUserId) {
        await db.assignPlanToUser({
          planId: (plan as any).id,
          userId: input.assignedToUserId,
          assignedBy: ctx.user.id,
          startDate: new Date(),
        });
      }
      return { success: true };
    }),
  }),

  teamPanel: router({
    list: tutorProcedure.query(async ({ ctx }) => {
      return await db.getTeamPanelData(ctx.user.id);
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
      // Estagiários podem atualizar o status e a ordem das tarefas
      if (ctx.user.role === "estagiario") {
        const allowed = Object.keys(input).filter(k => k !== "id");
        if (allowed.some(k => k !== "status" && k !== "order") || (input.status && !["pending", "in_progress", "completed"].includes(input.status))) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Estagiários só podem alterar o estado e a ordem das tarefas" });
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
        await db.addActivityLog({
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
      return await db.getActivityLog(input?.limit ?? 50);
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
    myStreak: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStreak(ctx.user.id);
    }),
    myBadges: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserBadges(ctx.user.id);
    }),
    certificateStatus: protectedProcedure.query(async ({ ctx }) => {
      const allCompleted = await db.hasCompletedAllPlans(ctx.user.id);
      const assignments = await db.getPlanAssignmentsByUserId(ctx.user.id);
      const active = assignments.filter((a: any) =>
        (a.status === 'active' || a.status === 'completed') && a.planTitle
      );
      const totalPlans = active.length;
      const completedPlans = active.filter((a: any) => a.status === 'completed').length;
      return { eligible: totalPlans > 0 && allCompleted, totalPlans, completedPlans };
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
        const msg = await db.createDirectMessage({
          senderId: ctx.user.id,
          senderName,
          receiverId: input.receiverId,
          text: input.text,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          fileType: input.fileType,
        });
        // In-app notification + email to receiver
        try {
          const receiver = await db.getUserById(input.receiverId);
          if (receiver) {
            await db.createNotification({
              userId: input.receiverId,
              title: `Nova mensagem de ${senderName}`,
              message: input.text ? input.text.slice(0, 200) : (input.fileName ? `Enviou um ficheiro: ${input.fileName}` : "Nova mensagem"),
              type: "message",
              link: "/mensagens",
            });
            if (receiver.email) {
              const prefs = await db.getUserEmailPreferences(input.receiverId);
              if (prefs.emailNewMessage) {
                const appUrl = process.env.APP_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined) ?? process.env.ORIGIN ?? "http://localhost:3000";
                await sendEmail({
                  to: receiver.email,
                  toName: receiver.name ?? undefined,
                  subject: `Nova mensagem de ${senderName}`,
                  heading: `Nova Mensagem no Portal SOCEM`,
                  bodyHtml: `<p>Olá <strong>${receiver.name ?? "utilizador"}</strong>,</p>
<p>Recebeste uma nova mensagem de <strong>${senderName}</strong> no Portal de Onboarding.</p>
${input.text ? `<div style="background:#f5f5f5;border-left:4px solid #c0392b;padding:16px;margin:16px 0;border-radius:6px;"><p style="margin:0;font-size:14px;color:#333;">${input.text}</p></div>` : ""}
${input.fileName ? `<p style="font-size:13px;color:#666;">📎 Ficheiro anexado: ${input.fileName}</p>` : ""}
<p style="margin-top:20px;"><a href="${appUrl}/mensagens" style="background:#c0392b;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Ver Mensagens</a></p>`,
                });
              }
            }
          }
        } catch {}
        return msg;
      }),

    unreadCounts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadCounts(ctx.user.id);
    }),
  }),

  notifications: router({
    list: protectedProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ input, ctx }) => {
      return await db.getNotificationsByUserId(ctx.user.id, input.limit);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),
    unreadBroadcasts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadSystemNotifications(ctx.user.id);
    }),
    markAsRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.id);
      return { success: true };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  dailyCheckins: router({
    today: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTodayCheckin(ctx.user.id);
    }),
    history: protectedProcedure.input(z.object({ limit: z.number().default(30) })).query(async ({ input, ctx }) => {
      return await db.getDailyCheckinsByUserId(ctx.user.id, input.limit);
    }),
    create: protectedProcedure.input(z.object({
      mood: z.enum(["great", "good", "okay", "bad", "terrible"]),
      note: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const existing = await db.getTodayCheckin(ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Já fizeste o check-in hoje" });
      }
      const checkin = await db.createDailyCheckin({
        userId: ctx.user.id,
        date: new Date(),
        mood: input.mood,
        note: input.note,
      });
      // Check streak for badge award
      const streak = await db.getUserStreak(ctx.user.id);
      if (streak.currentStreak === 7) {
        await db.awardBadge({ userId: ctx.user.id, badge: "streak_7", label: "7 Dias Seguidos", description: "Fizeste check-in 7 dias seguidos!" });
        await db.createNotification({ userId: ctx.user.id, title: "Distintivo Desbloqueado! 🏅", message: "Ganhaste o distintivo '7 Dias Seguidos' por fazeres check-in 7 dias consecutivos!", type: "badge", link: "/dashboard" });
      }
      if (streak.currentStreak === 30) {
        await db.awardBadge({ userId: ctx.user.id, badge: "streak_30", label: "30 Dias Seguidos", description: "Fizeste check-in 30 dias seguidos!" });
        await db.createNotification({ userId: ctx.user.id, title: "Distintivo Desbloqueado! 🏅", message: "Ganhaste o distintivo '30 Dias Seguidos' por fazeres check-in 30 dias consecutivos!", type: "badge", link: "/dashboard" });
      }
      return checkin;
    }),
  }),

  ai: router({
    quota: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAiQuota(ctx.user.id, ctx.user.role);
    }),

    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check quota before processing
        const quota = await db.getAiQuota(ctx.user.id, ctx.user.role);
        if (!quota.isUnlimited && quota.remaining <= 0) {
          return {
            content: `O **Norte** 🧭 atingiu o limite diário de ${quota.limit} mensagens para o teu perfil. O limite é reposto à meia-noite.\n\nSe precisares de ajuda urgente, consulta a página de **Ajuda** (/help) ou contacta o teu tutor.`,
            quota,
          };
        }

        const todayDate = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        const SYSTEM_PROMPT = `Tu és o **Norte**, o assistente virtual especializado no **Portal de Estagiários SOCEM**, uma aplicação web para gestão do onboarding de estagiários.

Hoje é **${todayDate}**. Quando falares de "hoje" ou "esta semana", usa esta data como referência.

## Visão Geral da Aplicação
O Portal de Estagiários SOCEM é uma plataforma completa para gerir o processo de integração de novos estagiários. Permite criar planos de onboarding, atribuí-los a estagiários, acompanhar tarefas e gerar relatórios de progresso.

## Funcionalidades por Página

### Dashboard (/dashboard)
- Visão geral com métricas: estagiários ativos, planos em curso, tarefas pendentes, taxa de conclusão
- Para estagiários: mostra "O que fazer hoje", tarefas em atraso, próximas tarefas, planos atribuídos
- Para admins/tutores: planos recentes, utilizadores, progresso geral

### Utilizadores (/users) — apenas admin/tutor
- Listar, criar, editar e desativar utilizadores
- Funções: **admin** (acesso total), **tutor** (cria planos, gere tarefas), **estagiario** (vê apenas o seu plano)
- Campos: nome, email, username, password, função, departamento, cargo

### Planos (/plans)
- Planos de integração com título, descrição, status (draft/active/completed/archived)
- Cada plano contém tarefas com prazos
- Estagiários veem apenas os planos que lhes foram atribuídos
- Tutores e admins podem criar, editar e gerir planos
- **Auto-completar**: quando todas as tarefas de um plano ativo são concluídas, o plano passa automaticamente a "completed" e a respetiva atribuição também
- **Reverter**: se uma tarefa concluída voltar a "in_progress" ou "pending", o plano e a atribuição revertem automaticamente para "active"

### Tarefas (/tasks)
- Tarefas com título, descrição, status (pending/in_progress/completed), datas, responsável
- Estagiários podem marcar tarefas: pendente → concluída, em progresso → concluída, concluída → em progresso
- Tutores/admins gerem todas as tarefas
- Reordenação por drag-and-drop disponível na página Tarefas

### Calendário (/calendar)
- Visualização de prazos e datas importantes dos planos e tarefas

### Relatórios (/reports) — apenas admin/tutor
- Taxa de conclusão global, estagiários concluídos, tempo médio de onboarding
- Progresso por departamento, estatísticas mensais

### Mensagens (/mensagens)
- Sistema de mensagens diretas entre utilizadores
- Filtros: por papel (estagiário/tutor/admin) e apenas não-lidas
- Ordenação: mais recentes primeiro
- Suporte para envio de ficheiros

### Perfil (/profile)
- Visualização do perfil do utilizador, planos atribuídos com progresso e datas
- Secção de Conquistas com distintivos, sequência de check-ins e gráfico de humor
- Certificado de Conclusão (disponível quando todos os planos estão concluídos)
- Indicação de "Leiria" na localização

### Check-ins Diários
- Os estagiários podem fazer check-in diário com o seu humor (great/good/okay/bad/terrible)
- Cada check-in consecutivo aumenta a streak
- Distintivos especiais: "7 Dias Seguidos" (streak_7) e "30 Dias Seguidos" (streak_30)
- O humor é mostrado num gráfico de barras no perfil

### Definições (/settings)
- Editar perfil, preferências de notificação, segurança (alterar password)
- Preferências de email: notificações de prazos, tarefas em atraso, novas mensagens

### Ajuda (/help)
- Guia completo de utilização da aplicação

## Papéis de Utilizador
- **Admin**: Acesso total a todas as funcionalidades. Pode gerir utilizadores, planos, tarefas, relatórios.
- **Tutor**: Pode criar e gerir planos e tarefas, ver relatórios, mas não pode gerir utilizadores (apenas ver).
- **Estagiário**: Apenas vê o seu dashboard personalizado, os planos que lhe foram atribuídos, e pode marcar tarefas como concluídas. Tem acesso ao chat com IA (limite diário de mensagens).

## Dicas Úteis
- Use Ctrl+K (ou ⌘K) para abrir a pesquisa global
- A sidebar pode ser redimensionada arrastando a borda direita
- Pode colapsar a sidebar clicando no ícone do menu
- Use o menu do perfil (canto inferior da sidebar) para gerir estado de presença ou terminar sessão

O teu nome é **Norte** (não és um "assistente de IA" genérico — apresentas-te sempre como Norte). Responde SEMPRE em português de Portugal (pt-PT). Sê útil, preciso e amigável.

Tens acesso às seguintes ferramentas para consultar dados reais. USA-AS sempre que precisares de informação atual sobre utilizadores, planos, tarefas ou métricas:
- get_users: lista todos os utilizadores ativos
- get_plans: lista planos de integração (filtro opcional por status)
- get_plan_tasks: obtém tarefas de um plano específico
- get_metrics: métricas do dashboard (contagens globais)
- get_user_by_name: procura um utilizador pelo nome
- get_plan_assignments: quem está atribuído a um plano específico
- get_my_plans: obtém os planos atribuídos ao utilizador que está a falar contigo (não precisas de ID)
- get_my_tasks: obtém as tarefas do utilizador que está a falar contigo (não precisas de ID)
- get_my_progress: obtém o progresso do utilizador que está a falar contigo: número de planos, tarefas totais, concluídas, taxa de conclusão
- get_my_upcoming_tasks: obtém tarefas com prazo futuro do utilizador que está a falar contigo (ordenadas por data limite)
- get_my_notifications: obtém as notificações recentes do utilizador que está a falar contigo`;

        const { messages } = input;

        // Define tools for the LLM
        const tools: Tool[] = [
          {
            type: "function",
            function: {
              name: "get_users",
              description: "Lista todos os utilizadores ativos do sistema com os seus papéis (admin, tutor, estagiario)",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
          {
            type: "function",
            function: {
              name: "get_plans",
              description: "Lista os planos de integração. Opcionalmente filtra por status (draft, active, completed, archived)",
              parameters: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["draft", "active", "completed", "archived"], description: "Filtrar por status do plano" },
                },
                required: [],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "get_plan_tasks",
              description: "Obtém todas as tarefas de um plano de integração específico",
              parameters: {
                type: "object",
                properties: {
                  planId: { type: "number", description: "ID do plano" },
                },
                required: ["planId"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "get_metrics",
              description: "Obtém métricas globais do dashboard: número de estagiários ativos, planos em curso, tarefas pendentes e taxa de conclusão",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
          {
            type: "function",
            function: {
              name: "get_user_by_name",
              description: "Procura um utilizador pelo nome (parcial ou completo)",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Nome do utilizador a procurar" },
                },
                required: ["name"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "get_plan_assignments",
              description: "Obtém lista de utilizadores atribuídos a um plano específico",
              parameters: {
                type: "object",
                properties: {
                  planId: { type: "number", description: "ID do plano" },
                },
                required: ["planId"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "get_my_plans",
              description: "Obtém os planos de integração atribuídos ao utilizador que está a falar. Não precisa de parâmetros — usa automaticamente o utilizador atual.",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
          {
            type: "function",
            function: {
              name: "get_my_tasks",
              description: "Obtém as tarefas do utilizador que está a falar (de todos os planos dele). Não precisa de parâmetros — usa automaticamente o utilizador atual.",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
          {
            type: "function",
            function: {
              name: "get_my_progress",
              description: "Obtém métricas de progresso do utilizador que está a falar: número de planos ativos, tarefas totais, concluídas, e taxa de conclusão. Não precisa de parâmetros.",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
          {
            type: "function",
            function: {
              name: "get_my_upcoming_tasks",
              description: "Obtém as tarefas com prazo futuro do utilizador que está a falar, ordenadas por data limite (mais próximas primeiro). Não precisa de parâmetros.",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
          {
            type: "function",
            function: {
              name: "get_my_notifications",
              description: "Obtém as notificações recentes do utilizador que está a falar (tarefas atribuídas, prazos próximos, etc). Não precisa de parâmetros.",
              parameters: { type: "object", properties: {}, required: [] },
            },
          },
        ];

        // Tool handler: executes the tool and returns a string result
        async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
          try {
            switch (name) {
              case "get_users": {
                const users = await db.getAllUsers();
                return JSON.stringify(users.map((u: any) => ({
                  id: u.id, name: u.name, email: u.email,
                  role: u.role, department: u.department, position: u.position,
                  presence: u.presence,
                })));
              }
              case "get_plans": {
                const allPlans = await db.getAllOnboardingPlans();
                const filtered = args.status
                  ? allPlans.filter((p: any) => p.status === args.status)
                  : allPlans;
                return JSON.stringify(filtered.map((p: any) => ({
                  id: p.id, title: p.title, description: p.description,
                  status: p.status, startDate: p.startDate, endDate: p.endDate,
                  createdBy: p.createdBy,
                })));
              }
              case "get_plan_tasks": {
                const tasks = await db.getTasksByPlanId(args.planId as number);
                return JSON.stringify(tasks);
              }
              case "get_metrics": {
                const metrics = await db.getDashboardMetrics();
                return JSON.stringify(metrics);
              }
              case "get_user_by_name": {
                const allUsers = await db.getAllUsers();
                const query = (args.name as string).toLowerCase();
                const found = allUsers.filter((u: any) =>
                  u.name?.toLowerCase().includes(query)
                );
                return JSON.stringify(found.map((u: any) => ({
                  id: u.id, name: u.name, email: u.email,
                  role: u.role, department: u.department, position: u.position,
                })));
              }
              case "get_plan_assignments": {
                const assignments = await db.getPlanAssignmentsByPlanId(args.planId as number);
                return JSON.stringify(assignments);
              }
              case "get_my_plans": {
                const myPlans = await db.getPlansAssignedToUser(ctx.user.id);
                return JSON.stringify(myPlans.map((p: any) => ({
                  id: p.id, title: p.title, description: p.description,
                  status: p.status, startDate: p.startDate, endDate: p.endDate,
                })));
              }
              case "get_my_tasks": {
                const assignedPlans = await db.getPlansAssignedToUser(ctx.user.id);
                if (assignedPlans.length === 0) return JSON.stringify([]);
                const planIds = assignedPlans.map((p: any) => p.id);
                const allTasks = await db.getAllTasks();
                const myTasks = allTasks.filter((t: any) => planIds.includes(t.planId));
                return JSON.stringify(myTasks);
              }
              case "get_my_progress": {
                const myPlansData = await db.getPlansAssignedToUser(ctx.user.id);
                const myAssignments = await db.getPlanAssignmentsByUserId(ctx.user.id);
                let totalTasks = 0;
                let completedTasks = 0;
                for (const plan of myPlansData) {
                  const tasks = await db.getTasksByPlanId((plan as any).id);
                  totalTasks += tasks.length;
                  completedTasks += tasks.filter((t: any) => t.status === "completed").length;
                }
                return JSON.stringify({
                  assignedPlans: myPlansData.length,
                  activePlans: myAssignments.filter((a: any) => a.status === "active").length,
                  totalTasks,
                  completedTasks,
                  completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                });
              }
              case "get_my_upcoming_tasks": {
                const upPlans = await db.getPlansAssignedToUser(ctx.user.id);
                if (upPlans.length === 0) return JSON.stringify([]);
                const upPlanIds = upPlans.map((p: any) => p.id);
                const upAllTasks = await db.getAllTasks();
                const upMyTasks = upAllTasks.filter((t: any) => upPlanIds.includes(t.planId));
                const now = new Date();
                const upcoming = upMyTasks
                  .filter((t: any) => {
                    if (t.status === "completed") return false;
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    return due >= now;
                  })
                  .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 10);
                return JSON.stringify(upcoming.map((t: any) => ({
                  id: t.id, title: t.title, status: t.status,
                  dueDate: t.dueDate, planId: t.planId,
                })));
              }
              case "get_my_notifications": {
                const notifications = await db.getNotificationsByUserId(ctx.user.id);
                return JSON.stringify((notifications || []).slice(0, 20));
              }
              default:
                return JSON.stringify({ error: `Ferramenta desconhecida: ${name}` });
            }
          } catch (error) {
            return JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao executar ferramenta" });
          }
        }

        // Build initial messages
        const llmMessages: Message[] = [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map(m => ({
            role: m.role as Message["role"],
            content: m.content,
          })),
        ];

        try {
          // Tool call loop (max 10 iterations)
          let finalContent = "";
          for (let iteration = 0; iteration < 10; iteration++) {
            const result = await invokeLLM({ messages: llmMessages, tools });
            const choice = result.choices[0]?.message;
            const toolCalls = choice?.tool_calls;

            if (!toolCalls || toolCalls.length === 0) {
              // No tool calls — this is the final response
              finalContent = typeof choice?.content === "string"
                ? choice.content
                : Array.isArray(choice?.content)
                  ? choice.content.map(c => (typeof c === "string" ? c : c.type === "text" ? c.text : "")).join("")
                  : "Desculpa, ocorreu um erro ao gerar a resposta.";
              break;
            }

            // Add assistant message with tool calls
            llmMessages.push({
              role: "assistant",
              content: null,
              tool_calls: toolCalls.map(tc => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.function.name, arguments: tc.function.arguments },
              })),
            } as Message);

            // Execute each tool call
            for (const tc of toolCalls) {
              let parsedArgs: Record<string, unknown> = {};
              try {
                parsedArgs = JSON.parse(tc.function.arguments);
              } catch {}
              const toolResult = await handleToolCall(tc.function.name, parsedArgs);
              llmMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: toolResult,
              } as Message);
            }
          }

          if (!finalContent) {
            finalContent = "Desculpa, ocorreu um erro ao gerar a resposta.";
          }

          // Increment usage after successful response
          await db.incrementAiUsage(ctx.user.id);
          const updatedQuota = await db.getAiQuota(ctx.user.id, ctx.user.role);

          return { content: finalContent, quota: updatedQuota };
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : "Erro desconhecido";
          console.error("[AI Chat Error]", errMsg);

          if (errMsg.includes("OPENAI_API_KEY is not configured") || errMsg.includes("API key")) {
            return { content: "O **Norte** 🧭 ainda não está configurado. O administrador do sistema precisa de definir a variável de ambiente `BUILT_IN_FORGE_API_KEY` no ficheiro `.env` para ativar esta funcionalidade.\n\nPodes contactar o administrador para resolver isto. Enquanto isso, consulta a página de **Ajuda** (/help) para ver o guia completo da aplicação." };
          }

          if (errMsg.includes("401") || errMsg.includes("Unauthorized") || errMsg.includes("403") || errMsg.includes("Forbidden")) {
            return { content: "A chave da API configurada parece ser inválida ou expirou. O administrador do sistema precisa de atualizar a variável `BUILT_IN_FORGE_API_KEY` no ficheiro `.env`." };
          }

          return { content: "Desculpa, ocorreu um erro ao contactar o assistente. Tenta novamente mais tarde. Se o problema persistir, contacta o administrador do sistema." };
        }
      }),
  }),

  catalog: router({
    // Empresas
    empresas: adminProcedure.query(async () => await db.getAllEmpresas()),
    createEmpresa: adminProcedure
      .input(z.object({ nome: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const item = await db.createEmpresa(input.nome);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "empresa_created",
          description: `Empresa "${input.nome}" criada`,
          entityType: "empresa",
          entityId: item.id,
        });
        return item;
      }),
    updateEmpresa: adminProcedure
      .input(z.object({ id: z.number(), nome: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateEmpresa(input.id, input.nome);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "empresa_updated",
          description: `Empresa #${input.id} renomeada para "${input.nome}"`,
          entityType: "empresa",
          entityId: input.id,
        });
        return { success: true };
      }),
    deleteEmpresa: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteEmpresa(input.id);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "empresa_deleted",
          description: `Empresa #${input.id} eliminada`,
          entityType: "empresa",
          entityId: input.id,
        });
        return { success: true };
      }),

    // Departamentos
    departamentos: adminProcedure.query(async () => await db.getAllDepartamentos()),
    createDepartamento: adminProcedure
      .input(z.object({ nome: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const item = await db.createDepartamento(input.nome);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "departamento_created",
          description: `Departamento "${input.nome}" criado`,
          entityType: "departamento",
          entityId: item.id,
        });
        return item;
      }),
    updateDepartamento: adminProcedure
      .input(z.object({ id: z.number(), nome: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateDepartamento(input.id, input.nome);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "departamento_updated",
          description: `Departamento #${input.id} renomeado para "${input.nome}"`,
          entityType: "departamento",
          entityId: input.id,
        });
        return { success: true };
      }),
    deleteDepartamento: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteDepartamento(input.id);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "departamento_deleted",
          description: `Departamento #${input.id} eliminado`,
          entityType: "departamento",
          entityId: input.id,
        });
        return { success: true };
      }),

    // Programas
    programas: adminProcedure.query(async () => await db.getAllProgramas()),
    createPrograma: adminProcedure
      .input(z.object({ nome: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const item = await db.createPrograma(input.nome);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "programa_created",
          description: `Programa "${input.nome}" criado`,
          entityType: "programa",
          entityId: item.id,
        });
        return item;
      }),
    updatePrograma: adminProcedure
      .input(z.object({ id: z.number(), nome: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await db.updatePrograma(input.id, input.nome);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "programa_updated",
          description: `Programa #${input.id} renomeado para "${input.nome}"`,
          entityType: "programa",
          entityId: input.id,
        });
        return { success: true };
      }),
    deletePrograma: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deletePrograma(input.id);
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "programa_deleted",
          description: `Programa #${input.id} eliminado`,
          entityType: "programa",
          entityId: input.id,
        });
        return { success: true };
      }),
  }),

  admin: router({
    bulkImportUsers: adminProcedure
      .input(z.object({
        users: z.array(z.object({
          name: z.string().min(1),
          email: z.string().email(),
          username: z.string().min(3).regex(/^[a-z0-9._-]+$/),
          password: z.string().min(4),
          role: roleSchema.default("estagiario"),
          department: z.string().optional(),
          position: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        let created = 0;
        let skipped = 0;
        for (const u of input.users) {
          const existing = await db.getUserByUsername(u.username);
          if (existing) { skipped++; continue; }
          const openId = `local-dyn-${u.username}`;
          const hashed = await bcrypt.hash(u.password, 12);
          await db.upsertUser({
            openId,
            name: u.name,
            email: u.email,
            department: u.department,
            position: u.position,
            role: u.role,
            isActive: true,
            passwordHash: hashed,
            loginMethod: "local",
            avatar: DEFAULT_AVATAR,
          });
          created++;
        }
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "users_bulk_import",
          description: `Importação em massa: ${created} utilizadores criados, ${skipped} ignorados (duplicados)`,
          entityType: "user",
          entityId: null,
        });
        if (created > 0) {
          const internsImported = input.users.filter(u => u.role === "estagiario");
          if (internsImported.length > 0) {
            const appUrl = process.env.APP_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined) ?? process.env.ORIGIN ?? "http://localhost:3000";
            const namesList = internsImported.map(u => u.name).join(", ");
            sendEmail({
              to: "informatica@socem.pt",
              toName: "Informática SOCEM",
              subject: `${created} Novos Estagiários Registados via Importação`,
              heading: "Novos Estagiários Registados",
              bodyHtml: `<p>Foram criados <strong>${created}</strong> novos utilizadores via importação em massa. Destes, <strong>${internsImported.length}</strong> são estagiários:</p>
<div style="background:#f5f5f5;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#333;">${namesList}</div>
<p style="margin-top:20px;"><a href="${appUrl}/dashboard" style="background:#c0392b;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Aceder ao Portal</a></p>`,
            }).catch(() => {});
          }
        }
        return { created, skipped };
      }),

    broadcastNotification: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        role: roleSchema.optional(),
        userIds: z.array(z.number()).optional(),
        link: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let users: any[] = [];
        if (input.userIds && input.userIds.length > 0) {
          for (const id of input.userIds) {
            const u = await db.getUserById(id);
            if (u) users.push(u);
          }
        } else {
          const all = await db.getAllUsers();
          users = input.role ? all.filter((u: any) => u.role === input.role) : all;
        }
        let sent = 0;
        for (const u of users) {
          await db.createNotification({
            userId: u.id,
            title: input.title,
            message: input.message,
            type: "system",
            link: input.link,
          });
          sent++;
        }
        await db.addActivityLog({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "admin",
          action: "broadcast_notification",
          description: `Notificação em massa enviada para ${sent} utilizadores: "${input.title}"`,
          entityType: "user",
          entityId: null,
        });
        return { sent };
      }),

    systemHealth: adminProcedure.query(async () => {
      const mem = process.memoryUsage();
      const dbOk = (await db.getDb()) !== null;
      const allUsers = await db.getAllUsers();
      const plans = await db.getAllOnboardingPlans();
      const tasks = await db.getAllTasks();
      let smtpOk = false;
      try {
        const net = await import("net");
        smtpOk = await new Promise<boolean>((resolve) => {
          const socket = net.createConnection({ host: "smtp.office365.com", port: 587, timeout: 5000 });
          socket.on("connect", () => { socket.destroy(); resolve(true); });
          socket.on("error", () => resolve(false));
          socket.on("timeout", () => { socket.destroy(); resolve(false); });
        });
      } catch { smtpOk = false; }
      return {
        uptime: process.uptime(),
        memoryMB: Math.round(mem.heapUsed / 1024 / 1024),
        memoryTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        nodeVersion: process.version,
        platform: process.platform,
        databaseConnected: dbOk,
        smtpReachable: smtpOk,
        totalUsers: allUsers.length,
        activePlans: plans.filter((p: any) => p.status === 'active').length,
        totalPlans: plans.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
      };
    }),

    planTemplates: adminProcedure.query(async () => {
      return await db.getTemplatePlans();
    }),

    testEmail: adminProcedure
      .input(z.object({ to: z.string().email().optional() }).optional())
      .mutation(async ({ input }) => {
        const to = input?.to ?? "informatica@socem.pt";
        const result = await sendEmail({
          to,
          toName: to === "informatica@socem.pt" ? "Informática SOCEM" : undefined,
          subject: "Teste de Email — Portal SOCEM",
          heading: "Teste de Conectividade",
          bodyHtml: `<p>Este é um email de teste enviado pelo <strong>Portal SOCEM</strong>.</p>
<p style="color:#666;font-size:13px;">Se recebeu este email, o serviço de email está a funcionar corretamente.</p>
<p style="color:#999;font-size:12px;">Enviado em: ${new Date().toLocaleString("pt-PT")}</p>`,
        });
        return { ok: result.ok, error: result.error ?? null };
      }),

    emailConfig: adminProcedure.query(() => {
      const brevoKey = process.env.BREVO_API_KEY;
      const hasBrevo = !!brevoKey;
      const hasSmtp = !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);
      const maskedBrevoKey = brevoKey ? brevoKey.slice(0, 10) + "***" : null;
      const smtpUser = ENV.smtpUser || null;
      const maskedUser = smtpUser ? smtpUser.split("@")[0].slice(0, 3) + "***@" + smtpUser.split("@")[1] : null;

      let activeProvider = "Nenhum";
      if (hasBrevo) activeProvider = "Brevo";
      else if (hasSmtp) activeProvider = "SMTP";

      return {
        brevoConfigured: hasBrevo,
        brevoKeyMasked: maskedBrevoKey,
        smtpConfigured: hasSmtp,
        smtpHost: ENV.smtpHost || null,
        smtpPort: ENV.smtpPort,
        smtpUserMasked: maskedUser,
        smtpFrom: ENV.smtpFrom || ENV.smtpUser || null,
        activeProvider,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
