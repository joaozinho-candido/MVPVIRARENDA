import { and, eq, gt, lte, gte, isNull, or, asc } from "drizzle-orm";
import { db } from "@/db";
import { contents, contentProgress, recommendations, opportunities, type ContentCategory } from "@/db/schema";
import { UserError } from "@/lib/errors";
import { recordActivity } from "./gamification";

export const CATEGORIES: { value: ContentCategory; label: string }[] = [
  { value: "vendas", label: "Vendas" },
  { value: "preco", label: "Preço" },
  { value: "divulgacao", label: "Divulgação" },
  { value: "atendimento", label: "Atendimento" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "produtividade", label: "Produtividade" },
  { value: "clientes", label: "Clientes" },
  { value: "melhorias", label: "Melhorias" },
];

/**
 * Feed personalizado pela etapa e pela oportunidade escolhida.
 * Não-lidos primeiro; lidos descem para o fim e não se repetem no topo.
 */
export async function getFeed(userId: string, stage: number, opportunityId: string | null, category?: string) {
  const rows = await db
    .select({ c: contents, p: contentProgress })
    .from(contents)
    .leftJoin(contentProgress, and(eq(contentProgress.contentId, contents.id), eq(contentProgress.userId, userId)))
    .where(
      and(
        eq(contents.status, "published"),
        lte(contents.minStage, stage),
        gte(contents.maxStage, stage),
        opportunityId ? or(isNull(contents.opportunityId), eq(contents.opportunityId, opportunityId)) : isNull(contents.opportunityId),
      ),
    );
  const filtered = category ? rows.filter((r) => r.c.category === category) : rows;
  const items = filtered
    .map((r) => ({ ...r.c, read: !!r.p?.readAt, count: r.p?.count ?? 0, completed: !!r.p?.completedAt, specific: !!r.c.opportunityId }))
    .sort((a, b) => Number(a.read || a.completed) - Number(b.read || b.completed) || Number(b.specific) - Number(a.specific));
  const challenge = items.find((i) => i.kind === "challenge" && !i.completed) ?? null;
  const articles = items.filter((i) => i.kind === "article");

  // Nova oportunidade: a próxima da lista de compatibilidade que não foi escolhida
  const suggestion = await db
    .select({ opp: opportunities, score: recommendations.score })
    .from(recommendations)
    .innerJoin(opportunities, eq(opportunities.id, recommendations.opportunityId))
    .where(and(eq(recommendations.userId, userId), gt(recommendations.rank, 3), eq(opportunities.status, "published")))
    .orderBy(asc(recommendations.rank))
    .limit(1);

  return { challenge, articles, suggestion: suggestion[0] ?? null };
}

export async function getContent(slug: string) {
  return db.query.contents.findFirst({ where: and(eq(contents.slug, slug), eq(contents.status, "published")) });
}

export async function markRead(userId: string, contentId: string) {
  await db
    .insert(contentProgress)
    .values({ userId, contentId, readAt: new Date() })
    .onConflictDoUpdate({ target: [contentProgress.userId, contentProgress.contentId], set: { readAt: new Date() } });
}

export async function advanceChallenge(userId: string, contentId: string) {
  const c = await db.query.contents.findFirst({ where: and(eq(contents.id, contentId), eq(contents.kind, "challenge")) });
  if (!c) throw new UserError("Desafio não encontrado.");
  const p = await db.query.contentProgress.findFirst({
    where: and(eq(contentProgress.userId, userId), eq(contentProgress.contentId, contentId)),
  });
  if (p?.completedAt) return { count: p.count, completed: true, points: 0 };
  const count = Math.min(c.challengeGoal, (p?.count ?? 0) + 1);
  const completed = count >= c.challengeGoal;
  await db
    .insert(contentProgress)
    .values({ userId, contentId, count, readAt: new Date(), completedAt: completed ? new Date() : null })
    .onConflictDoUpdate({
      target: [contentProgress.userId, contentProgress.contentId],
      set: { count, completedAt: completed ? new Date() : null },
    });
  if (completed) await recordActivity(userId, "challenge", `Desafio concluído: ${c.title}`, c.challengePoints);
  return { count, completed, points: completed ? c.challengePoints : 0 };
}
