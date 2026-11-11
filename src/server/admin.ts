import { and, count, desc, eq, gte, ilike, inArray, isNotNull, lt, or, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  subscriptions,
  payments,
  privacyRequests,
  legalContents,
  funnelEvents,
  missionProgress,
  missions,
  materials,
  clients,
  financeEntries,
  contentProgress,
  talentProfiles,
  journeys,
  opportunities,
  webhookEvents,
  plans,
  activityLog,
  type Role,
} from "@/db/schema";
import { autoOutdate } from "./legal";

function monthStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function overview(now = new Date()) {
  await autoOutdate(now);
  const start = monthStart(now);
  const [{ active }] = await db.select({ active: count() }).from(subscriptions).where(inArray(subscriptions.status, ["active", "past_due"]));
  const [{ firstMonth }] = await db
    .select({ firstMonth: count() })
    .from(subscriptions)
    .where(and(inArray(subscriptions.status, ["active", "past_due"]), eq(subscriptions.periodsPaid, 1)));
  const [{ reached }] = await db
    .select({ reached: count() })
    .from(subscriptions)
    .where(or(sql`${subscriptions.periodsPaid} >= 2`, and(eq(subscriptions.periodsPaid, 1), lt(subscriptions.currentPeriodEnd, now))));
  const [{ paid2 }] = await db.select({ paid2: count() }).from(subscriptions).where(sql`${subscriptions.periodsPaid} >= 2`);
  const [{ revenue }] = await db
    .select({ revenue: sum(payments.amountCents) })
    .from(payments)
    .where(and(eq(payments.status, "approved"), gte(payments.confirmedAt, start)));

  const [{ quiz }] = await db.select({ quiz: count() }).from(funnelEvents).where(and(eq(funnelEvents.kind, "quiz_completed"), gte(funnelEvents.createdAt, start)));
  const [{ accounts }] = await db.select({ accounts: count() }).from(users).where(and(gte(users.createdAt, start), eq(users.role, "user")));
  const [{ checkouts }] = await db.select({ checkouts: count() }).from(subscriptions).where(gte(subscriptions.createdAt, start));
  const [{ paid }] = await db
    .select({ paid: count() })
    .from(subscriptions)
    .where(and(gte(subscriptions.createdAt, start), sql`${subscriptions.periodsPaid} >= 1`));

  const [{ pixPending }] = await db.select({ pixPending: count() }).from(payments).where(and(eq(payments.status, "pending"), eq(payments.method, "pix")));
  const [{ failed }] = await db.select({ failed: count() }).from(subscriptions).where(eq(subscriptions.status, "past_due"));
  const [{ lgpd }] = await db.select({ lgpd: count() }).from(privacyRequests).where(eq(privacyRequests.status, "open"));
  const [{ outdated }] = await db.select({ outdated: count() }).from(legalContents).where(eq(legalContents.status, "outdated"));

  return {
    active,
    firstMonth,
    paidSecondPct: reached ? Math.round((paid2 / reached) * 100) : null,
    revenueCents: Number(revenue ?? 0),
    funnel: [
      { label: "Questionários completos", value: quiz },
      { label: "Contas criadas", value: accounts },
      { label: "Checkouts iniciados", value: checkouts },
      { label: "Pagaram o 1º mês", value: paid },
    ],
    attention: { pixPending, failed, lgpd, outdated },
  };
}

