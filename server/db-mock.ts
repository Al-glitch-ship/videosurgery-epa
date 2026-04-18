/**
 * Mock in-memory database for local development.
 * Activated automatically when DATABASE_URL is not set.
 */

import type { Folder, Video, FolderInvite, FolderAccess, Evaluation, TopicList, TopicCriteria, Notification, InsertUser, User } from "../drizzle/schema";

let _idCounter = 100;
const nextId = () => ++_idCounter;
const now = () => new Date();

// ─── In-memory stores ────────────────────────────────────────────────────────
const _users: User[] = [
  { id: 1, name: "Dr. Alê (Dev)", email: "ale@videosurgery.com", role: "admin", openId: "dev-1", loginMethod: null, lastSignedIn: now(), createdAt: now() } as User,
];
const _folders: Folder[] = [];
const _videos: Video[] = [];
const _invites: FolderInvite[] = [];
const _access: FolderAccess[] = [];
const _evaluations: Evaluation[] = [];
const _topicLists: TopicList[] = [];
const _topicCriteria: TopicCriteria[] = [];
const _notifications: Notification[] = [];

// ─── Users ──────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {}
export async function getUserByOpenId(openId: string) { return _users.find(u => u.openId === openId); }
export async function getUserById(id: number) { return _users.find(u => u.id === id); }
export async function getUserByEmail(email: string) { return _users.find(u => u.email === email); }

// ─── Topic Lists ─────────────────────────────────────────────────────────────
export async function getAllTopicLists(): Promise<TopicList[]> { return [..._topicLists]; }
export async function getTopicListById(id: number): Promise<TopicList | undefined> { return _topicLists.find(t => t.id === id); }
export async function getTopicListByAreaAndProcedure(area: string, procedure: string): Promise<TopicList | undefined> {
  return _topicLists.find(t => t.area === area && t.procedure === procedure && t.isActive);
}
export async function createTopicList(data: { name: string; description?: string; area: string; procedure: string; procedureName: string; createdBy: number }): Promise<number> {
  const id = nextId();
  _topicLists.push({ id, isActive: true, createdAt: now(), updatedAt: now(), ...data } as TopicList);
  return id;
}
export async function updateTopicList(id: number, data: { name?: string; description?: string; isActive?: boolean }): Promise<void> {
  const t = _topicLists.find(x => x.id === id);
  if (t) Object.assign(t, data);
}
export async function deleteTopicList(id: number): Promise<void> {
  const ti = _topicLists.findIndex(x => x.id === id);
  if (ti !== -1) _topicLists.splice(ti, 1);
  const toDelete = _topicCriteria.filter(c => c.topicListId === id).map(c => c.id);
  toDelete.forEach(cid => { const i = _topicCriteria.findIndex(x => x.id === cid); if (i !== -1) _topicCriteria.splice(i, 1); });
}

// ─── Topic Criteria ──────────────────────────────────────────────────────────
export async function getCriteriaByTopicList(topicListId: number): Promise<TopicCriteria[]> {
  return _topicCriteria.filter(c => c.topicListId === topicListId).sort((a, b) => a.domainOrder - b.domainOrder || a.itemOrder - b.itemOrder);
}
export async function replaceCriteria(topicListId: number, items: { domain: string; domainOrder: number; item: string; itemOrder: number; milestone?: string; description?: string }[]): Promise<void> {
  const existing = _topicCriteria.filter(c => c.topicListId === topicListId).map(c => c.id);
  existing.forEach(id => { const i = _topicCriteria.findIndex(x => x.id === id); if (i !== -1) _topicCriteria.splice(i, 1); });
  items.forEach(item => _topicCriteria.push({ id: nextId(), topicListId, milestone: null, description: null, ...item } as TopicCriteria));
}

