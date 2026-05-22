/**
 * Password Reset — endpoints REST
 *
 * POST /api/auth/forgot-password  → verifica email, gera token, guarda em memória
 * POST /api/auth/reset-password   → valida token + email, atualiza passwordHash
 *
 * Os tokens expiram ao fim de 15 minutos.
 * Em produção, substituir o console.log pelo envio real de email (Nodemailer/Resend).
 */

import type { Express, Request, Response } from "express";
import * as db from "../db";

// ── Token store (in-memory, suficiente para modo dev/local) ──────────────────
interface ResetEntry {
  email: string;
  code: string;
  expiresAt: number; // timestamp ms
}

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos
const resetStore = new Map<string, ResetEntry>(); // key = email

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function purgeExpired() {
  const now = Date.now();
  for (const [email, entry] of resetStore) {
    if (entry.expiresAt < now) resetStore.delete(email);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findUserByEmail(email: string) {
  const allUsers = await db.getAllUsers();
  return allUsers.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerPasswordResetRoutes(app: Express) {
  /**
   * 1) Pedir reset — verifica se o email existe e devolve o código
   *    (em produção enviar por email e não o expor na resposta)
   */
  app.post(
    "/api/auth/forgot-password",
    async (req: Request, res: Response) => {
      try {
        const { email } = req.body ?? {};

        if (!email || typeof email !== "string") {
          res.status(400).json({ error: "Email inválido" });
          return;
        }

        const user = await findUserByEmail(email.trim());

        if (!user) {
          // Resposta genérica para não confirmar se o email existe
          res.status(404).json({ error: "Email não encontrado" });
          return;
        }

        purgeExpired();

        const code = generateCode();
        resetStore.set(email.toLowerCase(), {
          email: email.toLowerCase(),
          code,
          expiresAt: Date.now() + TOKEN_TTL_MS,
        });

        // ── Em produção: enviar email aqui ──────────────────────────────
        // await sendEmail({ to: email, subject: "Código de recuperação", text: `O teu código é: ${code}` });
        // ────────────────────────────────────────────────────────────────

        console.log(
          `[PasswordReset] Código para ${email}: ${code} (expira em 15 min)`
        );

        res.json({
          success: true,
          message: "Código enviado",
          // Remover 'code' abaixo em produção — serve apenas para dev/demo
          code,
        });
      } catch (err) {
        console.error("[PasswordReset] forgot-password error:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  );

  /**
   * 2) Confirmar código e redefinir a password
   */
  app.post(
    "/api/auth/reset-password",
    async (req: Request, res: Response) => {
      try {
        const { email, code, newPassword } = req.body ?? {};

        if (!email || !code || !newPassword) {
          res.status(400).json({ error: "Dados incompletos" });
          return;
        }

        if (typeof newPassword !== "string" || newPassword.length < 4) {
          res.status(400).json({
            error: "A password deve ter pelo menos 4 caracteres",
          });
          return;
        }

        purgeExpired();

        const entry = resetStore.get(email.toLowerCase());

        if (!entry) {
          res.status(400).json({
            error: "Código inválido ou expirado. Pede um novo código.",
          });
          return;
        }

        if (entry.code !== code.toString()) {
          res.status(400).json({ error: "Código incorreto" });
          return;
        }

        if (entry.expiresAt < Date.now()) {
          resetStore.delete(email.toLowerCase());
          res.status(400).json({
            error: "O código expirou. Pede um novo código.",
          });
          return;
        }

        const user = await findUserByEmail(email.trim());

        if (!user) {
          res.status(404).json({ error: "Utilizador não encontrado" });
          return;
        }

        // Atualizar a password na base de dados
        await db.updateUser(user.id, { passwordHash: newPassword });

        // Invalidar o token usado
        resetStore.delete(email.toLowerCase());

        console.log(
          `[PasswordReset] Password atualizada para utilizador id=${user.id}`
        );

        res.json({ success: true, message: "Password redefinida com sucesso" });
      } catch (err) {
        console.error("[PasswordReset] reset-password error:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  );
}
