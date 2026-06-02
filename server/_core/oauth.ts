import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// ── Rate limiting for login ───────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return true;
  if (now > entry.resetAt) {
    loginAttempts.delete(ip);
    return true;
  }
  return entry.count < MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_LOCKOUT_MS });
  } else {
    entry.count++;
  }
}

function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// ── Seed accounts (always available, hashed at startup) ───────────────────────
const SEED_USERS: Record<string, { name: string; role: "admin" | "tutor" | "estagiario" }> = {
  "admin": { name: "Administrador", role: "admin" },
  "tutor": { name: "Tutor Demo", role: "tutor" },
  "estagiario": { name: "Estagiário Demo", role: "estagiario" },
};

const SEED_PASSWORDS: Record<string, string> = {
  "admin": "admin123",
  "tutor": "tutor123",
  "estagiario": "socem123",
};

// Hash seed passwords once at module load
let seedHashes: Record<string, string> = {};
(async () => {
  for (const [key, pwd] of Object.entries(SEED_PASSWORDS)) {
    seedHashes[key] = await bcrypt.hash(pwd, 12);
  }
})();

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: "Username e password são obrigatórios" });
      return;
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

    if (!checkRateLimit(ip)) {
      const entry = loginAttempts.get(ip);
      const waitMinutes = entry ? Math.ceil((entry.resetAt - Date.now()) / 60000) : 15;
      res.status(429).json({ error: `Demasiadas tentativas. Tente novamente em ${waitMinutes} minuto(s).` });
      return;
    }

    const key = username.toLowerCase().trim();

    // 1) Seed accounts
    const seed = SEED_USERS[key];
    if (seed && seedHashes[key] && await bcrypt.compare(password, seedHashes[key])) {
      resetLoginAttempts(ip);
      await finishLogin(req, res, `local-${key}`, seed.name, seed.role, `${key}@local.dev`);
      return;
    }

    // 2) Dynamic DB users (openId = local-dyn-<username>)
    const dbUser = await db.getUserByUsername(key);
    if (dbUser) {
      if (dbUser.isActive === false) {
        recordLoginAttempt(ip);
        res.status(401).json({ error: "Conta desativada" });
        return;
      }
      const valid = await bcrypt.compare(password, dbUser.passwordHash ?? "");
      if (!valid) {
        recordLoginAttempt(ip);
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }
      resetLoginAttempts(ip);
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

    recordLoginAttempt(ip);
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
  try {
    await db.upsertUser({ openId, name, email, loginMethod: "local", role, lastSignedIn: new Date() });
  } catch (err) {
    console.warn("[Login] upsertUser failed (non-fatal):", err);
  }

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
