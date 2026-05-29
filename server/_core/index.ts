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
    }
  } catch (err) {
    console.warn('[OverdueNotification] Error:', err);
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

  // Schedule overdue task check every 5 minutes
  notifyOverdueTasks();
  setInterval(notifyOverdueTasks, 5 * 60 * 1000);
}

startServer().catch(console.error);
