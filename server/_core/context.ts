import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const IS_DEV_NO_DB = !process.env.DATABASE_URL;
const DEV_USER = { id: 1, name: "Dr. Alê (Dev)", email: "ale@videosurgery.com", role: "admin" } as User;

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    if (IS_DEV_NO_DB) {
      // Em desenvolvimento sem banco de dados, usa usuário simulado
      user = DEV_USER;
    } else {
      // Em produção: tenta verificar o cookie JWT de sessão
      const cookieHeader = opts.req.headers.cookie;
      if (cookieHeader) {
        // Parse cookies manually (cookie-parser may not be installed)
        const cookies: Record<string, string> = {};
        cookieHeader.split(";").forEach(c => {
          const [key, ...vals] = c.trim().split("=");
          if (key) cookies[key] = vals.join("=");
        });

        const sessionCookie = cookies[COOKIE_NAME];
        if (sessionCookie) {
          const session = await sdk.verifySession(sessionCookie);
          if (session) {
            user = await db.getUserByOpenId(session.openId);
          }
        }
      }
    }
  } catch (error) {
    // Autenticação falhou — user permanece null
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
