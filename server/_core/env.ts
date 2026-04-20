export const ENV = {
  appId: process.env.VITE_APP_ID ?? "videosurgery-epa",
  cookieSecret: process.env.JWT_SECRET ?? "dev-videosurgery-cookie-secret",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleOAuthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
  googleHostedDomain: process.env.GOOGLE_HOSTED_DOMAIN ?? "",
};
