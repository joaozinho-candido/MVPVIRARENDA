import { and, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  plans,
  billingSettings,
  coupons,
  subscriptions,
  payments,
  webhookEvents,
  users,
  type SubscriptionStatus,
} from "@/db/schema";
import { UserError } from "@/lib/errors";
import { config } from "@/lib/config";
import { addDays, addMonths, brl, dateBR, firstName } from "@/lib/format";
import { cpfValid, expiryValid, luhnValid, onlyDigits } from "@/lib/validators";
import { sendEmail, link, footer } from "../email";
import { awardBadgesForRule, recordActivity } from "../gamification";
import { DemoGateway, demoCardOutcome, demoTokenForCard } from "./demo-gateway";
import type { PaymentGateway, WebhookEvent } from "./gateway";

/* --------------------------------- Gateway --------------------------------- */

const demo = new DemoGateway();

export async function getGateway(): Promise<PaymentGateway> {
  const s = await getBillingSettings();
  if (s.gatewayMode === "production") {
    // Integração real pendente: implemente um adaptador de PaymentGateway e devolva-o aqui.
    throw new UserError("Gateway de produção ainda não configurado. Pagamentos estão em modo demonstração.");
  }
  return demo;
}

export function demoGateway() {
  return demo;
}

/* -------------------------------- Configuração ------------------------------- */

export async function getBillingSettings() {
  const row = await db.query.billingSettings.findFirst({ where: eq(billingSettings.id, 1) });
  if (row) return row;
  const [created] = await db.insert(billingSettings).values({ id: 1 }).onConflictDoNothing().returning();
  return created ?? (await db.query.billingSettings.findFirst({ where: eq(billingSettings.id, 1) }))!;
}

export async function getPlans(onlyActive = true) {
  const rows = await db.select().from(plans).orderBy(plans.sortOrder);
  return onlyActive ? rows.filter((p) => p.active) : rows;
}

export async function getMainPlan() {
  const active = await getPlans(true);
  return active.find((p) => p.intervalMonths === 1) ?? active[0] ?? null;
}

/* ------------------------------- Acesso e status ----------------------------- */

