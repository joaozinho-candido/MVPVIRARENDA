import { and, desc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { financeEntries, clients } from "@/db/schema";
import { UserError } from "@/lib/errors";
import { isoDay } from "@/lib/format";
import { awardBadgesForRule, recordActivity } from "./gamification";
import { syncAutoMissions } from "./journey";

const entrySchema = z.object({
  kind: z.enum(["sale", "cost", "expense"]),
  description: z.string().trim().min(1, "Descreva o lançamento.").max(160),
  amountCents: z.number().int().positive("Informe um valor maior que zero.").max(100_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  received: z.boolean().default(true),
  clientId: z.string().uuid().nullable().optional(),
});
export type EntryInput = z.input<typeof entrySchema>;

export async function addEntry(userId: string, input: EntryInput) {
  const r = entrySchema.safeParse(input);
  if (!r.success) throw new UserError(r.error.issues[0].message);
  const data = r.data;
  if (data.clientId) {
    const c = await db.query.clients.findFirst({ where: and(eq(clients.id, data.clientId), eq(clients.userId, userId)) });
    if (!c) throw new UserError("Cliente não encontrado.");
  }
  const received = data.kind === "sale" ? data.received : true;
  const [entry] = await db
    .insert(financeEntries)
    .values({ ...data, userId, received, receivedAt: received ? data.date : null, clientId: data.clientId ?? null })
    .returning();
  if (data.kind === "sale") {
    await recordActivity(userId, "event", `Venda registrada: ${data.description}`, 10);
    await awardBadgesForRule(userId, "first_sale");
    // "Ainda não" vira "a receber" e entra no lembrete do cliente
    if (!received && data.clientId) {
      await db
        .update(clients)
        .set({ nextAction: `Receber ${(data.amountCents / 100).toFixed(2).replace(".", ",")} · ${data.description}`, nextActionAt: new Date(), reminderOn: true })
        .where(eq(clients.id, data.clientId));
    }
  }
  await syncAutoMissions(userId);
  return entry;
}

export async function markReceived(userId: string, entryId: string, now = new Date()) {
  const e = await db.query.financeEntries.findFirst({ where: and(eq(financeEntries.id, entryId), eq(financeEntries.userId, userId)) });
  if (!e) throw new UserError("Lançamento não encontrado.");
  await db.update(financeEntries).set({ received: true, receivedAt: isoDay(now) }).where(eq(financeEntries.id, entryId));
}

export async function deleteEntry(userId: string, entryId: string) {
  await db.delete(financeEntries).where(and(eq(financeEntries.id, entryId), eq(financeEntries.userId, userId)));
}

export type MonthSummary = {
  month: string; // AAAA-MM
  billed: number; // faturamento: tudo vendido, recebido ou não
  received: number; // receita: dinheiro que já entrou
  costs: number; // custos + despesas
  profit: number; // lucro estimado = recebido − custos
  toReceive: number;
};

/** Faturamento, receita e lucro: três números, nunca misturados. Função pura. */
export function summarize(entries: { kind: string; amountCents: number; received: boolean; date: string }[], month: string): MonthSummary {
  const inMonth = entries.filter((e) => e.date.startsWith(month));
  const sales = inMonth.filter((e) => e.kind === "sale");
  const billed = sales.reduce((s, e) => s + e.amountCents, 0);
  const received = sales.filter((e) => e.received).reduce((s, e) => s + e.amountCents, 0);
  const costs = inMonth.filter((e) => e.kind !== "sale").reduce((s, e) => s + e.amountCents, 0);
  return { month, billed, received, costs, profit: received - costs, toReceive: billed - received };
}

export async function financeOverview(userId: string, now = new Date()) {
  const start = new Date(now);
  start.setMonth(start.getMonth() - 5, 1);
  const from = isoDay(start).slice(0, 7) + "-01";
  const entries = await db
    .select({ entry: financeEntries, clientName: clients.name })
    .from(financeEntries)
    .leftJoin(clients, eq(clients.id, financeEntries.clientId))
    .where(and(eq(financeEntries.userId, userId), gte(financeEntries.date, from)))
    .orderBy(desc(financeEntries.date), desc(financeEntries.createdAt));
  const flat = entries.map((e) => e.entry);
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i, 15);
    months.push(isoDay(d).slice(0, 7));
  }
  const currentMonth = isoDay(now).slice(0, 7);
  return {
    current: summarize(flat, currentMonth),
    history: months.map((m) => summarize(flat, m)),
    entries: entries.filter((e) => e.entry.date.startsWith(currentMonth) || !e.entry.received).slice(0, 50),
    pending: entries.filter((e) => e.entry.kind === "sale" && !e.entry.received),
  };
}

export async function entriesBefore(userId: string, date: string) {
  return db.select().from(financeEntries).where(and(eq(financeEntries.userId, userId), lt(financeEntries.date, date)));
}