export async function listPayments(filter: string, q: string) {
  const conds = [];
  if (filter === "first") conds.push(eq(payments.periodNumber, 1));
  if (filter === "renewal") conds.push(sql`${payments.periodNumber} > 1`);
  if (filter === "failed") conds.push(inArray(payments.status, ["refused", "expired"]));
  if (filter === "refunded") conds.push(eq(payments.status, "refunded"));
  if (q) conds.push(or(ilike(payments.customerName, `%${q}%`), ilike(users.email, `%${q}%`)));
  return db
    .select({ p: payments, email: users.email, subStatus: subscriptions.status, cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd })
    .from(payments)
    .leftJoin(users, eq(users.id, payments.userId))
    .innerJoin(subscriptions, eq(subscriptions.id, payments.subscriptionId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(200);
}

export async function paymentEvents(gatewayPaymentId: string) {
  return db.select().from(webhookEvents).where(eq(webhookEvents.gatewayPaymentId, gatewayPaymentId)).orderBy(desc(webhookEvents.receivedAt));
}

export async function listUsers(q: string, role?: string) {
  const conds = [];
  if (q) conds.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)));
  if (role) conds.push(eq(users.role, role as Role));
  const rows = await db
    .select({ u: users })
    .from(users)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);
  const subs = await db.select().from(subscriptions).where(isNotNull(subscriptions.userId)).orderBy(desc(subscriptions.createdAt));
  return rows.map(({ u }) => ({ ...u, sub: subs.find((s) => s.userId === u.id) ?? null }));
}

/** Detalhe do assinante: só números de uso. O admin não lê clientes nem textos da pessoa. */
export async function subscriberDetail(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;
  const subs = await db
    .select({ s: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
  const pays = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  const [{ missionsDone }] = await db
    .select({ missionsDone: count() })
    .from(missionProgress)
    .where(and(eq(missionProgress.userId, userId), eq(missionProgress.status, "completed")));
  const [{ maxStage }] = await db
    .select({ maxStage: sql<number>`coalesce(max(${missions.stageNumber}), 0)` })
    .from(missionProgress)
    .innerJoin(missions, eq(missions.id, missionProgress.missionId))
    .where(and(eq(missionProgress.userId, userId), eq(missionProgress.status, "completed")));
  const [{ mats }] = await db.select({ mats: count() }).from(materials).where(eq(materials.userId, userId));
  const [{ cls }] = await db.select({ cls: count() }).from(clients).where(eq(clients.userId, userId));
  const [{ fin }] = await db.select({ fin: count() }).from(financeEntries).where(eq(financeEntries.userId, userId));
  return {
    user,
    subs,
    payments: pays,
    usage: { stage: Number(maxStage), missionsDone, materials: mats, clients: cls, financeEntries: fin, lastSeenAt: user.lastSeenAt },
  };
}

export async function usageIndicators(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [{ active7 }] = await db.select({ active7: count() }).from(users).where(gte(users.lastSeenAt, weekAgo));
  const [{ total }] = await db.select({ total: count() }).from(users).where(eq(users.role, "user"));
  const [{ profiles }] = await db.select({ profiles: count() }).from(talentProfiles).where(isNotNull(talentProfiles.completedAt));
  const [{ chosen }] = await db.select({ chosen: count() }).from(journeys).where(isNotNull(journeys.opportunityId));
  const byStage = await db
    .select({ stage: missions.stageNumber, done: count() })
    .from(missionProgress)
    .innerJoin(missions, eq(missions.id, missionProgress.missionId))
    .where(eq(missionProgress.status, "completed"))
    .groupBy(missions.stageNumber)
    .orderBy(missions.stageNumber);
  const byOpportunity = await db
    .select({ title: opportunities.title, n: count() })
    .from(journeys)
    .innerJoin(opportunities, eq(opportunities.id, journeys.opportunityId))
    .groupBy(opportunities.title)
    .orderBy(desc(count()));
  const [{ mats }] = await db.select({ mats: count() }).from(materials);
  const [{ cls }] = await db.select({ cls: count() }).from(clients);
  const [{ fin }] = await db.select({ fin: count() }).from(financeEntries);
  const [{ reads }] = await db.select({ reads: count() }).from(contentProgress).where(isNotNull(contentProgress.readAt));
  const [{ acts }] = await db.select({ acts: count() }).from(activityLog).where(gte(activityLog.createdAt, weekAgo));
  return { active7, total, profiles, chosen, byStage, byOpportunity, materials: mats, clients: cls, finance: fin, reads, activities7: acts };
}

export async function listPrivacyRequests() {
  return db.select().from(privacyRequests).orderBy(desc(privacyRequests.createdAt)).limit(100);
}
