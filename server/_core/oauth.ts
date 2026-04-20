import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { decodeAuthState, exchangeGoogleCodeForProfile, isGoogleOAuthConfigured } from "./googleAuth";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const authState = decodeAuthState(state);

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    if (!isGoogleOAuthConfigured()) {
      res.status(400).json({
        error: "Google OAuth não está configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.",
      });
      return;
    }

    try {
      const profile = await exchangeGoogleCodeForProfile(req, code);

      if (!profile.email) {
        res.status(400).json({ error: "A conta Google autenticada não informou um e-mail." });
        return;
      }

      if (!profile.emailVerified) {
        res.status(403).json({ error: "O e-mail da conta Google precisa estar verificado." });
        return;
      }

      if (ENV.googleHostedDomain && profile.hostedDomain !== ENV.googleHostedDomain) {
        res.status(403).json({
          error: `A autenticação está restrita ao domínio ${ENV.googleHostedDomain}.`,
        });
        return;
      }

      const openId = `google:${profile.sub}`;
      const name = profile.name || profile.email;

      await db.upsertUser({
        openId,
        name,
        email: profile.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, authState.returnPath);
    } catch (error) {
      console.error("[OAuth] Falha no callback do Google:", error);
      res.status(500).json({ error: "Falha ao concluir autenticação Google" });
    }
  });
}
