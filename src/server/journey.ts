import { and, asc, eq, inArray, min, count } from "drizzle-orm";
import { db } from "@/db";
import {
  stages,
  missions,
  missionProgress,
  missionVariants,
  journeys,
  talentProfiles,
  financeEntries,
  clients,
  materials,
  opportunities,
  type AutoKey,
  type UnlockCondition,
} from "@/db/schema";
import { UserError } from "@/lib/errors";
import { awardBadgesForRule, recordActivity } from "./gamification";

export type MissionView = {
  id: string;
  key: string;
  stageNumber: number;
  order: number;
  title: string;
  mentor: string;
  minutes: number;
  points: number;
  objective: string;
  explanation: string;
  example: string;
  tools: string[];
  fields: (typeof missions.$inferSelect)["fields"];
  checklist: string[];
  autoKey: AutoKey | null;
  dependsOnKey: string | null;
  status: "todo" | "in_progress" | "paused" | "completed";
  answers: Record<string, string>;
  checks: boolean[];
  updatedAt: Date | null;
};

export type StageView = {
  number: number;
  title: string;
  mentor: string;
  description: string;
  unlockHint: string;
  status: "locked" | "open" | "done";
  missing: string[];
  missions: MissionView[];
  doneCount: number;
};

export type Facts = {
  profileComplete: boolean;
  opportunityChosen: boolean;
  opportunityId: string | null;
  firstSale: boolean;
  firstClient: boolean;
  firstMaterial: boolean;
  records30Days: boolean;
};

export async function getFacts(userId: string, now = new Date()): Promise<Facts> {
  const profile = await db.query.talentProfiles.findFirst({ where: eq(talentProfiles.userId, userId) });
  const journey = await db.query.journeys.findFirst({ where: eq(journeys.userId, userId) });
  const [{ sales }] = await db
    .select({ sales: count() })
    .from(financeEntries)
    .where(and(eq(financeEntries.userId, userId), eq(financeEntries.kind, "sale")));
  const [{ firstDate }] = await db
    .select({ firstDate: min(financeEntries.date) })
    .from(financeEntries)
    .where(eq(financeEntries.userId, userId));
  const [{ clientCount }] = await db.select({ clientCount: count() }).from(clients).where(eq(clients.userId, userId));
  const [{ matCount }] = await db.select({ matCount: count() }).from(materials).where(eq(materials.userId, userId));
  const records30Days = firstDate
    ? (now.getTime() - new Date(firstDate + "T12:00:00").getTime()) / 86_400_000 >= 30
    : false;
  return {
    profileComplete: !!profile?.completedAt,
    opportunityChosen: !!journey?.opportunityId,
    opportunityId: journey?.opportunityId ?? null,
    firstSale: sales > 0,
    firstClient: clientCount > 0,
    firstMaterial: matCount > 0,
    records30Days,
  };
}

const CONDITION_TEXT: Record<UnlockCondition, string> = {
  profile_complete: "terminar o questionário de talentos",
  opportunity_chosen: "escolher uma oportunidade",
  first_sale: "registrar a 1ª venda no Financeiro",
  records_30_days: "ter 30 dias de registros no Financeiro",
};

function conditionMet(c: UnlockCondition, f: Facts) {
  switch (c) {
    case "profile_complete":
      return f.profileComplete;
    case "opportunity_chosen":
      return f.opportunityChosen;
    case "first_sale":
      return f.firstSale;
    case "records_30_days":
      return f.records30Days;
  }
}

function autoMet(k: AutoKey, f: Facts) {
  switch (k) {
    case "profile_complete":
      return f.profileComplete;
    case "opportunity_chosen":
      return f.opportunityChosen;
    case "first_sale":
      return f.firstSale;
    case "first_client":
      return f.firstClient;
    case "first_material":
      return f.firstMaterial;
  }
}

/**
 * Missões automáticas são concluídas pelo sistema quando o fato acontece
 * (ex.: registrar a 1ª venda conclui "Registre sua primeira venda").
 */
export async function syncAutoMissions(userId: string, now = new Date()) {
  const facts = await getFacts(userId, now);
  const autos = await db.select().from(missions).where(eq(missions.status, "published"));
  const progress = await db.select().from(missionProgress).where(eq(missionProgress.userId, userId));
  const done = new Set(progress.filter((p) => p.status === "completed").map((p) => p.missionId));
  const results = [];
  for (const m of autos) {
    if (!m.autoKey || done.has(m.id) || !autoMet(m.autoKey, facts)) continue;
    results.push(await markCompleted(userId, m, {}, [], now));
  }
  return results;
}

