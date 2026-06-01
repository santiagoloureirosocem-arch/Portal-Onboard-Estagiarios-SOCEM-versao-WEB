import { Express, Request, Response } from "express";
import * as db from "../db";

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
}
