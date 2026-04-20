import type { Request } from "express";
import { OAuth2Client } from "google-auth-library";
import { ENV } from "./env";

const DEFAULT_RETURN_PATH = "/dashboard";

export type AuthState = {
  returnPath: string;
  provider?: string | null;
  emailHint?: string | null;
};

export type GoogleProfile = {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  hostedDomain: string | null;
};

export function normalizeReturnPath(value?: string | null) {
  if (!value || typeof value !== "string") {
    return DEFAULT_RETURN_PATH;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_PATH;
  }

  return value;
}

function getRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwardedProto === "string"
      ? forwardedProto.split(",")[0]!.trim()
      : req.protocol;
  const host = req.get("host");

  if (!host) {
    throw new Error("Não foi possível determinar o host da requisição.");
  }

  return `${protocol}://${host}`;
}

export function getGoogleRedirectUri(req: Request) {
  return ENV.googleOAuthRedirectUri || `${getRequestOrigin(req)}/api/oauth/callback`;
}

function createGoogleClient(req: Request) {
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    throw new Error("Google OAuth não está configurado.");
  }

  return new OAuth2Client(
    ENV.googleClientId,
    ENV.googleClientSecret,
    getGoogleRedirectUri(req),
  );
}

export function isGoogleOAuthConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}

export function encodeAuthState(state: AuthState) {
  return Buffer.from(
    JSON.stringify({
      returnPath: normalizeReturnPath(state.returnPath),
      provider: state.provider ?? null,
      emailHint: state.emailHint ?? null,
    }),
    "utf8",
  ).toString("base64url");
}

export function decodeAuthState(value?: string) {
  const fallback = {
    returnPath: DEFAULT_RETURN_PATH,
    provider: null,
    emailHint: null,
  } as const;

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AuthState>;

    return {
      returnPath: normalizeReturnPath(parsed.returnPath),
      provider: typeof parsed.provider === "string" ? parsed.provider : null,
      emailHint: typeof parsed.emailHint === "string" ? parsed.emailHint : null,
    };
  } catch {
    return fallback;
  }
}

export async function buildGoogleAuthorizationUrl(req: Request, state: AuthState) {
  const client = createGoogleClient(req);
  const emailHint = state.emailHint?.trim() || undefined;

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "select_account consent",
    login_hint: emailHint,
    response_type: "code",
    scope: ["openid", "email", "profile"],
    state: encodeAuthState(state),
  });
}

export async function exchangeGoogleCodeForProfile(req: Request, code: string): Promise<GoogleProfile> {
  const client = createGoogleClient(req);
  const redirectUri = getGoogleRedirectUri(req);
  const { tokens } = await client.getToken({
    code,
    redirect_uri: redirectUri,
  });

  if (!tokens.id_token) {
    throw new Error("O Google não retornou um ID token.");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: ENV.googleClientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub) {
    throw new Error("O token do Google não contém o identificador do usuário.");
  }

  return {
    sub: payload.sub,
    email: payload.email ?? null,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name ?? null,
    picture: payload.picture ?? null,
    hostedDomain: payload.hd ?? null,
  };
}
