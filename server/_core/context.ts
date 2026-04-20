import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, entry) => {
    const [key, ...values] = entry.trim().split("=");
    if (key) {
      acc[key] = values.join("=");
    }
    return acc;
  }, {});
}

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const sessionCookie = cookies[COOKIE_NAME];

    if (sessionCookie) {
      const session = await sdk.verifySession(sessionCookie);
      if (session) {
        user = (await db.getUserByOpenId(session.openId)) ?? null;
      }
    }
  } catch (error) {
    console.warn("[Auth] Falha ao criar contexto autenticado:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
