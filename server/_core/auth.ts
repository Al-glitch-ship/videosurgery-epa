import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { buildGoogleAuthorizationUrl, isGoogleOAuthConfigured, normalizeReturnPath } from "./googleAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function inferNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "Usuário";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  const words = cleaned.length > 0 ? cleaned.split(/\s+/) : ["Usuário"];

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getFallbackOpenId(email: string, provider: string) {
  return `local:${provider}:${Buffer.from(email).toString("base64url")}`;
}

async function createLocalSession(req: Request, res: Response, options: {
  openId: string;
  email: string;
  name: string;
  loginMethod: string;
  returnPath: string;
  role?: "user" | "admin";
}) {
  await db.upsertUser({
    openId: options.openId,
    email: options.email,
    name: options.name,
    loginMethod: options.loginMethod,
    role: options.role,
    lastSignedIn: new Date(),
  });

  const sessionToken = await sdk.createSessionToken(options.openId, {
    name: options.name,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  res.redirect(302, options.returnPath);
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const returnPath = normalizeReturnPath(getQueryParam(req, "returnPath"));
      const provider = getQueryParam(req, "provider") ?? "google";
      const email = normalizeEmail(getQueryParam(req, "email"));

      if (isGoogleOAuthConfigured()) {
        const authorizationUrl = await buildGoogleAuthorizationUrl(req, {
          returnPath,
          provider,
          emailHint: email,
        });
        res.redirect(302, authorizationUrl);
        return;
      }

      const fallbackEmail = email ?? "ale@videosurgery.com";
      const fallbackProvider = provider || "local";
      const fallbackOpenId = getFallbackOpenId(fallbackEmail, fallbackProvider);
      const fallbackName = inferNameFromEmail(fallbackEmail);
      const fallbackRole = fallbackEmail === "ale@videosurgery.com" ? "admin" : undefined;

      await createLocalSession(req, res, {
        openId: fallbackOpenId,
        email: fallbackEmail,
        name: fallbackName,
        loginMethod: fallbackProvider,
        role: fallbackRole,
        returnPath,
      });
    } catch (error) {
      console.error("[Auth] Falha ao iniciar login:", error);
      res.status(500).json({ error: "Falha ao iniciar login", details: String(error) });
    }
  });

  app.get("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect(302, "/login");
  });
}