export async function getJourney(userId: string, now = new Date()) {
  await syncAutoMissions(userId, now);
  const facts = await getFacts(userId, now);
  const stageRows = await db.select().from(stages).orderBy(asc(stages.number));
  const missionRows = await db
    .select()
    .from(missions)
    .where(eq(missions.status, "published"))
    .orderBy(asc(missions.stageNumber), asc(missions.order));
  const progress = await db.select().from(missionProgress).where(eq(missionProgress.userId, userId));
  const progressMap = new Map(progress.map((p) => [p.missionId, p]));
  const variants = facts.opportunityId
    ? await db.select().from(missionVariants).where(eq(missionVariants.opportunityId, facts.opportunityId))
    : [];
  const variantMap = new Map(variants.map((v) => [v.missionId, v]));

  const stageViews: StageView[] = [];
  const doneStages = new Set<number>();

  for (const s of stageRows) {
    const ms: MissionView[] = missionRows
      .filter((m) => m.stageNumber === s.number)
      .map((m) => {
        const p = progressMap.get(m.id);
        const v = variantMap.get(m.id);
        return {
          ...m,
          example: v?.example || m.example,
          tools: v?.tools.length ? v.tools : m.tools,
          status: p?.status ?? "todo",
          answers: p?.answers ?? {},
          checks: p?.checklist ?? [],
          updatedAt: p?.updatedAt ?? null,
        };
      });
    const doneCount = ms.filter((m) => m.status === "completed").length;
    const allDone = ms.length > 0 && doneCount === ms.length;
    if (allDone) doneStages.add(s.number);
    stageViews.push({
      number: s.number,
      title: s.title,
      mentor: s.mentor,
      description: s.description,
      unlockHint: s.unlockHint,
      status: allDone ? "done" : "open",
      missing: [],
      missions: ms,
      doneCount,
    });
  }

  // Desbloqueio: uma etapa só abre quando o que ela precisa está pronto.
  for (const sv of stageViews) {
    const def = stageRows.find((s) => s.number === sv.number)!;
    const missing: string[] = [];
    for (const n of def.unlockStages) {
      if (!doneStages.has(n)) missing.push(`concluir a etapa ${n} (${stageRows.find((x) => x.number === n)?.title ?? ""})`);
    }
    for (const c of def.unlockConditions) if (!conditionMet(c, facts)) missing.push(CONDITION_TEXT[c]);
    sv.missing = missing;
    // Etapas já concluídas continuam acessíveis (podem ser refeitas)
    if (missing.length && sv.status !== "done") sv.status = "locked";
  }

  const allMissions = stageViews.flatMap((s) => s.missions);
  const completed = allMissions.filter((m) => m.status === "completed").length;
  const current =
    stageViews.find((s) => s.status === "open") ?? stageViews.find((s) => s.status === "locked") ?? stageViews.at(-1)!;
  const nextMission =
    current?.missions.find((m) => m.status === "in_progress" || m.status === "paused") ??
    current?.missions.find((m) => m.status === "todo");
  const opportunity = facts.opportunityId
    ? await db.query.opportunities.findFirst({ where: eq(opportunities.id, facts.opportunityId) })
    : null;

  return {
    stages: stageViews,
    current,
    nextMission: nextMission ?? null,
    percent: allMissions.length ? Math.round((completed / allMissions.length) * 100) : 0,
    completedMissions: completed,
    totalMissions: allMissions.length,
    facts,
    opportunity,
  };
}

export async function getMissionForUser(userId: string, missionId: string) {
  const j = await getJourney(userId);
  for (const s of j.stages) {
    const m = s.missions.find((x) => x.id === missionId);
    if (m) return { mission: m, stage: s, journey: j };
  }
  return null;
}

function sanitizeAnswers(m: typeof missions.$inferSelect, answers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const f of m.fields) {
    const v = answers[f.key];
    if (typeof v === "string") out[f.key] = v.slice(0, 2000);
  }
  return out;
}

/** Salvamento automático a cada campo. Não altera pontos. */
export async function saveMissionDraft(
  userId: string,
  missionId: string,
  answers: Record<string, string>,
  checks: boolean[],
  pause = false,
) {
  const ctx = await getMissionForUser(userId, missionId);
  if (!ctx) throw new UserError("Missão não encontrada.");
  if (ctx.stage.status === "locked") throw new UserError("Esta etapa ainda está bloqueada.");
  const m = await db.query.missions.findFirst({ where: eq(missions.id, missionId) });
  const clean = sanitizeAnswers(m!, answers);
  const cleanChecks = m!.checklist.map((_, i) => !!checks[i]);
  const existing = await db.query.missionProgress.findFirst({
    where: and(eq(missionProgress.userId, userId), eq(missionProgress.missionId, missionId)),
  });
  const status = existing?.status === "completed" ? "completed" : pause ? "paused" : "in_progress";
  await db
    .insert(missionProgress)
    .values({ userId, missionId, status, answers: clean, checklist: cleanChecks, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [missionProgress.userId, missionProgress.missionId],
      set: { answers: clean, checklist: cleanChecks, status, updatedAt: new Date() },
    });
  return { status };
}

