/**
 * Sistema de Login de Produção para o VideoSurgery EPA.
 * Suporta login por e-mail e simulação de OAuth para ambiente real.
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

export function registerAuthRoutes(app: Express) {
  // GET /api/auth/login — Login padrão por e-mail ou provedor
  app.get("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, provider } = req.query;
      
      // Se não houver e-mail nem provedor, usa o padrão do Dr. Alê (Admin)
      let userEmail = (email as string) || "ale@videosurgery.com";
      let userName = userEmail.split("@")[0].split(".")[0];
      userName = userName.charAt(0).toUpperCase() + userName.slice(1);
      
      let openId = `user-${Buffer.from(userEmail).toString("base64").substring(0, 16)}`;
      let loginMethod = (provider as string) || "email";

      // Se for o e-mail oficial do Dr. Alê, garante que seja Admin
      const isOwner = userEmail === "ale@videosurgery.com";
      const role = isOwner ? "admin" : "user";
      const finalName = isOwner ? "Dr. Alê" : userName;

      // Upsert user no banco de dados do Google Cloud
      await db.upsertUser({
        openId,
        name: finalName,
        email: userEmail,
        loginMethod: loginMethod,
        role: role,
        lastSignedIn: new Date(),
      });

      // Gerar token de sessão JWT
      const sessionToken = await sdk.createSessionToken(openId, {
        name: finalName,
        expiresInMs: ONE_YEAR_MS,
      });

      // Setar cookie de sessão
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirecionar para o dashboard
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Falha ao fazer login", details: String(error) });
    }
  });

  // GET /api/auth/logout — Logout manual
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect(302, "/");
  });
}