export async function getCurrentSubscription(userId: string) {
  const rows = await db
    .select({ sub: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(and(eq(subscriptions.userId, userId), ne(subscriptions.status, "pending")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * A liberação de acesso depende SOMENTE do status gravado a partir de webhooks validados.
 * active / past_due (dentro do prazo) → acesso; canceled → acesso até o fim do período pago.
 */
export function subscriptionGrantsAccess(
  sub: { status: SubscriptionStatus; currentPeriodEnd: Date | null } | null | undefined,
  now = new Date(),
) {
  if (!sub) return false;
  if (sub.status === "active" || sub.status === "past_due") return true;
  if (sub.status === "canceled" && sub.currentPeriodEnd && sub.currentPeriodEnd > now) return true;
  return false;
}

export async function hasAccess(userId: string, now = new Date()) {
  const current = await getCurrentSubscription(userId);
  return subscriptionGrantsAccess(current?.sub, now);
}

/* --------------------------------- Checkout --------------------------------- */

export async function quoteFor(userId: string | null, planSlug?: string, couponCode?: string) {
  const plan = planSlug
    ? await db.query.plans.findFirst({ where: and(eq(plans.slug, planSlug), eq(plans.active, true)) })
    : await getMainPlan();
  if (!plan) throw new UserError("Plano indisponível no momento.");
  const settings = await getBillingSettings();
  let hadPaid = false;
  if (userId) {
    const previous = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), sql`${subscriptions.periodsPaid} > 0`))
      .limit(1);
    hadPaid = previous.length > 0;
  }
  const promo = plan.firstPeriodPriceCents != null && !(settings.promoOnlyFirstSubscription && hadPaid);
  let first = promo ? plan.firstPeriodPriceCents! : plan.priceCents;
  let recurring = plan.priceCents;
  let coupon: typeof coupons.$inferSelect | undefined;
  if (couponCode?.trim()) {
    coupon = await db.query.coupons.findFirst({
      where: and(eq(coupons.code, couponCode.trim().toUpperCase()), eq(coupons.active, true)),
    });
    if (!coupon) throw new UserError("Cupom não encontrado ou fora do prazo.", "coupon");
    first = Math.round(first * (1 - coupon.percentOff / 100));
    if (!coupon.firstPeriodOnly) recurring = Math.round(recurring * (1 - coupon.percentOff / 100));
  }
  return { plan, firstCents: first, recurringCents: recurring, promo, coupon: coupon?.code ?? null };
}

export type CheckoutInput = {
  planSlug?: string;
  method: "card" | "pix";
  coupon?: string;
  accepted: boolean;
  card?: { number: string; expiry: string; cvv: string; cpf: string };
};

export async function startCheckout(userId: string, input: CheckoutInput, now = new Date()) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UserError("Entre na sua conta para assinar.");
  if (config.requireEmailVerification && !user.emailVerifiedAt) throw new UserError("Confirme seu e-mail antes de assinar. Reenviamos o link no seu perfil.");
  if (!input.accepted)
    throw new UserError("Marque que entendeu o valor de hoje e o valor dos próximos meses.", "accepted");
  const current = await getCurrentSubscription(userId);
  if (current && (current.sub.status === "active" || current.sub.status === "past_due"))
    throw new UserError("Você já tem uma assinatura ativa.");

  const q = await quoteFor(userId, input.planSlug, input.coupon);
  const settings = await getBillingSettings();
  const gateway = await getGateway();

  let cardToken: string | undefined;
  let last4: string | null = null;
  if (input.method === "card") {
    const c = input.card;
    if (!c || !luhnValid(c.number)) throw new UserError("Confira o número do cartão.", "number");
    if (!expiryValid(c.expiry, now)) throw new UserError("Confira a validade (MM/AA).", "expiry");
    if (!/^\d{3,4}$/.test(onlyDigits(c.cvv))) throw new UserError("O CVV tem 3 ou 4 números, no verso do cartão.", "cvv");
    if (!cpfValid(c.cpf)) throw new UserError("Confira o CPF do titular.", "cpf");
    // Demonstração: geramos um token local. Em produção o token vem do SDK do gateway no navegador
    // e os dados do cartão nunca passam pelo nosso servidor.
    cardToken = demoTokenForCard(c.number);
    last4 = onlyDigits(c.number).slice(-4);
  }

  // Reaproveita uma assinatura pendente (ex.: cartão recusado e nova tentativa)
  const pending = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, "pending")),
  });
  const values = {
    planId: q.plan.id,
    paymentMethod: input.method,
    cardLast4: last4,
    couponCode: q.coupon,
    firstPeriodPriceCents: q.firstCents,
    priceCents: q.recurringCents,
    gatewayRef: cardToken ?? null,
    updatedAt: now,
  };
  const sub = pending
    ? (await db.update(subscriptions).set(values).where(eq(subscriptions.id, pending.id)).returning())[0]
    : (await db.insert(subscriptions).values({ userId, status: "pending", ...values }).returning())[0];

  const attempts = await db.select({ id: payments.id }).from(payments).where(eq(payments.subscriptionId, sub.id));
  const charge = await gateway.createCharge({
    reference: sub.id,
    amountCents: q.firstCents,
    method: input.method,
    description: `Vira Renda · ${q.plan.name} · 1º período`,
    customer: { name: user.name, email: user.email },
    cardToken,
    pixExpiresMinutes: settings.pixExpiresMinutes,
  });
  const [payment] = await db
    .insert(payments)
    .values({
      subscriptionId: sub.id,
      userId,
      customerName: user.name,
      periodNumber: 1,
      amountCents: q.firstCents,
      method: input.method,
      status: "pending",
      attempt: attempts.length + 1,
      gatewayPaymentId: charge.gatewayPaymentId,
      pixCode: charge.pixCode ?? null,
      pixExpiresAt: charge.pixExpiresAt ?? null,
    })
    .returning();
  if (q.coupon) await db.update(coupons).set({ uses: sql`${coupons.uses} + 1` }).where(eq(coupons.code, q.coupon));

  // No modo demonstração o "gateway" responde ao cartão na hora, por webhook assinado.
  if (gateway.isDemo && input.method === "card") {
    const outcome = demoCardOutcome(cardToken, false);
    await simulateDemoWebhook(
      outcome === "approved" ? "payment.approved" : "payment.refused",
      charge.gatewayPaymentId,
      outcome === "refused" ? "Cartão recusado pelo banco emissor (simulação)" : undefined,
    );
  }
  return payment;
}