export function missingRequirements(
  m: Pick<typeof missions.$inferSelect, "fields" | "checklist">,
  answers: Record<string, string>,
  checks: boolean[],
) {
  const missing: string[] = [];
  for (const f of m.fields) if (f.required && !(answers[f.key] ?? "").trim()) missing.push(f.label);
  m.checklist.forEach((c, i) => {
    if (!checks[i]) missing.push(c);
  });
  return missing;
}

async function markCompleted(
  userId: string,
  m: typeof missions.$inferSelect,
  answers: Record<string, string>,
  checks: boolean[],
  now = new Date(),
) {
  const existing = await db.query.missionProgress.findFirst({
    where: and(eq(missionProgress.userId, userId), eq(missionProgress.missionId, m.id)),
  });
  // Pontos só na primeira conclusão. Editar uma missão antiga não tira nem dá pontos de novo.
  const firstTime = !existing || existing.pointsAwarded === 0;
  const points = firstTime ? m.points : 0;
  await db
    .insert(missionProgress)
    .values({
      userId,
      missionId: m.id,
      status: "completed",
      answers,
      checklist: checks,
      pointsAwarded: points,
      completedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [missionProgress.userId, missionProgress.missionId],
      set: {
        status: "completed",
        answers,
        checklist: checks,
        completedAt: existing?.completedAt ?? now,
        pointsAwarded: (existing?.pointsAwarded ?? 0) + points,
        updatedAt: now,
      },
    });

  const newBadges = [];
  let stageCompleted = false;
  if (firstTime) {
    await recordActivity(userId, "mission", m.title, points, now);
    newBadges.push(...(await awardBadgesForRule(userId, `mission:${m.key}`, now)));
    // Etapa completa?
    const stageMissions = await db
      .select({ id: missions.id })
      .from(missions)
      .where(and(eq(missions.stageNumber, m.stageNumber), eq(missions.status, "published")));
    const ids = stageMissions.map((x) => x.id);
    const doneRows = await db
      .select({ id: missionProgress.missionId })
      .from(missionProgress)
      .where(
        and(
          eq(missionProgress.userId, userId),
          eq(missionProgress.status, "completed"),
          inArray(missionProgress.missionId, ids),
        ),
      );
    if (doneRows.length === ids.length) {
      stageCompleted = true;
      const stage = await db.query.stages.findFirst({ where: eq(stages.number, m.stageNumber) });
      await recordActivity(userId, "stage", `Marco: etapa ${m.stageNumber} completa · ${stage?.title ?? ""}`, 100, now);
      newBadges.push(...(await awardBadgesForRule(userId, `stage:${m.stageNumber}`, now)));
    }
  }
  return { points, firstTime, stageCompleted, badges: newBadges, missionKey: m.key };
}

export async function completeMission(
  userId: string,
  missionId: string,
  answers: Record<string, string>,
  checks: boolean[],
  now = new Date(),
) {
  const ctx = await getMissionForUser(userId, missionId);
  if (!ctx) throw new UserError("Missão não encontrada.");
  if (ctx.stage.status === "locked")
    throw new UserError(`Esta etapa abre quando você ${ctx.stage.missing.join(" e ")}.`);
  const m = (await db.query.missions.findFirst({ where: eq(missions.id, missionId) }))!;
  if (m.autoKey) throw new UserError("Esta missão é concluída automaticamente quando você faz a ação indicada.");
  if (m.dependsOnKey) {
    const dep = ctx.stage.missions.find((x) => x.key === m.dependsOnKey) ??
      ctx.journey.stages.flatMap((s) => s.missions).find((x) => x.key === m.dependsOnKey);
    if (dep && dep.status !== "completed") throw new UserError(`Conclua antes a missão “${dep.title}”.`);
  }
  const clean = sanitizeAnswers(m, answers);
  const cleanChecks = m.checklist.map((_, i) => !!checks[i]);
  const missing = missingRequirements(m, clean, cleanChecks);
  if (missing.length) throw new UserError(`Falta completar: ${missing.join(", ")}.`);

  const result = await markCompleted(userId, m, clean, cleanChecks, now);
  const after = await getJourney(userId, now);
  const stage = after.stages.find((s) => s.number === m.stageNumber)!;
  const next = stage.missions.find((x) => x.status !== "completed") ?? after.nextMission;
  return {
    ...result,
    stageNumber: m.stageNumber,
    stageDone: stage.doneCount,
    stageTotal: stage.missions.length,
    next: next ? { id: next.id, title: next.title } : null,
  };
}

/** Respostas da jornada usadas pelos materiais de venda e pelo roteiro do contador. */
export async function journeyAnswers(userId: string) {
  const rows = await db
    .select({ key: missions.key, answers: missionProgress.answers })
    .from(missionProgress)
    .innerJoin(missions, eq(missions.id, missionProgress.missionId))
    .where(eq(missionProgress.userId, userId));
  const out: Record<string, Record<string, string>> = {};
  for (const r of rows) out[r.key] = r.answers;
  return out;
}
