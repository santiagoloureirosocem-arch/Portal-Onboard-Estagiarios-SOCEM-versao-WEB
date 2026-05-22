import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// ── Seed accounts (always available) ──────────────────────────────────────────
const SEED_USERS: Record<string, { password: string; name: string; role: "admin" | "tutor" | "estagiario" }> = {
  "admin": { password: "admin123", name: "Administrador", role: "admin" },
  "tutor": { password: "tutor123", name: "Tutor Demo", role: "tutor" },
  "estagiario": { password: "socem123", name: "Estagiário Demo", role: "estagiario" },
};

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "Username e password são obrigatórios" });
      return;
    }

    const key = username.toLowerCase().trim();

    // 1) Seed accounts
    const seed = SEED_USERS[key];
    if (seed && seed.password === password) {
      await finishLogin(req, res, `local-${key}`, seed.name, seed.role, `${key}@local.dev`);
      return;
    }

    // 2) Dynamic DB users (openId = local-dyn-<username>)
    const dbUser = await db.getUserByUsername(key);
    if (dbUser) {
      if (dbUser.isActive === false) {
        res.status(401).json({ error: "Conta desativada" });
        return;
      }
      if (dbUser.passwordHash !== password) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }
      // Only update lastSignedIn — preserve role and all other fields from DB
      await db.upsertUser({ openId: dbUser.openId, lastSignedIn: new Date() });
      const sessionToken = await sdk.createSessionToken(dbUser.openId, {
        name: dbUser.name ?? key,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      // Clear any existing session before setting the new one
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, name: dbUser.name ?? key, role: dbUser.role });
      return;
    }

    res.status(401).json({ error: "Credenciais inválidas" });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/oauth/callback", async (_req: Request, res: Response) => {
    res.redirect(302, "/");
  });
}

async function finishLogin(
  req: Request,
  res: Response,
  openId: string,
  name: string,
  role: "admin" | "tutor" | "estagiario",
  email: string
) {
  await db.upsertUser({ openId, name, email, loginMethod: "local", role, lastSignedIn: new Date() });

  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  // Clear any existing session before setting the new one
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  res.json({ success: true, name, role });
}
