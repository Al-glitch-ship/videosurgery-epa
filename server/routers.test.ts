import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { SURGICAL_AREAS, PROCEDURES_BY_AREA, AREA_LABELS, ENTRUSTMENT_LEVELS, SCORE_LABELS, getDefaultCriteria } from "../shared/surgical";

// ─── Test Helpers ────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  return createUserContext({ role: "admin", id: 99, openId: "admin-openid", ...overrides });
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Shared Data Tests ───────────────────────────────────────────────────────

describe("shared/surgical data", () => {
  it("should have surgical areas defined", () => {
    expect(SURGICAL_AREAS).toBeDefined();
    expect(Array.isArray(SURGICAL_AREAS)).toBe(true);
    expect(SURGICAL_AREAS.length).toBeGreaterThan(0);
  });

  it("should have area labels for all areas", () => {
    expect(AREA_LABELS).toBeDefined();
    for (const area of SURGICAL_AREAS) {
      expect(AREA_LABELS[area]).toBeDefined();
      expect(typeof AREA_LABELS[area]).toBe("string");
    }
  });

  it("should have procedures for each area", () => {
    expect(PROCEDURES_BY_AREA).toBeDefined();
    for (const area of SURGICAL_AREAS) {
      const procs = PROCEDURES_BY_AREA[area];
      expect(procs).toBeDefined();
      expect(Array.isArray(procs)).toBe(true);
      expect(procs.length).toBeGreaterThan(0);
      for (const proc of procs) {
        expect(proc.code).toBeDefined();
        expect(proc.name).toBeDefined();
      }
    }
  });

  it("should have entrustment levels", () => {
    expect(ENTRUSTMENT_LEVELS).toBeDefined();
    expect(Array.isArray(ENTRUSTMENT_LEVELS)).toBe(true);
    expect(ENTRUSTMENT_LEVELS.length).toBeGreaterThan(0);
    for (const level of ENTRUSTMENT_LEVELS) {
      expect(level.level).toBeDefined();
      expect(level.label).toBeDefined();
    }
  });

  it("should have score labels", () => {
    expect(SCORE_LABELS).toBeDefined();
    expect(typeof SCORE_LABELS).toBe("object");
  });

  it("should return default criteria for known procedures", () => {
    const firstArea = SURGICAL_AREAS[0];
    const firstProc = PROCEDURES_BY_AREA[firstArea][0];
    const criteria = getDefaultCriteria(firstProc.code);
    expect(Array.isArray(criteria)).toBe(true);
    // Each criteria item should have domain and items
    for (const c of criteria) {
      expect(c.domain).toBeDefined();
      expect(Array.isArray(c.items)).toBe(true);
    }
  });
});

// ─── Auth Router Tests ───────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

// ─── Protected Procedure Access Tests ────────────────────────────────────────

describe("protected procedures access control", () => {
  it("folders.myFolders rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.folders.myFolders()).rejects.toThrow();
  });

  it("folders.create rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.folders.create({
        name: "Test",
        area: "general",
        procedure: "lap_chole",
      })
    ).rejects.toThrow();
  });

  it("evaluations.byVideo rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.evaluations.byVideo({ videoId: 1 })).rejects.toThrow();
  });

  it("topicLists.list rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topicLists.list()).rejects.toThrow();
  });

  it("notifications.list rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});

// ─── Admin Procedure Access Tests ────────────────────────────────────────────

describe("admin procedures access control", () => {
  it("topicLists.create rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.topicLists.create({
        name: "Test List",
        area: "general",
        procedure: "lap_chole",
        procedureName: "Colecistectomia Laparoscópica",
      })
    ).rejects.toThrow();
  });

  it("topicLists.delete rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.topicLists.delete({ id: 1 })).rejects.toThrow();
  });

  it("topicLists.generateFromDefaults rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.topicLists.generateFromDefaults({ area: "general", procedure: "lap_chole" })
    ).rejects.toThrow();
  });
});

// ─── Input Validation Tests ──────────────────────────────────────────────────

describe("input validation", () => {
  it("folders.create rejects empty name", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.folders.create({
        name: "",
        area: "general",
        procedure: "lap_chole",
      })
    ).rejects.toThrow();
  });

  it("invites.accept requires a token", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.invites.accept({ token: "" })
    ).rejects.toThrow();
  });

  it("evaluations.create requires valid entrustment level range", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    // entrustmentLevel should be 1-5
    await expect(
      caller.evaluations.create({
        videoId: 1,
        folderId: 1,
        criteriaScores: [],
        totalScore: 0,
        maxPossibleScore: 0,
        entrustmentLevel: 0,
      })
    ).rejects.toThrow();
  });
});

// ─── Public Procedure Tests ──────────────────────────────────────────────────

describe("public procedures", () => {
  it("invites.getByToken throws NOT_FOUND for non-existent token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Should throw NOT_FOUND for non-existent token
    await expect(
      caller.invites.getByToken({ token: "nonexistent-token" })
    ).rejects.toThrow();
  });
});
