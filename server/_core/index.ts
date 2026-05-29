import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerPasswordResetRoutes } from "./passwordReset";
import { registerEmailColaboradorRoute } from "./emailColaborador";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import * as db from "../db";
import { sendEmail } from "./email";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ─── Overdue task notification job ────────────────────────────────────────────
async function notifyOverdueTasks() {
  try {
    const allTasks = await db.getAllTasks();
    const now = new Date();
    for (const task of allTasks) {
      if (!task.dueDate || task.status === 'completed') continue;
      const due = new Date(task.dueDate);
      if (due >= now) continue;
      const userId = task.assignedTo;
      if (!userId) continue;
      const existing = await db.getNotificationsByUserId(userId, 50);
      const alreadyNotified = (existing || []).some(
        (n: any) => n.title?.includes('Tarefa em atraso') && n.message?.includes(task.title)
      );
      if (alreadyNotified) continue;
      await db.createNotification({
        userId,
        title: 'Tarefa em atraso! ⏰',
        message: `A tarefa "${task.title}" está em atraso desde ${due.toLocaleDateString('pt-PT')}.`,
        type: 'task',
        link: '/tasks',
      });
      // Email to tutor about overdue intern task
      try {
        const intern = await db.getUserById(userId);
        const plan = await db.getOnboardingPlanById(task.planId);
        if (intern?.email && plan) {
          const tutorPrefs = await db.getUserEmailPreferences((plan as any).createdBy);
          if (tutorPrefs.emailTaskOverdue) {
            const tutor = await db.getUserById((plan as any).createdBy);
            if (tutor?.email) {
              sendEmail({
                to: tutor.email,
                toName: tutor.name ?? undefined,
                subject: `Tarefa em atraso — ${intern.name ?? "Estagiário"}`,
                heading: `Tarefa em Atraso ⏰`,
                bodyHtml: `<p>Olá <strong>${tutor.name ?? "Tutor"}</strong>,</p>
<p>O estagiário <strong>${intern.name ?? "desconhecido"}</strong> tem uma tarefa em atraso:</p>
<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin:16px 0;border-radius:6px;">
  <p style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:#991b1b;">${task.title}</p>
  <p style="margin:0;font-size:13px;color:#b91c1c;">Prazo: ${due.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
</div>
<p style="font-size:13px;color:#666;">Plano: ${plan.title}</p>
<p style="margin-top:20px;"><a href="${process.env.APP_URL || "http://localhost:3000"}/tasks" style="background:#c0392b;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Ver Tarefas</a></p>`,
              });
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[OverdueNotification] Error:', err);
  }
}

// ─── Upcoming deadline (2 days before) notification job ──────────────────────
async function notifyUpcomingDeadlines() {
  try {
    const allTasks = await db.getAllTasks();
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    for (const task of allTasks) {
      if (!task.dueDate || task.status === 'completed') continue;
      const due = new Date(task.dueDate);
      // Check if due date is exactly 2 days from now (same day, ignoring time)
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const targetDay = new Date(twoDaysFromNow.getFullYear(), twoDaysFromNow.getMonth(), twoDaysFromNow.getDate());
      if (dueDay.getTime() !== targetDay.getTime()) continue;
      const userId = task.assignedTo;
      if (!userId) continue;
      // Avoid duplicate notifications
      const existing = await db.getNotificationsByUserId(userId, 50);
      const alreadyNotified = (existing || []).some(
        (n: any) => n.title?.includes('Prazo aproxima-se') && n.message?.includes(task.title)
      );
      if (alreadyNotified) continue;
      await db.createNotification({
        userId,
        title: 'Prazo aproxima-se! 📅',
        message: `A tarefa "${task.title}" termina em 2 dias (${due.toLocaleDateString('pt-PT')}).`,
        type: 'task',
        link: '/tasks',
      });
      // Email to intern if enabled
      try {
        const intern = await db.getUserById(userId);
        if (intern?.email) {
          const prefs = await db.getUserEmailPreferences(userId);
          if (prefs.emailTaskDeadline) {
            sendEmail({
              to: intern.email,
              toName: intern.name ?? undefined,
              subject: `Prazo aproxima-se — ${task.title}`,
              heading: `Prazo Dentro de 2 Dias 📅`,
              bodyHtml: `<p>Olá <strong>${intern.name ?? "utilizador"}</strong>,</p>
<p>A tarefa <strong>"${task.title}"</strong> tem o prazo a terminar dentro de 2 dias.</p>
<div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px;margin:16px 0;border-radius:6px;">
  <p style="margin:0;font-size:13px;color:#9a3412;">Prazo: ${due.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
</div>
<p style="margin-top:20px;"><a href="${process.env.APP_URL || "http://localhost:3000"}/tasks" style="background:#c0392b;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;">Ver Tarefas</a></p>`,
            });
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[UpcomingDeadline] Error:', err);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerPasswordResetRoutes(app);
  registerEmailColaboradorRoute(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Schedule notification jobs
  notifyOverdueTasks();
  notifyUpcomingDeadlines();
  setInterval(notifyOverdueTasks, 5 * 60 * 1000);
  setInterval(notifyUpcomingDeadlines, 10 * 60 * 1000);
}

startServer().catch(console.error);