export async function simulateDemoWebhook(type: WebhookEvent["type"], gatewayPaymentId: string, reason?: string) {
  const settings = await getBillingSettings();
  if (settings.gatewayMode !== "demo") throw new UserError("Simulação disponível apenas em modo demonstração.");
  const { body, signature } = demo.buildEvent(type, gatewayPaymentId, reason);
  return handleWebhook(body, signature);
}

/* --------------------------------- Webhooks --------------------------------- */

export type WebhookResult = "processed" | "duplicate" | "ignored" | "invalid_signature" | "unknown_payment";

/**
 * Único lugar que muda o status de pagamentos e assinaturas.
 * - assinatura HMAC validada
 * - idempotente: o mesmo evento processado uma vez só, mesmo se chegar repetido
 */
export async function handleWebhook(rawBody: string, signature: string | null, now = new Date()): Promise<WebhookResult> {
  const gateway = demo; // trocar pelo gateway configurado quando houver integração real
  if (!gateway.verifySignature(rawBody, signature)) return "invalid_signature";
  let event: WebhookEvent;
  try {
    event = gateway.parseEvent(rawBody);
  } catch {
    return "ignored";
  }

  const inserted = await db
    .insert(webhookEvents)
    .values({ id: event.id, type: event.type, gatewayPaymentId: event.gatewayPaymentId, payload: JSON.parse(rawBody), result: "processing" })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) return "duplicate";

  const result = await applyEvent(event, now);
  await db.update(webhookEvents).set({ result }).where(eq(webhookEvents.id, event.id));
  return result;
}

