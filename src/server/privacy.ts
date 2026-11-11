import bcrypt from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  consents,
  privacyRequests,
  talentProfiles,
  journeys,
  missionProgress,
  missions,
  materials,
  clients,
  clientInteractions,
  financeEntries,
  payments,
  subscriptions,
  activityLog,
  userBadges,
  contentProgress,
  type ConsentKind,
} from "@/db/schema";
import { UserError } from "@/lib/errors";
import { config } from "@/lib/config";
import { maskEmail, firstName } from "@/lib/format";
import { sendEmail, footer } from "./email";

export async function latestConsents(userId: string) {
  const rows = await db.select().from(consents).where(eq(consents.userId, userId)).orderBy(desc(consents.createdAt), desc(consents.id));
  const map = new Map<ConsentKind, typeof consents.$inferSelect>();
  for (const r of rows) if (!map.has(r.kind)) map.set(r.kind, r);
  return map;
}

export async function setConsent(userId: string, kind: ConsentKind, granted: boolean) {
  if (kind === "terms" || kind === "privacy") throw new UserError("Termos e Privacidade são obrigatórios para usar a conta.");
  // Cada aceite fica salvo com data e versão do documento (histórico, não sobrescreve)
  await db.insert(consents).values({ userId, kind, granted, version: config.legalVersions.privacy });
}

/** Direito de acesso/portabilidade (LGPD art. 18): todos os dados da pessoa em JSON. */
export async function exportUserData(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UserError("Conta não encontrada.");
  const data = {
    geradoEm: new Date().toISOString(),
    conta: { nome: user.name, email: user.email, criadaEm: user.createdAt, emailConfirmadoEm: user.emailVerifiedAt, preferencias: user.prefs },
    consentimentos: await db.select().from(consents).where(eq(consents.userId, userId)),
    perfilDeTalentos: await db.query.talentProfiles.findFirst({ where: eq(talentProfiles.userId, userId) }),
    jornada: await db.query.journeys.findFirst({ where: eq(journeys.userId, userId) }),
    missoes: await db
      .select({ missao: missions.title, status: missionProgress.status, respostas: missionProgress.answers, concluidaEm: missionProgress.completedAt })
      .from(missionProgress)
      .innerJoin(missions, eq(missions.id, missionProgress.missionId))
      .where(eq(missionProgress.userId, userId)),
    materiais: await db.select().from(materials).where(eq(materials.userId, userId)),
    clientes: await db.select().from(clients).where(eq(clients.userId, userId)),
    historicoDeClientes: await db.select().from(clientInteractions).where(eq(clientInteractions.userId, userId)),
    financeiro: await db.select().from(financeEntries).where(eq(financeEntries.userId, userId)),
    assinaturas: await db
      .select({ status: subscriptions.status, inicio: subscriptions.createdAt, fimDoPeriodo: subscriptions.currentPeriodEnd, cartaoFinal: subscriptions.cardLast4 })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId)),
    pagamentos: await db
      .select({ valorCentavos: payments.amountCents, meio: payments.method, status: payments.status, data: payments.createdAt })
      .from(payments)
      .where(eq(payments.userId, userId)),
    atividades: await db.select().from(activityLog).where(eq(activityLog.userId, userId)),
    conquistas: await db.select().from(userBadges).where(eq(userBadges.userId, userId)),
    conteudos: await db.select().from(contentProgress).where(eq(contentProgress.userId, userId)),
  };
  await db.insert(privacyRequests).values({ userId, emailMasked: maskEmail(user.email), kind: "export", status: "done", resolvedAt: new Date() });
  return data;
}

/**
 * Exclusão de conta. Apaga a conta e os dados pessoais em cascata.
 * Registros de pagamento são mantidos sem vínculo e com nome anonimizado, pois podem ser exigidos
 * por obrigação legal/fiscal [prazo de retenção a definir com contador/advogado].
 */
export async function deleteAccount(userId: string, password: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UserError("Conta não encontrada.");
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new UserError("Senha não confere.", "password");
  await eraseAccount(userId);
}

/** Exclusão executada (pela própria pessoa ou pelo admin, a pedido dela). */
export async function eraseAccount(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UserError("Conta não encontrada.");
  await db
    .update(subscriptions)
    .set({ status: "canceled", cancelAtPeriodEnd: false, canceledAt: new Date(), gatewayRef: null, cardLast4: null })
    .where(and(eq(subscriptions.userId, userId)));
  await db.update(payments).set({ customerName: "Conta excluída" }).where(eq(payments.userId, userId));
  await sendEmail({
    to: user.email,
    template: "account_deleted",
    subject: "Sua conta foi excluída",
    body: `Oi, ${firstName(user.name)}.\n\nSua conta e seus dados do Vira Renda foram excluídos, como você pediu. Nenhuma nova cobrança será feita.${footer}`,
  });
  await db.insert(privacyRequests).values({ userId: null, emailMasked: maskEmail(user.email), kind: "delete", status: "done", resolvedAt: new Date() });
  await db.delete(users).where(eq(users.id, userId));
}
