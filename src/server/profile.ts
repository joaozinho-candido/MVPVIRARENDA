import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { talentProfiles, recommendations, opportunities, journeys, funnelEvents, type QuizAnswers } from "@/db/schema";
import { quizSchema } from "@/lib/quiz";
import { UserError } from "@/lib/errors";
import { rankOpportunities } from "./matching";
import { awardBadgesForRule, recordActivity } from "./gamification";
import { syncAutoMissions } from "./journey";

export function parseAnswers(input: unknown): QuizAnswers {
  const r = quizSchema.safeParse(input);
  if (!r.success) throw new UserError("Algumas respostas ficaram incompletas. Confira e tente de novo.");
  return r.data;
}

export async function getProfile(userId: string) {
  return db.query.talentProfiles.findFirst({ where: eq(talentProfiles.userId, userId) });
}

export async function saveTalentProfile(userId: string, input: unknown, now = new Date()) {
  const answers = parseAnswers(input);
  const existing = await getProfile(userId);
  await db
    .insert(talentProfiles)
    .values({ userId, answers, completedAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: talentProfiles.userId, set: { answers, completedAt: existing?.completedAt ?? now, updatedAt: now } });
  if (!existing) {
    await db.insert(funnelEvents).values({ kind: "quiz_completed" });
    await recordActivity(userId, "event", "Questionário de talentos respondido", 0, now);
    await awardBadgesForRule(userId, "profile_complete", now);
  }
  const recs = await recomputeRecommendations(userId, answers);
  await syncAutoMissions(userId, now);
  // Avisa se a oportunidade escolhida deixou de estar entre as 3 que mais combinam
  const journey = await db.query.journeys.findFirst({ where: eq(journeys.userId, userId) });
  const chosenStillFits = !journey?.opportunityId || recs.slice(0, 3).some((r) => r.opportunityId === journey.opportunityId);
  return { recommendations: recs, chosenStillFits };
}

export async function recomputeRecommendations(userId: string, answers: QuizAnswers) {
  const opps = await db.select().from(opportunities).where(eq(opportunities.status, "published"));
  const ranked = rankOpportunities(answers, opps);
  await db.delete(recommendations).where(eq(recommendations.userId, userId));
  const rows = ranked.map((r, i) => ({
    userId,
    opportunityId: r.opportunity.id,
    score: r.score,
    rank: i + 1,
    reasons: r.reasons,
    limits: r.limits,
  }));
  if (rows.length) await db.insert(recommendations).values(rows);
  return rows;
}

export async function getRecommendations(userId: string) {
  return db
    .select({ rec: recommendations, opp: opportunities })
    .from(recommendations)
    .innerJoin(opportunities, eq(opportunities.id, recommendations.opportunityId))
    .where(and(eq(recommendations.userId, userId), eq(opportunities.status, "published")))
    .orderBy(asc(recommendations.rank));
}

export async function chooseOpportunity(userId: string, opportunityId: string, now = new Date()) {
  const recs = await getRecommendations(userId);
  const top = recs.slice(0, 3);
  if (!top.some((r) => r.opp.id === opportunityId))
    throw new UserError("Escolha um dos 3 caminhos recomendados para você.");
  await db
    .insert(journeys)
    .values({ userId, opportunityId, chosenAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: journeys.userId, set: { opportunityId, chosenAt: now, updatedAt: now } });
  const opp = top.find((r) => r.opp.id === opportunityId)!.opp;
  await recordActivity(userId, "event", `Caminho escolhido: ${opp.title}`, 0, now);
  await awardBadgesForRule(userId, "opportunity_chosen", now);
  return syncAutoMissions(userId, now);
}