// ─── Folders ─────────────────────────────────────────────────────────────────
export async function getFoldersByOwner(ownerId: number): Promise<Folder[]> {
  return _folders.filter(f => f.ownerId === ownerId && !f.isArchived).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export async function getSharedFolders(userId: number): Promise<Folder[]> {
  const ids = _access.filter(a => a.userId === userId).map(a => a.folderId);
  return _folders.filter(f => ids.includes(f.id) && !f.isArchived);
}
export async function getFolderById(id: number): Promise<Folder | undefined> { return _folders.find(f => f.id === id); }
export async function createFolder(data: { ownerId: number; name: string; description?: string; area: string; procedure: string; topicListId?: number; coverColor?: string }): Promise<number> {
  const id = nextId();
  _folders.push({ id, isArchived: false, createdAt: now(), updatedAt: now(), topicListId: null, description: null, coverColor: null, ...data } as Folder);
  return id;
}
export async function updateFolder(id: number, data: { name?: string; description?: string; topicListId?: number | null; coverColor?: string; isArchived?: boolean }): Promise<void> {
  const f = _folders.find(x => x.id === id);
  if (f) Object.assign(f, data);
}
export async function deleteFolder(id: number): Promise<void> {
  const i = _folders.findIndex(x => x.id === id);
  if (i !== -1) _folders.splice(i, 1);
}
export async function getFoldersByArea(area: string): Promise<Folder[]> { return _folders.filter(f => f.area === area); }
export async function getFoldersByProcedure(procedure: string): Promise<Folder[]> { return _folders.filter(f => f.procedure === procedure); }
export async function getFoldersByAreaAndProcedure(area: string, procedure: string): Promise<Folder[]> { return _folders.filter(f => f.area === area && f.procedure === procedure); }

// ─── Videos ──────────────────────────────────────────────────────────────────
export async function getVideosByFolder(folderId: number): Promise<Video[]> { return _videos.filter(v => v.folderId === folderId); }
export async function getVideoById(id: number): Promise<Video | undefined> { return _videos.find(v => v.id === id); }
export async function createVideo(data: { folderId: number; uploadedBy: number; title: string; description?: string; localPath?: string; mimeType?: string; sizeBytes?: number; durationSeconds?: number }): Promise<number> {
  const id = nextId();
  _videos.push({ id, createdAt: now(), updatedAt: now(), thumbnailUrl: null, s3Url: null, s3Key: null, description: null, localPath: null, mimeType: null, sizeBytes: null, durationSeconds: null, ...data } as Video);
  return id;
}
export async function updateVideo(id: number, data: { title?: string; description?: string; thumbnailUrl?: string; s3Url?: string; s3Key?: string }): Promise<void> {
  const v = _videos.find(x => x.id === id);
  if (v) Object.assign(v, data);
}
export async function deleteVideo(id: number): Promise<void> {
  const i = _videos.findIndex(x => x.id === id);
  if (i !== -1) _videos.splice(i, 1);
}

// ─── Invites ─────────────────────────────────────────────────────────────────
export async function getInvitesByFolder(folderId: number): Promise<FolderInvite[]> { return _invites.filter(i => i.folderId === folderId); }
export async function getPendingInvitesByEmail(email: string): Promise<FolderInvite[]> { return _invites.filter(i => i.inviteeEmail === email && i.status === "pending"); }
export async function getPendingInvitesByUser(userId: number): Promise<FolderInvite[]> { return _invites.filter(i => i.inviteeUserId === userId && i.status === "pending"); }
export async function getInviteByToken(token: string): Promise<FolderInvite | undefined> { return _invites.find(i => i.token === token); }
export async function createInvite(data: { folderId: number; invitedBy: number; inviteeEmail: string; token: string; message?: string; expiresAt?: Date }): Promise<number> {
  const id = nextId();
  _invites.push({ id, status: "pending", inviteeUserId: null, acceptedAt: null, emailSent: false, createdAt: now(), message: null, expiresAt: null, ...data } as FolderInvite);
  return id;
}
export async function updateInviteStatus(id: number, status: "pending" | "accepted" | "declined" | "revoked", extra?: { inviteeUserId?: number; acceptedAt?: Date; emailSent?: boolean }): Promise<void> {
  const inv = _invites.find(x => x.id === id);
  if (inv) Object.assign(inv, { status, ...extra });
}

// ─── Folder Access ───────────────────────────────────────────────────────────
export async function grantFolderAccess(folderId: number, userId: number): Promise<void> {
  const exists = _access.find(a => a.folderId === folderId && a.userId === userId);
  if (!exists) _access.push({ id: nextId(), folderId, userId, grantedAt: now() } as FolderAccess);
}
export async function checkFolderAccess(folderId: number, userId: number): Promise<boolean> {
  return !!_access.find(a => a.folderId === folderId && a.userId === userId);
}
export async function getFolderAccessList(folderId: number): Promise<FolderAccess[]> { return _access.filter(a => a.folderId === folderId); }

// ─── Evaluations ─────────────────────────────────────────────────────────────
export async function getEvaluationsByVideo(videoId: number): Promise<Evaluation[]> { return _evaluations.filter(e => e.videoId === videoId); }
export async function getEvaluationByVideoAndUser(videoId: number, evaluatorId: number): Promise<Evaluation | undefined> {
  return _evaluations.find(e => e.videoId === videoId && e.evaluatorId === evaluatorId);
}
export async function createEvaluation(data: { videoId: number; folderId: number; evaluatorId: number; criteriaScores: { criteriaId: number; score: number }[]; totalScore: number; maxPossibleScore: number; entrustmentLevel?: number; feedback?: string; strengths?: string; improvements?: string; actionPlan?: string; isDraft?: boolean }): Promise<number> {
  const id = nextId();
  _evaluations.push({ id, createdAt: now(), updatedAt: now(), feedback: null, strengths: null, improvements: null, actionPlan: null, isDraft: false, entrustmentLevel: null, ...data } as Evaluation);
  return id;
}
export async function getEvaluationsByFolder(folderId: number): Promise<Evaluation[]> { return _evaluations.filter(e => e.folderId === folderId); }
export async function getEvaluationsByArea(_area: string): Promise<Evaluation[]> { return []; }
export async function getEvaluationsByEvaluator(evaluatorId: number): Promise<Evaluation[]> { return _evaluations.filter(e => e.evaluatorId === evaluatorId); }

// ─── Notifications ───────────────────────────────────────────────────────────
export async function createNotification(data: { userId: number; title: string; content: string; type?: string; relatedId?: number }): Promise<number> {
  const id = nextId();
  _notifications.push({ id, isRead: false, createdAt: now(), type: null, relatedId: null, link: null, ...data } as Notification);
  return id;
}
export async function getNotificationsByUser(userId: number): Promise<Notification[]> {
  return _notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
export async function markNotificationAsRead(id: number): Promise<void> {
  const n = _notifications.find(x => x.id === id);
  if (n) n.isRead = true;
}
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  _notifications.filter(n => n.userId === userId && !n.isRead).forEach(n => n.isRead = true);
}

// ─── Milestone Backfill (no-op in mock) ──────────────────────────────────────
export async function backfillMilestones(): Promise<{ updated: number; total: number }> {
  return { updated: 0, total: 0 };
}
export async function getDb() { return null; }
