/**
 * Sistema de Login Multi-Perfil para o VideoSurgery EPA.
 * Permite alternar entre perfis de teste (Admin, Preceptor, Residente).
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

export function registerAuthRoutes(app: Express) {
  // GET /api/auth/login — Login seletivo por perfil
  app.get("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { role } = req.query;
      
      let openId = "owner-admin-videosurgery";
      let name = "Dr. Alê";
      let email = "ale@videosurgery.com";
      let userRole: "admin" | "user" = "admin";

      if (role === "residente") {
        openId = "test-residente-1";
        name = "Residente Teste";
        email = "residente@exemplo.com";
        userRole = "user";
      } else if (role === "preceptor") {
        openId = "test-preceptor-1";
        name = "Preceptor Convidado";
        email = "preceptor@exemplo.com";
        userRole = "user";
      }

      // Upsert user no banco de dados
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "direct",
        role: userRole,
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

  // GET /api/auth/logout — Logout manual
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.redirect(302, "/");
  });
}
