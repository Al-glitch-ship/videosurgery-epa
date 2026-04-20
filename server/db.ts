import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { getMilestoneForCriterion, getDefaultCriteria } from "@shared/surgical";
import {
  Evaluation,
  Folder,
  FolderAccess,
  FolderInvite,
  InsertUser,
  Notification,
  TopicCriteria,
  TopicList,
  Video,
  evaluations,
  folderAccess,
  folderInvites,
  folders,
  notifications,
  topicCriteria,
  topicLists,
  users,
  videos,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

// ─── Dev mock (in-memory) ────────────────────────────────────────────────────
const IS_DEV_NO_DB = !process.env.DATABASE_URL;

let _idCounter = 100;
const nextId = () => ++_idCounter;
const now = () => new Date();

const _mockUsers: any[] = [
  { id: 1, name: "Dr. Alê (Dev)", email: "ale@videosurgery.com", role: "admin", openId: "dev-1", loginMethod: null, lastSignedIn: now(), createdAt: now() },
];
const _mockFolders: any[] = [];
const _mockVideos: any[] = [];
const _mockInvites: any[] = [];
const _mockAccess: any[] = [];
const _mockEvaluations: any[] = [];
const _mockTopicLists: any[] = [];
const _mockTopicCriteria: any[] = [];
const _mockNotifications: any[] = [];

// ─── DB connection ───────────────────────────────────────────────────────────
let _db: any = null;

export async function getDb() {
  if (IS_DEV_NO_DB) return null;
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = process.env.DATABASE_URL;
      // Cloud SQL uses Unix sockets: mysql://user:pass@/dbname?socketPath=/cloudsql/...
      if (dbUrl.includes("socketPath=")) {
        const socketMatch = dbUrl.match(/socketPath=([^&]+)/);
        const userMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@/);
        const dbNameMatch = dbUrl.match(/@\/([^?]+)/);
        if (socketMatch && userMatch && dbNameMatch) {
          const mysql2 = await import("mysql2/promise");
          const connection = await mysql2.createConnection({
            user: userMatch[1],
            password: userMatch[2],
            database: dbNameMatch[1],
            socketPath: socketMatch[1],
          });
          _db = drizzle(connection);
        }
      } else {
        _db = drizzle(dbUrl);
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Helper to get db or throw
async function db() {
  const d = await getDb();
  if (!d) throw new Error("[Database] Not available");
  return d;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  if (IS_DEV_NO_DB) {
    const existingIndex = _mockUsers.findIndex((entry) => entry.openId === user.openId);
    const existing = existingIndex >= 0 ? _mockUsers[existingIndex] : null;
    const record = {
      id: existing?.id ?? nextId(),
      openId: user.openId,
      name: user.name ?? existing?.name ?? null,
      email: user.email ?? existing?.email ?? null,
      loginMethod: user.loginMethod ?? existing?.loginMethod ?? null,
      role: user.role ?? existing?.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      lastSignedIn: user.lastSignedIn ?? now(),
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };

    if (existingIndex >= 0) {
      _mockUsers[existingIndex] = record;
    } else {
      _mockUsers.push(record);
    }
    return;
  }

  const d = await db();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await d.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  if (IS_DEV_NO_DB) return _mockUsers.find(u => u.openId === openId);
  const d = await db();
  const result = await d.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  if (IS_DEV_NO_DB) return _mockUsers.find(u => u.id === id);
  const d = await db();
  const result = await d.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  if (IS_DEV_NO_DB) return _mockUsers.find(u => u.email === email);
  const d = await db();
  const result = await d.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}


// ─── Topic Lists ──────────────────────────────────────────────────────────────
export async function getAllTopicLists(): Promise<TopicList[]> {
  if (IS_DEV_NO_DB) return [..._mockTopicLists];
  const d = await db();
  return d.select().from(topicLists).orderBy(desc(topicLists.createdAt));
}

export async function getTopicListById(id: number): Promise<TopicList | undefined> {
  if (IS_DEV_NO_DB) return _mockTopicLists.find((t: any) => t.id === id);
  const d = await db();
  const result = await d.select().from(topicLists).where(eq(topicLists.id, id)).limit(1);
  return result[0];
}

export async function getTopicListByAreaAndProcedure(
  area: string,
  procedure: string
): Promise<TopicList | undefined> {
  if (IS_DEV_NO_DB) return _mockTopicLists.find((t: any) => t.area === area && t.procedure === procedure && t.isActive);
  const d = await db();
  const result = await d
    .select()
    .from(topicLists)
    .where(
      and(
        eq(topicLists.area, area),
        eq(topicLists.procedure, procedure),
        eq(topicLists.isActive, true)
      )
    )
    .limit(1);
  return result[0];
}

export async function createTopicList(data: {
  name: string;
  description?: string;
  area: string;
  procedure: string;
  procedureName: string;
  createdBy: number;
}): Promise<number> {
  if (IS_DEV_NO_DB) {
    const id = nextId();
    _mockTopicLists.push({ id, isActive: true, createdAt: now(), updatedAt: now(), description: null, ...data });
    return id;
  }
  const d = await db();
  const result = await d.insert(topicLists).values(data);
  return Number((result as any)[0].insertId);
}

export async function updateTopicList(
  id: number,
  data: { name?: string; description?: string; isActive?: boolean }
): Promise<void> {
  if (IS_DEV_NO_DB) { const t = _mockTopicLists.find((x: any) => x.id === id); if (t) Object.assign(t, data); return; }
  const d = await db();
  await d.update(topicLists).set(data).where(eq(topicLists.id, id));
}

export async function deleteTopicList(id: number): Promise<void> {
  if (IS_DEV_NO_DB) {
    const ti = _mockTopicLists.findIndex((x: any) => x.id === id);
    if (ti !== -1) _mockTopicLists.splice(ti, 1);
    const toRemove = _mockTopicCriteria.filter((c: any) => c.topicListId === id).map((c: any) => c.id);
    toRemove.forEach((cid: number) => { const i = _mockTopicCriteria.findIndex((x: any) => x.id === cid); if (i !== -1) _mockTopicCriteria.splice(i, 1); });
    return;
  }
  const d = await db();
  await d.delete(topicCriteria).where(eq(topicCriteria.topicListId, id));
  await d.delete(topicLists).where(eq(topicLists.id, id));
}

// ─── Topic Criteria ───────────────────────────────────────────────────────────
export async function getCriteriaByTopicList(topicListId: number): Promise<TopicCriteria[]> {
  if (IS_DEV_NO_DB) return _mockTopicCriteria.filter((c: any) => c.topicListId === topicListId).sort((a: any, b: any) => a.domainOrder - b.domainOrder || a.itemOrder - b.itemOrder);
  const d = await db();
  return d
    .select()
    .from(topicCriteria)
    .where(eq(topicCriteria.topicListId, topicListId))
    .orderBy(topicCriteria.domainOrder, topicCriteria.itemOrder);
}

export async function replaceCriteria(
  topicListId: number,
  items: { domain: string; domainOrder: number; item: string; itemOrder: number; milestone?: string; description?: string }[]
): Promise<void> {
  if (IS_DEV_NO_DB) {
    const existing = _mockTopicCriteria.filter((c: any) => c.topicListId === topicListId).map((c: any) => c.id);
    existing.forEach((id: number) => { const i = _mockTopicCriteria.findIndex((x: any) => x.id === id); if (i !== -1) _mockTopicCriteria.splice(i, 1); });
    items.forEach(item => _mockTopicCriteria.push({ id: nextId(), topicListId, milestone: null, description: null, ...item }));
    return;
  }
  const d = await db();
  await d.delete(topicCriteria).where(eq(topicCriteria.topicListId, topicListId));
  if (items.length > 0) {
    await d.insert(topicCriteria).values(items.map((i) => ({ ...i, topicListId })));
  }
}

// ─── Folders ──────────────────────────────────────────────────────────────────
export async function getFoldersByOwner(ownerId: number): Promise<Folder[]> {
  if (IS_DEV_NO_DB) return _mockFolders.filter((f: any) => f.ownerId === ownerId && !f.isArchived).sort((a: any, b: any) => b.createdAt - a.createdAt);
  const d = await db();
  return d
    .select()
    .from(folders)
    .where(and(eq(folders.ownerId, ownerId), eq(folders.isArchived, false)))
    .orderBy(desc(folders.createdAt));
}

export async function getSharedFolders(userId: number): Promise<Folder[]> {
  if (IS_DEV_NO_DB) {
    const ids = _mockAccess.filter((a: any) => a.userId === userId).map((a: any) => a.folderId);
    return _mockFolders.filter((f: any) => ids.includes(f.id) && !f.isArchived);
  }
  const d = await db();
  const access = await d
    .select()
    .from(folderAccess)
    .where(eq(folderAccess.userId, userId));
  if (access.length === 0) return [];
  const folderIds = access.map((a: typeof access[number]) => a.folderId);
  return d
    .select()
    .from(folders)
    .where(and(inArray(folders.id, folderIds), eq(folders.isArchived, false)))
    .orderBy(desc(folders.createdAt));
}

export async function getFolderById(id: number): Promise<Folder | undefined> {
  if (IS_DEV_NO_DB) return _mockFolders.find((f: any) => f.id === id);
  const d = await db();
  const result = await d.select().from(folders).where(eq(folders.id, id)).limit(1);
  return result[0];
}

export async function createFolder(data: {
  ownerId: number;
  name: string;
  description?: string;
  area: string;
  procedure: string;
  topicListId?: number;
  coverColor?: string;
}): Promise<number> {
  if (IS_DEV_NO_DB) {
    const id = nextId();
    _mockFolders.push({ id, isArchived: false, createdAt: now(), updatedAt: now(), topicListId: null, description: null, coverColor: null, ...data });
    return id;
  }
  const d = await db();
  const result = await d.insert(folders).values(data);
  return Number((result as any)[0].insertId);
}

export async function updateFolder(
  id: number,
  data: {
    name?: string;
    description?: string;
    topicListId?: number | null;
    coverColor?: string;
    isArchived?: boolean;
  }
): Promise<void> {
  if (IS_DEV_NO_DB) { const f = _mockFolders.find((x: any) => x.id === id); if (f) Object.assign(f, data); return; }
  const d = await db();
  await d.update(folders).set(data).where(eq(folders.id, id));
}

export async function deleteFolder(id: number): Promise<void> {
  if (IS_DEV_NO_DB) {
    [_mockEvaluations, _mockVideos, _mockInvites, _mockAccess].forEach(arr => {
      const toRemove = (arr as any[]).filter((x: any) => x.folderId === id).map((x: any) => x.id);
      toRemove.forEach((rid: number) => { const i = arr.findIndex((x: any) => x.id === rid); if (i !== -1) arr.splice(i, 1); });
    });
    const fi = _mockFolders.findIndex((x: any) => x.id === id);
    if (fi !== -1) _mockFolders.splice(fi, 1);
    return;
  }
  const d = await db();
  await d.delete(evaluations).where(eq(evaluations.folderId, id));
  await d.delete(videos).where(eq(videos.folderId, id));
  await d.delete(folderInvites).where(eq(folderInvites.folderId, id));
  await d.delete(folderAccess).where(eq(folderAccess.folderId, id));
  await d.delete(folders).where(eq(folders.id, id));
}

export async function getFoldersByArea(area: string): Promise<Folder[]> {
  if (IS_DEV_NO_DB) return _mockFolders.filter((f: any) => f.area === area);
  const d = await db();
  return d.select().from(folders).where(eq(folders.area, area));
}

export async function getFoldersByProcedure(procedure: string): Promise<Folder[]> {
  if (IS_DEV_NO_DB) return _mockFolders.filter((f: any) => f.procedure === procedure);
  const d = await db();
  return d.select().from(folders).where(eq(folders.procedure, procedure));
}

export async function getFoldersByAreaAndProcedure(area: string, procedure: string): Promise<Folder[]> {
  if (IS_DEV_NO_DB) return _mockFolders.filter((f: any) => f.area === area && f.procedure === procedure);
  const d = await db();
  return d.select().from(folders).where(and(eq(folders.area, area), eq(folders.procedure, procedure)));
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export async function getVideosByFolder(folderId: number): Promise<Video[]> {
  if (IS_DEV_NO_DB) return _mockVideos.filter((v: any) => v.folderId === folderId).sort((a: any, b: any) => b.createdAt - a.createdAt);
  const d = await db();
  return d
    .select()
    .from(videos)
    .where(eq(videos.folderId, folderId))
    .orderBy(desc(videos.createdAt));
}

export async function getVideoById(id: number): Promise<Video | undefined> {
  if (IS_DEV_NO_DB) return _mockVideos.find((v: any) => v.id === id);
  const d = await db();
  const result = await d.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function createVideo(data: {
  folderId: number;
  uploadedBy: number;
  title: string;
  description?: string;
  localPath?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number;
}): Promise<number> {
  if (IS_DEV_NO_DB) {
    const id = nextId();
    _mockVideos.push({ id, createdAt: now(), updatedAt: now(), thumbnailUrl: null, s3Url: null, s3Key: null, description: null, localPath: null, mimeType: null, sizeBytes: null, durationSeconds: null, ...data });
    return id;
  }
  const d = await db();
  const result = await d.insert(videos).values(data);
  return Number((result as any)[0].insertId);
}

export async function updateVideo(
  id: number,
  data: { title?: string; description?: string; thumbnailUrl?: string; s3Url?: string; s3Key?: string }
): Promise<void> {
  if (IS_DEV_NO_DB) { const v = _mockVideos.find((x: any) => x.id === id); if (v) Object.assign(v, data); return; }
  const d = await db();
  await d.update(videos).set(data).where(eq(videos.id, id));
}

export async function deleteVideo(id: number): Promise<void> {
  if (IS_DEV_NO_DB) { const vi = _mockVideos.findIndex((x: any) => x.id === id); if (vi !== -1) _mockVideos.splice(vi, 1); return; }
  const d = await db();
  await d.delete(evaluations).where(eq(evaluations.videoId, id));
  await d.delete(videos).where(eq(videos.id, id));
}

// ─── Folder Invites ───────────────────────────────────────────────────────────
export async function getInvitesByFolder(folderId: number): Promise<FolderInvite[]> {
  if (IS_DEV_NO_DB) return _mockInvites.filter((i: any) => i.folderId === folderId);
  const d = await db();
  return d
    .select()
    .from(folderInvites)
    .where(eq(folderInvites.folderId, folderId))
    .orderBy(desc(folderInvites.createdAt));
}

export async function getPendingInvitesByEmail(email: string): Promise<FolderInvite[]> {
  if (IS_DEV_NO_DB) return _mockInvites.filter((i: any) => i.inviteeEmail === email && i.status === "pending");
  const d = await db();
  return d
    .select()
    .from(folderInvites)
    .where(and(eq(folderInvites.inviteeEmail, email), eq(folderInvites.status, "pending")))
    .orderBy(desc(folderInvites.createdAt));
}

export async function getPendingInvitesByUser(userId: number): Promise<FolderInvite[]> {
  if (IS_DEV_NO_DB) return _mockInvites.filter((i: any) => i.inviteeUserId === userId && i.status === "pending");
  const d = await db();
  return d
    .select()
    .from(folderInvites)
    .where(and(eq(folderInvites.inviteeUserId, userId), eq(folderInvites.status, "pending")))
    .orderBy(desc(folderInvites.createdAt));
}

export async function getInviteByToken(token: string): Promise<FolderInvite | undefined> {
  if (IS_DEV_NO_DB) return _mockInvites.find((i: any) => i.token === token);
  const d = await db();
  const result = await d
    .select()
    .from(folderInvites)
    .where(eq(folderInvites.token, token))
    .limit(1);
  return result[0];
}

export async function createInvite(data: {
  folderId: number;
  invitedBy: number;
  inviteeEmail: string;
  token: string;
  message?: string;
  expiresAt?: Date;
}): Promise<number> {
  if (IS_DEV_NO_DB) {
    const id = nextId();
    _mockInvites.push({ id, status: "pending", inviteeUserId: null, acceptedAt: null, emailSent: false, createdAt: now(), message: null, expiresAt: null, ...data });
    return id;
  }
  const d = await db();
  const result = await d.insert(folderInvites).values(data);
  return Number((result as any)[0].insertId);
}

export async function updateInviteStatus(
  id: number,
  status: "pending" | "accepted" | "declined" | "revoked",
  extra?: { inviteeUserId?: number; acceptedAt?: Date; emailSent?: boolean }
): Promise<void> {
  if (IS_DEV_NO_DB) { const inv = _mockInvites.find((x: any) => x.id === id); if (inv) Object.assign(inv, { status, ...extra }); return; }
  const d = await db();
  await d
    .update(folderInvites)
    .set({ status, ...extra })
    .where(eq(folderInvites.id, id));
}

// ─── Folder Access ────────────────────────────────────────────────────────────
export async function grantFolderAccess(folderId: number, userId: number): Promise<void> {
  if (IS_DEV_NO_DB) {
    const exists = _mockAccess.find((a: any) => a.folderId === folderId && a.userId === userId);
    if (!exists) _mockAccess.push({ id: nextId(), folderId, userId, grantedAt: now() });
    return;
  }
  const d = await db();
  const existing = await d
    .select()
    .from(folderAccess)
    .where(and(eq(folderAccess.folderId, folderId), eq(folderAccess.userId, userId)))
    .limit(1);
  if (existing.length === 0) {
    await d.insert(folderAccess).values({ folderId, userId });
  }
}

export async function checkFolderAccess(folderId: number, userId: number): Promise<boolean> {
  if (IS_DEV_NO_DB) return !!_mockAccess.find((a: any) => a.folderId === folderId && a.userId === userId);
  const d = await db();
  const result = await d
    .select()
    .from(folderAccess)
    .where(and(eq(folderAccess.folderId, folderId), eq(folderAccess.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function getFolderAccessList(folderId: number): Promise<FolderAccess[]> {
  if (IS_DEV_NO_DB) return _mockAccess.filter((a: any) => a.folderId === folderId);
  const d = await db();
  return d.select().from(folderAccess).where(eq(folderAccess.folderId, folderId));
}

// ─── Evaluations ─────────────────────────────────────────────────────────────
export async function getEvaluationsByVideo(videoId: number): Promise<Evaluation[]> {
  if (IS_DEV_NO_DB) return _mockEvaluations.filter((e: any) => e.videoId === videoId);
  const d = await db();
  return d
    .select()
    .from(evaluations)
    .where(eq(evaluations.videoId, videoId))
    .orderBy(desc(evaluations.createdAt));
}

export async function getEvaluationByVideoAndUser(
  videoId: number,
  evaluatorId: number
): Promise<Evaluation | undefined> {
  if (IS_DEV_NO_DB) return _mockEvaluations.find((e: any) => e.videoId === videoId && e.evaluatorId === evaluatorId);
  const d = await db();
  const result = await d
    .select()
    .from(evaluations)
    .where(and(eq(evaluations.videoId, videoId), eq(evaluations.evaluatorId, evaluatorId)))
    .limit(1);
  return result[0];
}

export async function createEvaluation(data: {
  videoId: number;
  folderId: number;
  evaluatorId: number;
  criteriaScores: { criteriaId: number; score: number }[];
  totalScore: number;
  maxPossibleScore: number;
  entrustmentLevel?: number;
  feedback?: string;
  strengths?: string;
  improvements?: string;
  actionPlan?: string;
  isDraft?: boolean;
}): Promise<number> {
  if (IS_DEV_NO_DB) {
    const id = nextId();
    _mockEvaluations.push({ id, createdAt: now(), updatedAt: now(), feedback: null, strengths: null, improvements: null, actionPlan: null, isDraft: false, entrustmentLevel: null, ...data });
    return id;
  }
  const d = await db();
  const result = await d.insert(evaluations).values({
    ...data,
    criteriaScores: data.criteriaScores,
  });
  return Number((result as any)[0].insertId);
}

export async function getEvaluationsByFolder(folderId: number): Promise<Evaluation[]> {
  if (IS_DEV_NO_DB) return _mockEvaluations.filter((e: any) => e.folderId === folderId).sort((a: any, b: any) => b.createdAt - a.createdAt);
  const d = await db();
  return d
    .select()
    .from(evaluations)
    .where(eq(evaluations.folderId, folderId))
    .orderBy(desc(evaluations.createdAt));
}

export async function getEvaluationsByArea(area: string): Promise<Evaluation[]> {
  if (IS_DEV_NO_DB) return [];
  const d = await db();
  const areaFolders = await d
    .select()
    .from(folders)
    .where(eq(folders.area, area));
  if (areaFolders.length === 0) return [];
  const ids = areaFolders.map((f: typeof areaFolders[number]) => f.id);
  return d
    .select()
    .from(evaluations)
    .where(inArray(evaluations.folderId, ids));
}

export async function getEvaluationsByEvaluator(evaluatorId: number): Promise<Evaluation[]> {
  if (IS_DEV_NO_DB) return _mockEvaluations.filter((e: any) => e.evaluatorId === evaluatorId);
  const d = await db();
  return d
    .select()
    .from(evaluations)
    .where(eq(evaluations.evaluatorId, evaluatorId))
    .orderBy(desc(evaluations.createdAt));
}

// ─── Notifications ───────────────────────────────────────────────────────────
export async function createNotification(data: {
  userId: number;
  title: string;
  content: string;
  type?: string;
  relatedId?: number;
}): Promise<number> {
  if (IS_DEV_NO_DB) {
    const id = nextId();
    _mockNotifications.push({ id, isRead: false, createdAt: now(), type: null, relatedId: null, link: null, ...data });
    return id;
  }
  const d = await db();
  const result = await d.insert(notifications).values(data);
  return Number((result as any)[0].insertId);
}

export async function getNotificationsByUser(userId: number): Promise<Notification[]> {
  if (IS_DEV_NO_DB) return _mockNotifications.filter((n: any) => n.userId === userId).sort((a: any, b: any) => b.createdAt - a.createdAt);
  const d = await db();
  return d
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number): Promise<void> {
  if (IS_DEV_NO_DB) { const n = _mockNotifications.find((x: any) => x.id === id); if (n) n.isRead = true; return; }
  const d = await db();
  await d.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  if (IS_DEV_NO_DB) { _mockNotifications.filter((n: any) => n.userId === userId && !n.isRead).forEach((n: any) => n.isRead = true); return; }
  const d = await db();
  await d.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// ─── Milestone Backfill ─────────────────────────────────────────────────────
/**
 * Resolve the correct ACGME milestone for a criterion.
 * Priority: (1) exact text match from DEFAULT_CRITERIA, (2) fuzzy text match,
 * (3) item-text keyword heuristic (runs BEFORE domain heuristic so anatomy/safety
 *     keywords win regardless of which domain the item sits in),
 * (4) domain-name heuristic, (5) fallback to PC3.
 */
function resolveMilestoneForBackfill(
  procedureCode: string,
  itemText: string,
  domainText: string
): string {
  // 1. Exact match from DEFAULT_CRITERIA
  const exact = getMilestoneForCriterion(procedureCode, itemText);
  if (exact) return exact;

  // 2. Fuzzy match from DEFAULT_CRITERIA (substring containment)
  const defaultCriteria = getDefaultCriteria(procedureCode);
  const itemLower = itemText.toLowerCase().trim();
  for (const domain of defaultCriteria) {
    for (const item of domain.items) {
      if (typeof item !== "string") {
        const textLower = item.text.toLowerCase().trim();
        if (
          textLower === itemLower ||
          textLower.includes(itemLower) ||
          itemLower.includes(textLower)
        ) {
          return item.milestone;
        }
      }
    }
  }

  // 3. Item-text keyword heuristic (BEFORE domain heuristic)
  //    This ensures "Demonstra conhecimento da anatomia" → MK2 even if domain is "Preparação"
  const il = itemText.toLowerCase();
  // SBP1 keywords (highest priority for safety items)
  if (
    il.includes("timeout") || il.includes("segurança") || il.includes("checklist") ||
    il.includes("equipamento") || il.includes("hemostasia") || il.includes("verifica") ||
    il.includes("contagem") || il.includes("material de tela") || il.includes("documenta")
  ) return "SBP1";
  // Action verbs that indicate technical execution (PC3/SBP1), NOT knowledge
  // e.g. "Fecha planos anatômicos" is a technical action, not anatomy knowledge
  const isActionItem = il.startsWith("fecha") || il.startsWith("sutura") ||
    il.startsWith("recorta") || il.startsWith("realiza") || il.startsWith("controla") ||
    il.startsWith("disseca") || il.startsWith("reduz") || il.startsWith("fixa");
  // MK2 keywords — anatomy / identification / knowledge
  // Only assign MK2 if NOT an action item (action items go to domain heuristic instead)
  if (!isActionItem && (
    il.includes("anatomia") || il.includes("anatômic") ||
    il.includes("identifica") || il.includes("anomalia") ||
    il.includes("conhecimento") || il.includes("reconhec") ||
    il.includes("nervos") || il.includes("estrutura") ||
    il.includes("espaço retropúbico") || il.includes("transobturatório")
  )) return "MK2";

  // 4. Domain-name heuristic
  const dl = domainText.toLowerCase();
  if (dl.includes("preparação") || dl.includes("planejamento") || dl.includes("decisão")) return "PC2";
  if (
    dl.includes("acesso") || dl.includes("exposição") || dl.includes("dissecção") ||
    dl.includes("execução") || dl.includes("habilidade") || dl.includes("técnica") ||
    dl.includes("reparo") || dl.includes("redução") || dl.includes("incisão")
  ) return "PC3";
  if (dl.includes("anatomia") || dl.includes("conhecimento") || dl.includes("identificação")) return "MK2";
  if (
    dl.includes("segurança") || dl.includes("finalização") ||
    dl.includes("verificação") || dl.includes("checklist")
  ) return "SBP1";

  // 5. PC2 item keywords
  if (il.includes("planeja") || il.includes("posicion") || il.includes("decisão") || il.includes("indica")) return "PC2";

  // 6. Default
  return "PC3";
}

export async function backfillMilestones(): Promise<{ updated: number; total: number }> {
  if (IS_DEV_NO_DB) return { updated: 0, total: 0 };
  const d = await db();
  // Get ALL criteria (not just NULL) so we can also fix incorrectly assigned milestones
  const allCriteria = await d.select().from(topicCriteria);
  if (allCriteria.length === 0) return { updated: 0, total: 0 };

  const topicListCache: Record<number, TopicList | undefined> = {};
  let updated = 0;

  for (const criterion of allCriteria) {
    if (topicListCache[criterion.topicListId] === undefined) {
      topicListCache[criterion.topicListId] = await getTopicListById(criterion.topicListId);
    }
    const topicList = topicListCache[criterion.topicListId];
    if (!topicList) continue;

    const resolved = resolveMilestoneForBackfill(topicList.procedure, criterion.item, criterion.domain);

    if (resolved !== criterion.milestone) {
      await d
        .update(topicCriteria)
        .set({ milestone: resolved })
        .where(eq(topicCriteria.id, criterion.id));
      updated++;
    }
  }

  console.log(`[Backfill] Updated ${updated}/${allCriteria.length} criteria with milestones`);
  return { updated, total: allCriteria.length };
}

/**
 * Ajusta o schema do banco de dados em tempo de execução para suportar arquivos grandes.
 */
export async function syncSchema(): Promise<void> {
  if (IS_DEV_NO_DB) return;
  const d = await db();
  try {
    console.log("[Database] Verificando compatibilidade de tamanho de arquivo...");
    // Altera as colunas para BIGINT para suportar vídeos > 2GB (5.9GB no caso do Dr. Alê)
    await d.execute(sql`ALTER TABLE videos MODIFY COLUMN size_bytes BIGINT`);
    await d.execute(sql`ALTER TABLE videos MODIFY COLUMN duration_seconds BIGINT`);
    console.log("[Database] Colunas de tamanho atualizadas para BIGINT com sucesso.");
  } catch (err) {
    console.warn("[Database] Aviso ao sincronizar schema (pode ser que já esteja atualizado):", err);
  }
}
