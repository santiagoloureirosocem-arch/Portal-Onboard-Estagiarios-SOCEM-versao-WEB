export const ENV = {
  // APP_ID tem prioridade; VITE_APP_ID como fallback para compatibilidade
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "socem-portal",
  cookieSecret: process.env.JWT_SECRET ?? "socem-dev-secret",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
