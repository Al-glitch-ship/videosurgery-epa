import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Topic Lists (Admin-managed criteria sets per procedure) ─────────────────
export const topicLists = mysqlTable("topic_lists", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  area: varchar("area", { length: 64 }).notNull(),
  procedure: varchar("procedure_col", { length: 128 }).notNull(),
  procedureName: varchar("procedure_name", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TopicList = typeof topicLists.$inferSelect;

// ─── Topic Criteria (items inside a topic list, grouped by domain) ───────────
export const topicCriteria = mysqlTable("topic_criteria", {
  id: int("id").autoincrement().primaryKey(),
  topicListId: int("topic_list_id").notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  domainOrder: int("domain_order").default(0).notNull(),
  item: varchar("item", { length: 512 }).notNull(),
  itemOrder: int("item_order").default(0).notNull(),
  milestone: varchar("milestone", { length: 16 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TopicCriteria = typeof topicCriteria.$inferSelect;

// ─── Folders ─────────────────────────────────────────────────────────────────
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("owner_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  area: varchar("area", { length: 64 }).notNull(),
  procedure: varchar("procedure_col", { length: 128 }).notNull(),
  topicListId: int("topic_list_id"),
  coverColor: varchar("cover_color", { length: 32 }),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;

// ─── Videos ──────────────────────────────────────────────────────────────────
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  folderId: int("folder_id").notNull(),
  uploadedBy: int("uploaded_by").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  s3Key: varchar("s3_key", { length: 1024 }),
  s3Url: text("s3_url"),
  localPath: text("local_path"),
  mimeType: varchar("mime_type", { length: 128 }),
  sizeBytes: int("size_bytes"),
  durationSeconds: int("duration_seconds"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;

// ─── Folder Invites ───────────────────────────────────────────────────────────
export const folderInvites = mysqlTable("folder_invites", {
  id: int("id").autoincrement().primaryKey(),
  folderId: int("folder_id").notNull(),
  invitedBy: int("invited_by").notNull(),
  inviteeEmail: varchar("invitee_email", { length: 320 }),
  inviteeUserId: int("invitee_user_id"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "revoked"])
    .default("pending")
    .notNull(),
  message: text("message"),
  emailSent: boolean("email_sent").default(false).notNull(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FolderInvite = typeof folderInvites.$inferSelect;

// ─── Folder Access (resolved from accepted invites) ───────────────────────────
export const folderAccess = mysqlTable("folder_access", {
  id: int("id").autoincrement().primaryKey(),
  folderId: int("folder_id").notNull(),
  userId: int("user_id").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});

export type FolderAccess = typeof folderAccess.$inferSelect;

// ─── Evaluations ─────────────────────────────────────────────────────────────
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("video_id").notNull(),
  folderId: int("folder_id").notNull(),
  evaluatorId: int("evaluator_id").notNull(),
  criteriaScores: json("criteria_scores").notNull(),
  totalScore: int("total_score").default(0).notNull(),
  maxPossibleScore: int("max_possible_score").default(0).notNull(),
  entrustmentLevel: int("entrustment_level"),
  feedback: text("feedback"),
  strengths: text("strengths"),
  improvements: text("improvements"),
  actionPlan: text("action_plan"),
  isDraft: boolean("is_draft").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;

// ─── Notifications ───────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  type: varchar("type", { length: 64 }),
  relatedId: int("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