async function applyEvent(event: WebhookEvent, now: Date): Promise<WebhookResult> {
  const payment = await db.query.payments.findFirst({ where: eq(payments.gatewayPaymentId, event.gatewayPaymentId) });
  if (!payment) return "unknown_payment";
  const sub = (await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, payment.subscriptionId) }))!;
  const plan = (await db.query.plans.findFirst({ where: eq(plans.id, sub.planId) }))!;
  const user = sub.userId ? await db.query.users.findFirst({ where: eq(users.id, sub.userId) }) : null;

  switch (event.type) {
    case "payment.approved": {
      if (payment.status !== "pending") return "ignored";
      await db.update(payments).set({ status: "approved", confirmedAt: now, updatedAt: now }).where(eq(payments.id, payment.id));
      const isFirst = payment.periodNumber === 1;
      const start = isFirst || sub.status === "paused" || !sub.currentPeriodEnd ? now : sub.currentPeriodEnd;
      const end = addMonths(start, plan.intervalMonths);
      await db
        .update(subscriptions)
        .set({
          status: "active",
          periodsPaid: payment.periodNumber,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          pastDueSince: null,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id));
      if (user && isFirst) {
        await recordActivity(user.id, "event", "Assinatura confirmada", 0, now);
        await awardBadgesForRule(user.id, "subscribed", now);
        await sendEmail({
          to: user.email,
          userId: user.id,
          template: "welcome_payment_confirmed",
          subject: "Pagamento confirmado · bem-vinda(o) ao Vira Renda!",
          body:
            `Oi, ${firstName(user.name)}!\n\nRecebemos seu pagamento de ${brl(payment.amountCents)} (1º período do ${plan.name}).\n` +
            `A partir de ${dateBR(end)}, a mensalidade passa a ser ${brl(sub.priceCents)}, até você cancelar.\n\n` +
            `Suas 3 oportunidades estão liberadas: ${link("/app/oportunidades")}\n` +
            `Cancelar quando quiser, sem multa: ${link("/app/perfil?aba=plano")}\n\nRecibo: pagamento ${payment.gatewayPaymentId}.${footer}`,
        });
      } else if (user && sub.status === "past_due") {
        await recordActivity(user.id, "event", "Mensalidade regularizada", 0, now);
      }
      return "processed";
    }
    case "payment.refused": {
      if (payment.status !== "pending") return "ignored";
      await db
        .update(payments)
        .set({ status: "refused", failureReason: event.reason ?? "Recusado", updatedAt: now })
        .where(eq(payments.id, payment.id));
      if (payment.periodNumber > 1) {
        await db
          .update(subscriptions)
          .set({ status: "past_due", pastDueSince: sub.pastDueSince ?? now, updatedAt: now })
          .where(eq(subscriptions.id, sub.id));
        if (user) {
          const settings = await getBillingSettings();
          const deadline = addDays(sub.pastDueSince ?? now, settings.pauseAfterDays);
          await sendEmail({
            to: user.email,
            userId: user.id,
            template: "charge_failed",
            subject: "Não conseguimos cobrar sua mensalidade",
            body: `Oi, ${firstName(user.name)}!\n\nA cobrança de ${brl(payment.amountCents)} não foi aprovada. Nada foi cobrado.\nAtualize o cartão até ${dateBR(deadline)} para manter o acesso: ${link("/app/perfil?aba=plano")}\n\nSeu progresso fica guardado, mesmo se o acesso for pausado.${footer}`,
          });
        }
      }
      return "processed";
    }
    case "payment.expired": {
      if (payment.status !== "pending") return "ignored";
      await db.update(payments).set({ status: "expired", updatedAt: now }).where(eq(payments.id, payment.id));
      return "processed";
    }
    case "payment.refunded": {
      if (payment.status !== "approved") return "ignored";
      await db.update(payments).set({ status: "refunded", updatedAt: now }).where(eq(payments.id, payment.id));
      // Regra adotada nesta etapa: estorno encerra o acesso imediatamente. [política de reembolso a definir]
      await db
        .update(subscriptions)
        .set({ status: "canceled", canceledAt: now, currentPeriodEnd: now, cancelAtPeriodEnd: false, updatedAt: now })
        .where(eq(subscriptions.id, sub.id));
      return "processed";
    }
  }
}

/* ------------------------------ Ações da pessoa ------------------------------ */

export async function cancelSubscription(userId: string, now = new Date()) {
  const current = await getCurrentSubscription(userId);
  if (!current || !["active", "past_due"].includes(current.sub.status))
    throw new UserError("Não há assinatura ativa para cancelar.");
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, canceledAt: now, updatedAt: now })
    .where(eq(subscriptions.id, current.sub.id));
  const user = (await db.query.users.findFirst({ where: eq(users.id, userId) }))!;
  await sendEmail({
    to: user.email,
    userId,
    template: "cancel_confirmed",
    subject: "Cancelamento confirmado",
    body: `Oi, ${firstName(user.name)}!\n\nSua renovação foi cancelada. Nenhuma nova cobrança será feita.\nVocê continua com acesso até ${dateBR(current.sub.currentPeriodEnd)}.\nSeu progresso fica guardado. Para voltar, é só assinar de novo em ${link("/planos")}.${footer}`,
  });
  return current.sub.currentPeriodEnd;
}

export async function resumeSubscription(userId: string, now = new Date()) {
  const current = await getCurrentSubscription(userId);
  if (!current || !current.sub.cancelAtPeriodEnd || current.sub.status === "canceled")
    throw new UserError("Não há cancelamento para desfazer.");
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: false, canceledAt: null, updatedAt: now })
    .where(eq(subscriptions.id, current.sub.id));
}

