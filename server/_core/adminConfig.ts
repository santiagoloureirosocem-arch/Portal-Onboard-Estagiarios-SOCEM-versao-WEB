import { Express, Request, Response } from "express";
import * as db from "../db";
import { sendEmail } from "./email";

export function registerAdminConfigRoutes(app: Express) {
  const ADMIN_PASS = "socem2026";

  function auth(req: Request, res: Response): boolean {
    const pass = req.headers["x-admin-pass"] as string;
    if (pass !== ADMIN_PASS) {
      res.status(401).json({ error: "Password incorreta" });
      return false;
    }
    return true;
  }

  // ─── Empresas ──────────────────────────────────────────────────────────────

  app.get("/api/empresas", async (_req: Request, res: Response) => {
    try {
      const data = await db.getAllEmpresas();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar empresas" });
    }
  });

  app.post("/api/empresas", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const item = await db.createEmpresa(req.body.nome);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar empresa" });
    }
  });

  app.put("/api/empresas/:id", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      await db.updateEmpresa(Number(req.params.id), req.body.nome);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar empresa" });
    }
  });

  app.delete("/api/empresas/:id", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      await db.deleteEmpresa(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao eliminar empresa" });
    }
  });

  // ─── Departamentos ─────────────────────────────────────────────────────────

  app.get("/api/departamentos", async (_req: Request, res: Response) => {
    try {
      const data = await db.getAllDepartamentos();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar departamentos" });
    }
  });

  app.post("/api/departamentos", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const item = await db.createDepartamento(req.body.nome);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar departamento" });
    }
  });

  app.put("/api/departamentos/:id", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      await db.updateDepartamento(Number(req.params.id), req.body.nome);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar departamento" });
    }
  });

  app.delete("/api/departamentos/:id", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      await db.deleteDepartamento(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao eliminar departamento" });
    }
  });

  // ─── Programas ────────────────────────────────────────────────────────────

  app.get("/api/programas", async (_req: Request, res: Response) => {
    try {
      const data = await db.getAllProgramas();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar programas" });
    }
  });

  app.post("/api/programas", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const item = await db.createPrograma(req.body.nome);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar programa" });
    }
  });

  app.put("/api/programas/:id", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      await db.updatePrograma(Number(req.params.id), req.body.nome);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar programa" });
    }
  });

  app.delete("/api/programas/:id", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      await db.deletePrograma(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao eliminar programa" });
    }
  });

  // ─── Templates ────────────────────────────────────────────────────────────

  app.get("/api/templates", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const data = await db.getTemplatePlans();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar templates" });
    }
  });

  app.post("/api/templates/create-plan", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const { templateId, title, assignedToUserId } = req.body;
      const plan = await db.createPlanFromTemplate(templateId, title, 0);
      res.json({ success: true, plan });
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar plano a partir do template" });
    }
  });

  // ─── Notifications ────────────────────────────────────────────────────────

  app.post("/api/admin/broadcast", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const { title, message, role, link } = req.body;
      if (!title || !message) {
        res.status(400).json({ error: "Título e mensagem são obrigatórios" });
        return;
      }
      const allUsers = await db.getAllUsers();
      const users = role ? allUsers.filter((u: any) => u.role === role) : allUsers;
      let sent = 0;
      for (const u of users) {
        await db.createNotification({ userId: u.id, title, message, type: "system", link: link || undefined });
        sent++;
      }
      console.log(`[Broadcast] Sent notification "${title}" to ${sent} users (role filter: ${role || "all"})`);
      res.json({ sent });
    } catch (err) {
      console.error("[Broadcast] Error:", err);
      res.status(500).json({ error: "Erro ao enviar notificação" });
    }
  });

  // ─── System Health ────────────────────────────────────────────────────────

  app.get("/api/admin/health", async (req: Request, res: Response) => {
    if (!auth(req, res)) return;
    try {
      const dbOk = (await db.getDb()) !== null;
      const allUsers = await db.getAllUsers();
      const plans = await db.getAllOnboardingPlans();
      const tasks = await db.getAllTasks();
      const mem = process.memoryUsage();
      // SMTP connectivity check
      const net = await import("net");
      let smtpOk = false;
      try {
        smtpOk = await new Promise<boolean>((resolve) => {
          const socket = net.createConnection({ host: "smtp.office365.com", port: 587, timeout: 5000 });
          socket.on("connect", () => { socket.destroy(); resolve(true); });
          socket.on("error", () => resolve(false));
          socket.on("timeout", () => { socket.destroy(); resolve(false); });
        });
      } catch { smtpOk = false; }
      res.json({
        uptime: Math.round(process.uptime()),
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
      });
    } catch (err) {
      res.status(500).json({ error: "Erro ao obter estado do sistema" });
    }
  });
}
