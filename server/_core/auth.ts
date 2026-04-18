/**
 * Rota de auto-login para o VideoSurgery EPA.
 * Enquanto não houver um OAuth provider configurado (Google Sign-In, etc.),
 * esta rota cria/autentica o usuário admin diretamente.
 * 
 * Em produção com OAuth real, desabilite esta rota.
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

export function registerAuthRoutes(app: Express) {
  // GET /api/auth/login — Auto-login (cria usuário se necessário)
  app.get("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const openId = "owner-admin-videosurgery";
      const name = "Dr. Alê";
      const email = "ale@videosurgery.com";

      // Upsert user no banco de dados
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "direct",
        lastSignedIn: new Date(),
      });

      // Gerar token de sessão JWT
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Setar cookie de sessão
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirecionar para o dashboard
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Falha ao fazer login", details: String(error) });
    }
  });
}
