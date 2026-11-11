import { and, desc, eq, sql, sum, countDistinct } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, badges, userBadges } from "@/db/schema";
import { isoDay } from "@/lib/format";

export async function recordActivity(
  userId: string,
  kind: "mission" | "stage" | "badge" | "challenge" | "event",
  title: string,
  points = 0,
  now = new Date(),
) {
  await db.insert(activityLog).values({ userId, kind, title, points, day: isoDay(now), createdAt: now });
}

/** Concede os selos cuja regra bate e que a pessoa ainda não tem. Retorna os novos selos. */
export async function awardBadgesForRule(userId: string, rule: string, now = new Date()) {
  const candidates = await db.select().from(badges).where(and(eq(badges.rule, rule), eq(badges.active, true)));
  const awarded: { key: string; name: string; emoji: string; points: number }[] = [];
  for (const b of candidates) {
    const inserted = await db
      .insert(userBadges)
      .values({ userId, badgeKey: b.key, awardedAt: now })
      .onConflictDoNothing()
      .returning();
    if (inserted.length) {
      await recordActivity(userId, "badge", `Conquista: ${b.name}`, b.points, now);
      awarded.push({ key: b.key, name: b.name, emoji: b.emoji, points: b.points });
    }
  }
  return awarded;
}

export async function getStats(userId: string) {
  const [{ points }] = await db
    .select({ points: sum(activityLog.points) })
    .from(activityLog)
    .where(eq(activityLog.userId, userId));
  const [{ days }] = await db
    .select({ days: countDistinct(activityLog.day) })
    .from(activityLog)
    .where(eq(activityLog.userId, userId));
  const owned = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  return { points: Number(points ?? 0), activeDays: Number(days ?? 0), badgeCount: owned.length };
}

/** Dias ativos nos últimos 7 dias (mostrado como "🔥 N dias de atividade", sem exigir sequência). */
export async function recentActiveDays(userId: string, now = new Date()) {
  const since = isoDay(new Date(now.getTime() - 6 * 86_400_000));
  const [{ days }] = await db
    .select({ days: countDistinct(activityLog.day) })
    .from(activityLog)
    .where(and(eq(activityLog.userId, userId), sql`${activityLog.day} >= ${since}`));
  return Number(days ?? 0);
}

export async function getBadgeBoard(userId: string) {
  const all = await db.select().from(badges).where(eq(badges.active, true)).orderBy(badges.sortOrder);
  const owned = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const ownedMap = new Map(owned.map((o) => [o.badgeKey, o.awardedAt]));
  return all.map((b) => ({ ...b, awardedAt: ownedMap.get(b.key) ?? null }));
}

export async function getHistory(userId: string, limit = 30) {
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
    .limit(limit);
}

export function phaseFor(stageNumber: number) {
  if (stageNumber <= 2) return "Descobrindo";
  if (stageNumber <= 8) return "Construindo";
  if (stageNumber <= 12) return "Começando a vender";
  return "Crescendo";
}
