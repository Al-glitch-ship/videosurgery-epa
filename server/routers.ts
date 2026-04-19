import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  checkFolderAccess,
  createEvaluation,
  createFolder,
  createInvite,
  createNotification,
  createTopicList,
  createVideo,
  deleteFolder,
  deleteTopicList,
  deleteVideo,
  getAllTopicLists,
  getCriteriaByTopicList,
  getEvaluationByVideoAndUser,
  getEvaluationsByFolder,
  getEvaluationsByVideo,
  getFolderAccessList,
  getFolderById,
  getFoldersByArea,
  getFoldersByAreaAndProcedure,
  getFoldersByProcedure,
  getFoldersByOwner,
  getInviteByToken,
  getInvitesByFolder,
  getNotificationsByUser,
  getPendingInvitesByEmail,
  getPendingInvitesByUser,
  getSharedFolders,
  getTopicListByAreaAndProcedure,
  getTopicListById,
  getUserByEmail,
  getUserById,
  getVideoById,
  getVideosByFolder,
  grantFolderAccess,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  replaceCriteria,
  updateFolder,
  updateInviteStatus,
  updateTopicList,
  updateVideo,
  backfillMilestones,
} from "./db";

import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getSignedStreamUrl } from "./gcs-storage";
import {
  AREA_LABELS,
  ENTRUSTMENT_LEVELS,
  getDefaultCriteria,
  PROCEDURES_BY_AREA,
  SCORE_LABELS,
  SURGICAL_AREAS,
  type SurgicalArea,
} from "@shared/surgical";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function assertFolderOwner(folderId: number, userId: number) {
  const folder = await getFolderById(folderId);
  if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Pasta não encontrada" });
  if (folder.ownerId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
  return folder;
}

async function assertFolderAccess(folderId: number, userId: number) {
  const folder = await getFolderById(folderId);
  if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Pasta não encontrada" });
  if (folder.ownerId === userId) return folder;
  const hasAccess = await checkFolderAccess(folderId, userId);
  if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
  return folder;
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ─── Auth ───────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Surgical Reference Data ──────────────────────────────────────────────
  surgical: router({
    areas: publicProcedure.query(() => {
      return SURGICAL_AREAS.map((code) => ({
        code,
        label: AREA_LABELS[code],
      }));
    }),

    procedures: publicProcedure
      .input(z.object({ area: z.string() }))
      .query(({ input }) => {
        const procs = PROCEDURES_BY_AREA[input.area as SurgicalArea] ?? [];
        return procs;
      }),

    defaultCriteria: publicProcedure
      .input(z.object({ procedure: z.string() }))
      .query(({ input }) => {
        return getDefaultCriteria(input.procedure);
      }),

    entrustmentLevels: publicProcedure.query(() => ENTRUSTMENT_LEVELS),
    scoreLabels: publicProcedure.query(() => SCORE_LABELS),
  }),

  // ─── Folders ───────────────────────────────────────────────────────────────
  folders: router({
    myFolders: protectedProcedure.query(async ({ ctx }) => {
      return getFoldersByOwner(ctx.user.id);
    }),

    sharedWithMe: protectedProcedure.query(async ({ ctx }) => {
      return getSharedFolders(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const folder = await assertFolderAccess(input.id, ctx.user.id);
        const topicList = folder.topicListId
          ? await getTopicListById(folder.topicListId)
          : null;
        const criteria = folder.topicListId
          ? await getCriteriaByTopicList(folder.topicListId)
          : [];
        const accessList = await getFolderAccessList(input.id);
        const accessUsers = await Promise.all(
          accessList.map(async (a) => {
            const u = await getUserById(a.userId);
            return { userId: a.userId, name: u?.name ?? "Usuário", email: u?.email ?? "" };
          })
        );
        return { folder, topicList, criteria, accessUsers };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          area: z.string(),
          procedure: z.string(),
          topicListId: z.number().optional(),
          coverColor: z.string().optional(),
          autoCreateCriteria: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { autoCreateCriteria, ...folderData } = input;

        let topicListId = input.topicListId;
        if (!topicListId && autoCreateCriteria !== false) {
          const existing = await getTopicListByAreaAndProcedure(input.area, input.procedure);
          if (existing) {
            topicListId = existing.id;
          } else {
            const areaLabel = AREA_LABELS[input.area as SurgicalArea] ?? input.area;
            const procs = PROCEDURES_BY_AREA[input.area as SurgicalArea] ?? [];
            const procInfo = procs.find((p) => p.code === input.procedure);
            const procName = procInfo?.name ?? input.procedure;

            const newListId = await createTopicList({
              name: `${procName} - ${areaLabel}`,
              description: `Critérios intraoperatórios para ${procName}`,
              area: input.area,
              procedure: input.procedure,
              procedureName: procName,
              createdBy: ctx.user.id,
            });

            const defaultCriteria = getDefaultCriteria(input.procedure);
            const items = defaultCriteria.flatMap((domain, di) =>
              domain.items.map((item, ii) => ({
                domain: domain.domain,
                domainOrder: di,
                item: typeof item === 'string' ? item : item.text,
                itemOrder: ii,
                milestone: typeof item === 'string' ? undefined : item.milestone,
              }))
            );
            await replaceCriteria(newListId, items);
            topicListId = newListId;
          }
        }

        const id = await createFolder({
          ...folderData,
          ownerId: ctx.user.id,
          topicListId,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          topicListId: z.number().nullable().optional(),
          coverColor: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await assertFolderOwner(id, ctx.user.id);
        await updateFolder(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await assertFolderOwner(input.id, ctx.user.id);
        await deleteFolder(input.id);
        return { success: true };
      }),

    archive: protectedProcedure
      .input(z.object({ id: z.number(), isArchived: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await assertFolderOwner(input.id, ctx.user.id);
        await updateFolder(input.id, { isArchived: input.isArchived });
        return { success: true };
      }),
  }),

  // ─── Videos ────────────────────────────────────────────────────────────────
  videos: router({
    list: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertFolderAccess(input.folderId, ctx.user.id);
        const videosList = await getVideosByFolder(input.folderId);
        
        // Em produção, gera URLs assinadas para todos os vídeos da lista
        return Promise.all(videosList.map(async (v) => {
          if (v.path && process.env.NODE_ENV === "production") {
            try {
              const signedUrl = await getSignedStreamUrl(v.path);
              return { ...v, url: signedUrl };
            } catch (err) {
              console.error(`Erro ao gerar URL para vídeo ${v.id}:`, err);
              return v;
            }
          }
          return v;
        }));
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const video = await getVideoById(input.id);
        if (!video) throw new TRPCError({ code: "NOT_FOUND" });
        await assertFolderAccess(video.folderId, ctx.user.id);
        const myEval = await getEvaluationByVideoAndUser(video.id, ctx.user.id);

        // Gera URL assinada para o vídeo específico
        if (video.path && process.env.NODE_ENV === "production") {
          try {
            const signedUrl = await getSignedStreamUrl(video.path);
            video.url = signedUrl;
          } catch (err) {
            console.error(`Erro ao gerar URL assinada:`, err);
          }
        }

        return { video, myEvaluation: myEval ?? null };
      }),

    create: protectedProcedure
      .input(
        z.object({
          folderId: z.number(),
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          localPath: z.string(),
          mimeType: z.string().optional(),
          sizeBytes: z.number().optional(),
          durationSeconds: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFolderAccess(input.folderId, ctx.user.id);
        const id = await createVideo({ ...input, uploadedBy: ctx.user.id });

        // Notify all users with access to this folder (except the uploader)
        const folder = await getFolderById(input.folderId);
        if (folder) {
          const accessList = await getFolderAccessList(input.folderId);
          const uploaderName = ctx.user.name ?? ctx.user.email ?? "Um usuário";
          const usersToNotify = new Set<number>();

          // Notify folder owner if they didn't upload
          if (folder.ownerId !== ctx.user.id) {
            usersToNotify.add(folder.ownerId);
          }
          // Notify all users with access (except uploader)
          accessList.forEach((a) => {
            if (a.userId !== ctx.user.id) usersToNotify.add(a.userId);
          });

          for (const userId of Array.from(usersToNotify)) {
            await createNotification({
              userId,
              title: `Novo vídeo: ${input.title}`,
              content: `${uploaderName} adicionou o vídeo "${input.title}" na pasta "${folder.name}". Acesse para avaliar.`,
              type: "new_video",
              relatedId: id,
            });
          }
        }

        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const video = await getVideoById(input.id);
        if (!video) throw new TRPCError({ code: "NOT_FOUND" });
        const folder = await getFolderById(video.folderId);
        if (!folder || folder.ownerId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateVideo(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const video = await getVideoById(input.id);
        if (!video) throw new TRPCError({ code: "NOT_FOUND" });
        const folder = await getFolderById(video.folderId);
        if (!folder || folder.ownerId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN" });
        await deleteVideo(input.id);
        return { success: true };
      }),
  }),

  // ─── Invites ───────────────────────────────────────────────────────────────
  invites: router({
    listForFolder: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ ctx, input }) => {
        await assertFolderOwner(input.folderId, ctx.user.id);
        const invites = await getInvitesByFolder(input.folderId);
        const enriched = await Promise.all(
          invites.map(async (inv) => {
            const invitee = inv.inviteeUserId ? await getUserById(inv.inviteeUserId) : null;
            return { ...inv, inviteeName: invitee?.name ?? inv.inviteeEmail };
          })
        );
        return enriched;
      }),

    myInvites: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const byUserId = await getPendingInvitesByUser(user.id);
      const byEmail = user.email ? await getPendingInvitesByEmail(user.email) : [];
      const combined = [...byUserId];
      for (const inv of byEmail) {
        if (!combined.find((i) => i.id === inv.id)) combined.push(inv);
      }
      const enriched = await Promise.all(
        combined.map(async (inv) => {
          const folder = await getFolderById(inv.folderId);
          const inviter = await getUserById(inv.invitedBy);
          return {
            ...inv,
            folderName: folder?.name ?? "Pasta",
            folderArea: folder?.area ?? "",
            folderProcedure: folder?.procedure ?? "",
            inviterName: inviter?.name ?? "Usuário",
          };
        })
      );
      return enriched;
    }),

    send: protectedProcedure
      .input(
        z.object({
          folderId: z.number(),
          email: z.string().email(),
          message: z.string().optional(),
          origin: z.string().url(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const folder = await assertFolderOwner(input.folderId, ctx.user.id);
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const inviteId = await createInvite({
          folderId: input.folderId,
          invitedBy: ctx.user.id,
          inviteeEmail: input.email,
          token,
          message: input.message,
          expiresAt,
        });

        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          await updateInviteStatus(inviteId, "pending", { inviteeUserId: existingUser.id });
          // Notify the invitee that they received an invite
          await createNotification({
            userId: existingUser.id,
            title: `Novo convite: ${folder.name}`,
            content: `${ctx.user.name ?? ctx.user.email ?? "Um usuário"} convidou você para avaliar vídeos na pasta "${folder.name}".`,
            type: "invite_received",
            relatedId: inviteId,
          });
        }

        await updateInviteStatus(inviteId, "pending", { emailSent: true });

        return { success: true, token };
      }),

    accept: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const invite = await getInviteByToken(input.token);
        if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado" });
        if (invite.status !== "pending")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite já utilizado" });
        if (invite.expiresAt && invite.expiresAt < new Date())
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convite expirado" });

        await updateInviteStatus(invite.id, "accepted", {
          inviteeUserId: ctx.user.id,
          acceptedAt: new Date(),
        });
        await grantFolderAccess(invite.folderId, ctx.user.id);

        const folder = await getFolderById(invite.folderId);
        if (folder) {
          await createNotification({
            userId: folder.ownerId,
            title: `Convite aceito: ${folder.name}`,
            content: `${ctx.user.name ?? ctx.user.email} aceitou seu convite para a pasta "${folder.name}".`,
            type: "invite_accepted",
            relatedId: invite.id,
          });
        }

        return { success: true, folderId: invite.folderId };
      }),

    decline: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const invite = await getInviteByToken(input.token);
        if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
        await updateInviteStatus(invite.id, "declined", { inviteeUserId: ctx.user.id });
        return { success: true };
      }),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invite = await getInviteByToken(input.token);
        if (!invite) throw new TRPCError({ code: "NOT_FOUND" });
        const folder = await getFolderById(invite.folderId);
        const inviter = await getUserById(invite.invitedBy);
        return {
          invite,
          folderName: folder?.name ?? "Pasta",
          inviterName: inviter?.name ?? "Usuário",
          folderArea: folder?.area ?? "",
          folderProcedure: folder?.procedure ?? "",
        };
      }),
  }),

  // ─── Evaluations ───────────────────────────────────────────────────────────
  evaluations: router({
    getForVideo: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const video = await getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: "NOT_FOUND" });
        await assertFolderAccess(video.folderId, ctx.user.id);
        const evals = await getEvaluationsByVideo(input.videoId);
        const enriched = await Promise.all(
          evals.map(async (e) => {
            const evaluator = await getUserById(e.evaluatorId);
            return { ...e, evaluatorName: evaluator?.name ?? "Usuário" };
          })
        );
        return enriched;
      }),

    submit: protectedProcedure
      .input(
        z.object({
          videoId: z.number(),
          folderId: z.number(),
          criteriaScores: z.array(
            z.object({ criteriaId: z.number(), score: z.number().min(1).max(5) })
          ),
          entrustmentLevel: z.number().min(1).max(5).optional(),
          feedback: z.string().optional(),
          strengths: z.string().optional(),
          improvements: z.string().optional(),
          actionPlan: z.string().optional(),
          isDraft: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const folder = await assertFolderAccess(input.folderId, ctx.user.id);
        if (folder.ownerId === ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "O dono não pode avaliar sua própria pasta" });

        const totalScore = input.criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
        const maxPossibleScore = input.criteriaScores.length * 5;

        const evalId = await createEvaluation({
          ...input,
          evaluatorId: ctx.user.id,
          totalScore,
          maxPossibleScore,
        });
        return { success: true, id: evalId };
      }),

    folderStats: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const folder = await assertFolderAccess(input.folderId, ctx.user.id);
        const evals = await getEvaluationsByFolder(input.folderId);
        const criteria = folder.topicListId
          ? await getCriteriaByTopicList(folder.topicListId)
          : [];

        type CritStat = { id: number; item: string; domain: string; avgScore: number; scores: number[] };
        const criteriaMap: Record<number, CritStat> = {};
        criteria.forEach((c) => {
          criteriaMap[c.id] = { id: c.id, item: c.item, domain: c.domain, avgScore: 0, scores: [] };
        });

        evals.forEach((e) => {
          const scores = (e.criteriaScores as { criteriaId: number; score: number }[]) ?? [];
          scores.forEach((s) => {
            if (criteriaMap[s.criteriaId]) {
              criteriaMap[s.criteriaId].scores.push(s.score);
            }
          });
        });

        Object.values(criteriaMap).forEach((c) => {
          c.avgScore = c.scores.length > 0
            ? Math.round((c.scores.reduce((a, b) => a + b, 0) / c.scores.length) * 10) / 10
            : 0;
        });

        const domains: Record<string, CritStat[]> = {};
        Object.values(criteriaMap).forEach((c) => {
          if (!domains[c.domain]) domains[c.domain] = [];
          domains[c.domain].push(c);
        });

        const entrustmentScores = evals
          .filter((e) => e.entrustmentLevel != null)
          .map((e) => e.entrustmentLevel as number);
        const avgEntrustment = entrustmentScores.length > 0
          ? Math.round((entrustmentScores.reduce((a, b) => a + b, 0) / entrustmentScores.length) * 10) / 10
          : 0;

        const overallScores = evals.map((e) =>
          e.maxPossibleScore > 0 ? (e.totalScore / e.maxPossibleScore) * 100 : 0
        );
        const avgOverall = overallScores.length > 0
          ? Math.round((overallScores.reduce((a, b) => a + b, 0) / overallScores.length) * 10) / 10
          : 0;

        return {
          totalEvaluations: evals.length,
          avgOverallPercentage: avgOverall,
          avgEntrustment,
          domains: Object.entries(domains).map(([name, items]) => ({
            domain: name,
            items: items.map(({ id, item, avgScore, scores }) => ({
              id, item, avgScore, totalResponses: scores.length,
            })),
            avgDomainScore: items.length > 0
              ? Math.round((items.reduce((a, b) => a + b.avgScore, 0) / items.length) * 10) / 10
              : 0,
          })),
        };
      }),

    areaStats: protectedProcedure
      .input(z.object({ area: z.string() }))
      .query(async ({ ctx, input }) => {
        const areaFolders = await getFoldersByArea(input.area);
        const accessible = await Promise.all(
          areaFolders.map(async (f) => {
            if (f.ownerId === ctx.user.id) return f;
            const has = await checkFolderAccess(f.id, ctx.user.id);
            return has ? f : null;
          })
        );
        const visible = accessible.filter(Boolean) as typeof areaFolders;

        const result = await Promise.all(
          visible.map(async (folder) => {
            const evals = await getEvaluationsByFolder(folder.id);
            const overallScores = evals.map((e) =>
              e.maxPossibleScore > 0 ? (e.totalScore / e.maxPossibleScore) * 100 : 0
            );
            const avgOverall = overallScores.length > 0
              ? Math.round((overallScores.reduce((a, b) => a + b, 0) / overallScores.length) * 10) / 10
              : 0;

            const entrustmentScores = evals
              .filter((e) => e.entrustmentLevel != null)
              .map((e) => e.entrustmentLevel as number);
            const avgEntrustment = entrustmentScores.length > 0
              ? Math.round((entrustmentScores.reduce((a, b) => a + b, 0) / entrustmentScores.length) * 10) / 10
              : 0;

            return {
              folderId: folder.id,
              folderName: folder.name,
              procedure: folder.procedure,
              totalEvaluations: evals.length,
              avgOverallPercentage: avgOverall,
              avgEntrustment,
            };
          })
        );
        return result;
      }),

    procedureStats: protectedProcedure
      .input(z.object({ area: z.string(), procedure: z.string() }))
      .query(async ({ ctx, input }) => {
        const procFolders = await getFoldersByAreaAndProcedure(input.area, input.procedure);
        const accessible = await Promise.all(
          procFolders.map(async (f) => {
            if (f.ownerId === ctx.user.id) return f;
            const has = await checkFolderAccess(f.id, ctx.user.id);
            return has ? f : null;
          })
        );
        const visible = accessible.filter(Boolean) as typeof procFolders;

        // Aggregate all evaluations across all folders of this procedure
        const allEvals: { eval: any; folder: typeof visible[0] }[] = [];
        for (const folder of visible) {
          const evals = await getEvaluationsByFolder(folder.id);
          evals.forEach((e) => allEvals.push({ eval: e, folder }));
        }

        // Criteria-level stats: aggregate across all evaluations
        // Find the topic list for this procedure to get criteria names
        const topicList = await getTopicListByAreaAndProcedure(input.area, input.procedure);
        const criteria = topicList ? await getCriteriaByTopicList(topicList.id) : [];

        type CritStat = { id: number; item: string; domain: string; avgScore: number; scores: number[] };
        const criteriaMap: Record<number, CritStat> = {};
        criteria.forEach((c) => {
          criteriaMap[c.id] = { id: c.id, item: c.item, domain: c.domain, avgScore: 0, scores: [] };
        });

        allEvals.forEach(({ eval: e }) => {
          const scores = (e.criteriaScores as { criteriaId: number; score: number }[]) ?? [];
          scores.forEach((s: { criteriaId: number; score: number }) => {
            if (criteriaMap[s.criteriaId]) {
              criteriaMap[s.criteriaId].scores.push(s.score);
            }
          });
        });

        Object.values(criteriaMap).forEach((c) => {
          c.avgScore = c.scores.length > 0
            ? Math.round((c.scores.reduce((a, b) => a + b, 0) / c.scores.length) * 10) / 10
            : 0;
        });

        const domains: Record<string, CritStat[]> = {};
        Object.values(criteriaMap).forEach((c) => {
          if (!domains[c.domain]) domains[c.domain] = [];
          domains[c.domain].push(c);
        });

        // Overall stats
        const totalEvaluations = allEvals.length;
        const overallScores = allEvals.map(({ eval: e }) =>
          e.maxPossibleScore > 0 ? (e.totalScore / e.maxPossibleScore) * 100 : 0
        );
        const avgOverall = overallScores.length > 0
          ? Math.round((overallScores.reduce((a: number, b: number) => a + b, 0) / overallScores.length) * 10) / 10
          : 0;

        const entrustmentScores = allEvals
          .filter(({ eval: e }) => e.entrustmentLevel != null)
          .map(({ eval: e }) => e.entrustmentLevel as number);
        const avgEntrustment = entrustmentScores.length > 0
          ? Math.round((entrustmentScores.reduce((a, b) => a + b, 0) / entrustmentScores.length) * 10) / 10
          : 0;

        // Per-folder breakdown
        const folderBreakdown = await Promise.all(
          visible.map(async (folder) => {
            const folderEvals = allEvals.filter(({ eval: e }) => e.folderId === folder.id);
            const fOverall = folderEvals.map(({ eval: e }) =>
              e.maxPossibleScore > 0 ? (e.totalScore / e.maxPossibleScore) * 100 : 0
            );
            const fAvg = fOverall.length > 0
              ? Math.round((fOverall.reduce((a, b) => a + b, 0) / fOverall.length) * 10) / 10
              : 0;
            const fEntrust = folderEvals
              .filter(({ eval: e }) => e.entrustmentLevel != null)
              .map(({ eval: e }) => e.entrustmentLevel as number);
            const fAvgEntrust = fEntrust.length > 0
              ? Math.round((fEntrust.reduce((a, b) => a + b, 0) / fEntrust.length) * 10) / 10
              : 0;
            return {
              folderId: folder.id,
              folderName: folder.name,
              totalEvaluations: folderEvals.length,
              avgOverallPercentage: fAvg,
              avgEntrustment: fAvgEntrust,
            };
          })
        );

        return {
          totalFolders: visible.length,
          totalEvaluations,
          avgOverallPercentage: avgOverall,
          avgEntrustment,
          domains: Object.entries(domains).map(([name, items]) => ({
            domain: name,
            items: items.map(({ id, item, avgScore, scores }) => ({
              id, item, avgScore, totalResponses: scores.length,
            })),
            avgDomainScore: items.length > 0
              ? Math.round((items.reduce((a, b) => a + b.avgScore, 0) / items.length) * 10) / 10
              : 0,
          })),
          folderBreakdown,
        };
      }),
  }),

  // ─── Topic Lists (Admin) ────────────────────────────────────────────────────
  topicLists: router({
    list: protectedProcedure.query(async () => {
      return getAllTopicLists();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const list = await getTopicListById(input.id);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        const criteria = await getCriteriaByTopicList(input.id);
        return { list, criteria };
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          area: z.string(),
          procedure: z.string(),
          procedureName: z.string(),
          criteria: z.array(
            z.object({
              domain: z.string(),
              domainOrder: z.number(),
              item: z.string(),
              itemOrder: z.number(),
              milestone: z.string().optional(),
              description: z.string().optional(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { criteria, ...listData } = input;
        const id = await createTopicList({ ...listData, createdBy: ctx.user.id });
        if (criteria?.length) {
          await replaceCriteria(id, criteria);
        }
        return { id };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
          criteria: z.array(
            z.object({
              domain: z.string(),
              domainOrder: z.number(),
              item: z.string(),
              itemOrder: z.number(),
              milestone: z.string().optional(),
              description: z.string().optional(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, criteria, ...data } = input;
        await updateTopicList(id, data);
        if (criteria !== undefined) {
          await replaceCriteria(id, criteria);
        }
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTopicList(input.id);
        return { success: true };
      }),

    backfillMilestones: adminProcedure
      .mutation(async () => {
        const result = await backfillMilestones();
        return result;
      }),

    generateFromDefaults: adminProcedure
      .input(z.object({ area: z.string(), procedure: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const areaLabel = AREA_LABELS[input.area as SurgicalArea] ?? input.area;
        const procs = PROCEDURES_BY_AREA[input.area as SurgicalArea] ?? [];
        const procInfo = procs.find((p) => p.code === input.procedure);
        const procName = procInfo?.name ?? input.procedure;

        const existing = await getTopicListByAreaAndProcedure(input.area, input.procedure);
        if (existing) return { id: existing.id, alreadyExists: true };

        const newListId = await createTopicList({
          name: `${procName} - ${areaLabel}`,
          description: `Critérios intraoperatórios padrão para ${procName}`,
          area: input.area,
          procedure: input.procedure,
          procedureName: procName,
          createdBy: ctx.user.id,
        });

        const defaultCriteria = getDefaultCriteria(input.procedure);
        const items = defaultCriteria.flatMap((domain, di) =>
          domain.items.map((item, ii) => ({
            domain: domain.domain,
            domainOrder: di,
            item: typeof item === 'string' ? item : item.text,
            itemOrder: ii,
            milestone: typeof item === 'string' ? undefined : item.milestone,
          }))
        );
        await replaceCriteria(newListId, items);
        return { id: newListId, alreadyExists: false };
      }),
  }),

  // ─── Notifications ───────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsByUser(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await markAllNotificationsAsRead(ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