/** Atualiza o cartão e, se houver mensalidade em atraso, tenta cobrar de novo na hora. */
export async function updateCard(userId: string, card: { number: string; expiry: string; cvv: string; cpf: string }, now = new Date()) {
  const current = await getCurrentSubscription(userId);
  if (!current || !["active", "past_due", "paused"].includes(current.sub.status))
    throw new UserError("Não há assinatura para atualizar.");
  if (!luhnValid(card.number)) throw new UserError("Confira o número do cartão.", "number");
  if (!expiryValid(card.expiry, now)) throw new UserError("Confira a validade (MM/AA).", "expiry");
  if (!/^\d{3,4}$/.test(onlyDigits(card.cvv))) throw new UserError("Confira o CVV.", "cvv");
  if (!cpfValid(card.cpf)) throw new UserError("Confira o CPF do titular.", "cpf");
  await db
    .update(subscriptions)
    .set({ gatewayRef: demoTokenForCard(card.number), cardLast4: onlyDigits(card.number).slice(-4), paymentMethod: "card", updatedAt: now })
    .where(eq(subscriptions.id, current.sub.id));
  if (current.sub.status === "past_due" || current.sub.status === "paused") {
    await chargeRenewal(current.sub.id, now);
  }
}

/* ------------------------------ Ciclo de cobrança ---------------------------- */

async function chargeRenewal(subscriptionId: string, now: Date) {
  const sub = (await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, subscriptionId) }))!;
  const user = sub.userId ? await db.query.users.findFirst({ where: eq(users.id, sub.userId) }) : null;
  if (!user) return null;
  const plan = (await db.query.plans.findFirst({ where: eq(plans.id, sub.planId) }))!;
  const gateway = await getGateway();
  const period = sub.periodsPaid + 1;
  const prev = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.subscriptionId, sub.id), eq(payments.periodNumber, period)));
  const charge = await gateway.createCharge({
    reference: sub.id,
    amountCents: sub.priceCents,
    method: sub.paymentMethod,
    description: `Vira Renda · ${plan.name} · mensalidade ${period}`,
    customer: { name: user.name, email: user.email },
    cardToken: sub.gatewayRef ?? undefined,
    pixExpiresMinutes: 60 * 24 * 3,
  });
  const [payment] = await db
    .insert(payments)
    .values({
      subscriptionId: sub.id,
      userId: user.id,
      customerName: user.name,
      periodNumber: period,
      amountCents: sub.priceCents,
      method: sub.paymentMethod,
      attempt: prev.length + 1,
      gatewayPaymentId: charge.gatewayPaymentId,
      pixCode: charge.pixCode ?? null,
      pixExpiresAt: charge.pixExpiresAt ?? null,
      createdAt: now,
    })
    .returning();
  if (sub.paymentMethod === "pix") {
    await sendEmail({
      to: user.email,
      userId: user.id,
      template: "pix_pending",
      subject: "Sua mensalidade via Pix está disponível",
      body: `Oi, ${firstName(user.name)}!\n\nO Pix da mensalidade de ${brl(sub.priceCents)} está pronto em ${link(`/assinar/status/${payment.id}`)}.${footer}`,
    });
  } else if (gateway.isDemo) {
    const outcome = demoCardOutcome(sub.gatewayRef ?? undefined, true);
    const { body, signature } = demo.buildEvent(
      outcome === "approved" ? "payment.approved" : "payment.refused",
      charge.gatewayPaymentId,
      outcome === "refused" ? "Saldo ou limite insuficiente (simulação)" : undefined,
    );
    await handleWebhook(body, signature, now);
  }
  return payment;
}

/**
 * Executado diariamente (cron: /api/cron/billing ou `npm run billing:run`).
 * Datas e prazos vêm do painel (Plano e preço). Recebe `now` para testes.
 */
