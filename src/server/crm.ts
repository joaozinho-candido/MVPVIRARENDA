import { and, asc, desc, eq, lte, isNotNull, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { clients, clientInteractions, type ClientStatus } from "@/db/schema";
import { UserError } from "@/lib/errors";
import { isoDay } from "@/lib/format";
import { awardBadgesForRule, recordActivity } from "./gamification";
import { syncAutoMissions } from "./journey";

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "novo", label: "Novo contato" },
  { value: "abordado", label: "Abordado" },
  { value: "interessado", label: "Interessado" },
  { value: "negociacao", label: "Em negociação" },
  { value: "conquistado", label: "Conquistado" },
  { value: "nao_avancou", label: "Não avançou" },
];
export const statusLabel = (s: ClientStatus) => CLIENT_STATUSES.find((x) => x.value === s)?.label ?? s;

const clientSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao cliente.").max(120),
  contactName: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  channel: z.string().trim().max(40).default("WhatsApp"),
  origin: z.string().trim().max(60).default(""),
  status: z.enum(["novo", "abordado", "interessado", "negociacao", "conquistado", "nao_avancou"]).default("novo"),
  firstContactAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(2000).default(""),
  nextAction: z.string().trim().max(200).default(""),
  nextActionAt: z.date().nullable().optional(),
  reminderOn: z.boolean().default(true),
});
export type ClientInput = z.input<typeof clientSchema>;

function parse(input: ClientInput) {
  const r = clientSchema.safeParse(input);
  if (!r.success) throw new UserError(r.error.issues[0].message);
  return r.data;
}

async function owned(userId: string, clientId: string) {
  const c = await db.query.clients.findFirst({ where: and(eq(clients.id, clientId), eq(clients.userId, userId)) });
  if (!c) throw new UserError("Cliente não encontrado.");
  return c;
}

export async function listClients(userId: string) {
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(asc(clients.nextActionAt), desc(clients.updatedAt));
}

export async function getClient(userId: string, clientId: string) {
  const c = await owned(userId, clientId);
  const history = await db
    .select()
    .from(clientInteractions)
    .where(eq(clientInteractions.clientId, clientId))
    .orderBy(desc(clientInteractions.createdAt), desc(clientInteractions.id));
  return { client: c, history };
}

export async function createClient(userId: string, input: ClientInput) {
  const data = parse(input);
  const [c] = await db.insert(clients).values({ ...data, userId, firstContactAt: data.firstContactAt ?? null }).returning();
  await db.insert(clientInteractions).values({ clientId: c.id, userId, note: "Cliente cadastrado" });
  await recordActivity(userId, "event", `Novo cliente: ${c.name}`);
  await awardBadgesForRule(userId, "first_client");
  await syncAutoMissions(userId);
  return c;
}

export async function updateClient(userId: string, clientId: string, input: ClientInput) {
  const before = await owned(userId, clientId);
  const data = parse(input);
  const [c] = await db
    .update(clients)
    .set({ ...data, firstContactAt: data.firstContactAt ?? null, updatedAt: new Date() })
    .where(eq(clients.id, clientId))
    .returning();
  if (before.status !== c.status)
    await db.insert(clientInteractions).values({ clientId, userId, note: `Status mudou para ${statusLabel(c.status)}` });
  return c;
}

export async function moveClient(userId: string, clientId: string, status: ClientStatus) {
  const before = await owned(userId, clientId);
  if (before.status === status) return before;
  if (!CLIENT_STATUSES.some((s) => s.value === status)) throw new UserError("Status inválido.");
  const [c] = await db.update(clients).set({ status, updatedAt: new Date() }).where(eq(clients.id, clientId)).returning();
  await db.insert(clientInteractions).values({ clientId, userId, note: `Status mudou para ${statusLabel(status)}` });
  if (status === "conquistado") await recordActivity(userId, "event", `Cliente conquistado: ${c.name}`, 20);
  return c;
}

export async function addInteraction(userId: string, clientId: string, note: string) {
  await owned(userId, clientId);
  const text = note.trim().slice(0, 1000);
  if (!text) throw new UserError("Escreva o que aconteceu.");
  await db.insert(clientInteractions).values({ clientId, userId, note: text });
  await db.update(clients).set({ updatedAt: new Date() }).where(eq(clients.id, clientId));
}

export async function completeNextAction(userId: string, clientId: string) {
  const c = await owned(userId, clientId);
  if (!c.nextAction) return;
  await db.insert(clientInteractions).values({ clientId, userId, note: `Feito: ${c.nextAction}` });
  await db.update(clients).set({ nextAction: "", nextActionAt: null, updatedAt: new Date() }).where(eq(clients.id, clientId));
}

export async function deleteClient(userId: string, clientId: string) {
  await owned(userId, clientId);
  await db.delete(clients).where(eq(clients.id, clientId));
}

/** Lembretes dentro da plataforma: próximas ações até o fim de hoje. Nenhuma mensagem é enviada automaticamente. */
export async function dueReminders(userId: string, now = new Date()) {
  // Fim do dia no horário de Brasília (sem horário de verão desde 2019)
  const endOfDay = new Date(`${isoDay(now)}T23:59:59.999-03:00`);
  return db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.userId, userId),
        eq(clients.reminderOn, true),
        isNotNull(clients.nextActionAt),
        lte(clients.nextActionAt, endOfDay),
      ),
    )
    .orderBy(asc(clients.nextActionAt));
}

export async function upcomingReminders(userId: string, now = new Date()) {
  return db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), isNotNull(clients.nextActionAt), gte(clients.nextActionAt, now)))
    .orderBy(asc(clients.nextActionAt))
    .limit(5);
}

export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
