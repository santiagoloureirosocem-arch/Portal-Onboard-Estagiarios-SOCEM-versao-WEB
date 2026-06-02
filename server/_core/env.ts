import { randomBytes } from "crypto";

const generatedSecret = randomBytes(32).toString("hex");

export const ENV = {
  // APP_ID tem prioridade; VITE_APP_ID como fallback para compatibilidade
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "socem-portal",
  cookieSecret: process.env.JWT_SECRET ?? generatedSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // SMTP (Office 365)
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587"),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "",
};

if (!process.env.JWT_SECRET) {
  console.warn("[SECURITY] JWT_SECRET não está configurado. A gerar segredo aleatório temporário (sessões serão perdidas ao reiniciar). Defina JWT_SECRET no .env para produção.");
}