export async function runBillingCycle(now = new Date()) {
  const settings = await getBillingSettings();
  const report = { notices: 0, charged: 0, canceled: 0, paused: 0, pixExpired: 0, retries: 0 };

  // Pix vencido
  const expiredPix = await db
    .select()
    .from(payments)
    .where(and(eq(payments.status, "pending"), eq(payments.method, "pix"), lt(payments.pixExpiresAt, now)));
  for (const p of expiredPix) {
    if (settings.gatewayMode === "demo") {
      const { body, signature } = demo.buildEvent("payment.expired", p.gatewayPaymentId);
      await handleWebhook(body, signature, now);
    }
    report.pixExpired++;
  }

  const subs = await db
    .select()
    .from(subscriptions)
    .where(inArray(subscriptions.status, ["active", "past_due"]));
  for (const sub of subs) {
    if (!sub.currentPeriodEnd || !sub.userId) continue;
    const user = await db.query.users.findFirst({ where: eq(users.id, sub.userId) });
    if (!user) continue;

    // 1) Aviso antes da 2ª cobrança, com link para cancelar
    const noticeAt = addDays(sub.currentPeriodEnd, -settings.noticeDaysBefore);
    if (
      sub.status === "active" &&
      sub.periodsPaid === 1 &&
      !sub.cancelAtPeriodEnd &&
      sub.noticeSentForPeriod < 1 &&
      now >= noticeAt &&
      now < sub.currentPeriodEnd
    ) {
      await sendEmail({
        to: user.email,
        userId: user.id,
        template: "renewal_notice",
        subject: `Seu plano passa para ${brl(sub.priceCents)} em ${dateBR(sub.currentPeriodEnd)}`,
        body: `Oi, ${firstName(user.name)}!\n\nAviso combinado: em ${dateBR(sub.currentPeriodEnd)} cobraremos ${brl(sub.priceCents)}, a mensalidade do Vira Renda.\nSe não quiser continuar, cancele em 2 toques, sem multa: ${link("/app/perfil?aba=plano")}\n\nVeja o que você construiu este mês: ${link("/app/conquistas")}${footer}`,
      });
      await db.update(subscriptions).set({ noticeSentForPeriod: 1 }).where(eq(subscriptions.id, sub.id));
      report.notices++;
    }

    if (now < sub.currentPeriodEnd) continue;

    // 2) Fim do período com cancelamento agendado
    if (sub.cancelAtPeriodEnd) {
      await db.update(subscriptions).set({ status: "canceled", updatedAt: now }).where(eq(subscriptions.id, sub.id));
      report.canceled++;
      continue;
    }

    // 3) Falha: pausa após X dias, mantendo os dados
    if (sub.status === "past_due" && sub.pastDueSince && now >= addDays(sub.pastDueSince, settings.pauseAfterDays)) {
      await db.update(subscriptions).set({ status: "paused", updatedAt: now }).where(eq(subscriptions.id, sub.id));
      await sendEmail({
        to: user.email,
        userId: user.id,
        template: "access_paused",
        subject: "Seu acesso foi pausado",
        body: `Oi, ${firstName(user.name)}!\n\nComo não conseguimos cobrar a mensalidade, pausamos o acesso. Nada foi apagado.\nPara voltar, atualize o pagamento: ${link("/app/perfil?aba=plano")}${footer}`,
      });
      report.paused++;
      continue;
    }

    // 4) Cobrança da renovação (uma por dia no máximo, inclusive novas tentativas)
    const last = await db.query.payments.findFirst({
      where: and(eq(payments.subscriptionId, sub.id), eq(payments.periodNumber, sub.periodsPaid + 1)),
      orderBy: desc(payments.createdAt),
    });
    if (last?.status === "pending") continue;
    if (last && now.getTime() - last.createdAt.getTime() < 20 * 3_600_000) continue;
    await chargeRenewal(sub.id, now);
    if (last) report.retries++;
    else report.charged++;
  }
  return report;
}

/* -------------------------------- Consultas --------------------------------- */

export async function getPaymentForUser(userId: string, paymentId: string) {
  return db.query.payments.findFirst({ where: and(eq(payments.id, paymentId), eq(payments.userId, userId)) });
}

export async function listUserPayments(userId: string) {
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function refundPayment(paymentId: string) {
  const p = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!p || p.status !== "approved") throw new UserError("Só pagamentos aprovados podem ser estornados.");
  const gateway = await getGateway();
  await gateway.refund(p.gatewayPaymentId);
  if (gateway.isDemo) await simulateDemoWebhook("payment.refunded", p.gatewayPaymentId);
}
