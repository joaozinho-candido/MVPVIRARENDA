import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, subscriptions, webhookEvents, billingSettings, plans } from "@/db/schema";
import {
  startCheckout,
  hasAccess,
  handleWebhook,
  demoGateway,
  runBillingCycle,
  cancelSubscription,
  getCurrentSubscription,
  updateCard,
  quoteFor,
  simulateDemoWebhook,
  refundPayment,
} from "@/server/billing/subscriptions";
import { addDays } from "@/lib/format";
import { newUser, subscribedUser, lastEmail, CARD_OK, CARD_REFUSED, CARD_RENEW_FAILS } from "./helpers";

describe("checkout e liberação de acesso", () => {
  it("exige e-mail confirmado e o aceite de valores", async () => {
    const u = await newUser({ verified: false });
    await expect(startCheckout(u.id, { method: "card", accepted: true, card: CARD_OK })).rejects.toThrow(/Confirme seu e-mail/);
    const v = await newUser();
    await expect(startCheckout(v.id, { method: "card", accepted: false, card: CARD_OK })).rejects.toThrow(/valor de hoje/);
  });

  it("cobra R$ 29,90 no 1º mês e R$ 69,90 depois (valores do admin)", async () => {
    const u = await newUser();
    const q = await quoteFor(u.id);
    expect(q.firstCents).toBe(2990);
    expect(q.recurringCents).toBe(6990);
  });

  it("cartão aprovado só libera acesso via webhook validado", async () => {
    const u = await newUser();
    expect(await hasAccess(u.id)).toBe(false);
    const p = await startCheckout(u.id, { method: "card", accepted: true, card: CARD_OK });
    const paid = await db.query.payments.findFirst({ where: eq(payments.id, p.id) });
    expect(paid?.status).toBe("approved");
    expect(await hasAccess(u.id)).toBe(true);
    const events = await db.select().from(webhookEvents).where(eq(webhookEvents.gatewayPaymentId, p.gatewayPaymentId));
    expect(events).toHaveLength(1);
    expect((await lastEmail(u.email)).template).toBe("welcome_payment_confirmed");
  });

  it("cartão recusado não libera acesso e permite tentar outro cartão", async () => {
    const u = await newUser();
    const p = await startCheckout(u.id, { method: "card", accepted: true, card: CARD_REFUSED });
    expect((await db.query.payments.findFirst({ where: eq(payments.id, p.id) }))?.status).toBe("refused");
    expect(await hasAccess(u.id)).toBe(false);
    await startCheckout(u.id, { method: "card", accepted: true, card: CARD_OK });
    expect(await hasAccess(u.id)).toBe(true);
  });

  it("valida dados do cartão", async () => {
    const u = await newUser();
    await expect(startCheckout(u.id, { method: "card", accepted: true, card: { ...CARD_OK, number: "4242 4242 4242 4241" } })).rejects.toThrow(/número/);
    await expect(startCheckout(u.id, { method: "card", accepted: true, card: { ...CARD_OK, expiry: "01/20" } })).rejects.toThrow(/validade/);
    await expect(startCheckout(u.id, { method: "card", accepted: true, card: { ...CARD_OK, cpf: "111.111.111-11" } })).rejects.toThrow(/CPF/);
  });

  it("Pix fica aguardando até a confirmação e pode expirar", async () => {
    const u = await newUser();
    const p = await startCheckout(u.id, { method: "pix", accepted: true });
    expect(p.status).toBe("pending");
    expect(p.pixCode).toBeTruthy();
    expect(await hasAccess(u.id)).toBe(false);
    await runBillingCycle(addDays(new Date(), 1));
    expect((await db.query.payments.findFirst({ where: eq(payments.id, p.id) }))?.status).toBe("expired");
    const p2 = await startCheckout(u.id, { method: "pix", accepted: true });
    await simulateDemoWebhook("payment.approved", p2.gatewayPaymentId);
    expect(await hasAccess(u.id)).toBe(true);
  });
});

describe("webhook", () => {
  it("rejeita assinatura inválida", async () => {
    const body = JSON.stringify({ id: "evt_x", type: "payment.approved", gatewayPaymentId: "nada" });
    expect(await handleWebhook(body, "assinatura-falsa")).toBe("invalid_signature");
    expect(await handleWebhook(body, null)).toBe("invalid_signature");
  });

  it("processa o mesmo evento uma vez só (idempotência)", async () => {
    const u = await newUser();
    const p = await startCheckout(u.id, { method: "pix", accepted: true });
    const { body, signature } = demoGateway().buildEvent("payment.approved", p.gatewayPaymentId);
    expect(await handleWebhook(body, signature)).toBe("processed");
    expect(await handleWebhook(body, signature)).toBe("duplicate");
    const sub = await getCurrentSubscription(u.id);
    expect(sub?.sub.periodsPaid).toBe(1);
  });

  it("ignora eventos fora de ordem (recusado depois de aprovado)", async () => {
    const u = await subscribedUser();
    const pay = (await db.select().from(payments).where(eq(payments.userId, u.id)))[0];
    const { body, signature } = demoGateway().buildEvent("payment.refused", pay.gatewayPaymentId);
    expect(await handleWebhook(body, signature)).toBe("ignored");
    expect(await hasAccess(u.id)).toBe(true);
  });
});

describe("ciclo mensal", () => {
  it("avisa antes da 2ª cobrança, cobra R$ 69,90 e renova", async () => {
    const start = new Date("2026-11-10T12:00:00Z");
    const u = await subscribedUser(CARD_OK, start);
    const sub0 = (await getCurrentSubscription(u.id))!.sub;
    const end = sub0.currentPeriodEnd!;
    await runBillingCycle(addDays(end, -3));
    expect((await lastEmail(u.email)).template).toBe("renewal_notice");
    await runBillingCycle(addDays(end, 0.1));
    const sub = (await getCurrentSubscription(u.id))!.sub;
    expect(sub.periodsPaid).toBe(2);
    expect(sub.status).toBe("active");
    const pays = await db.select().from(payments).where(eq(payments.userId, u.id));
    expect(pays.find((p) => p.periodNumber === 2)?.amountCents).toBe(6990);
  });

  it("falha na mensalidade: avisa, mantém acesso e pausa após X dias sem apagar nada", async () => {
    const start = new Date("2026-11-10T12:00:00Z");
    const u = await subscribedUser(CARD_RENEW_FAILS, start);
    const end = (await getCurrentSubscription(u.id))!.sub.currentPeriodEnd!;
    await runBillingCycle(addDays(end, 0.1));
    let sub = (await getCurrentSubscription(u.id))!.sub;
    expect(sub.status).toBe("past_due");
    expect(await hasAccess(u.id, addDays(end, 0.1))).toBe(true);
    expect((await lastEmail(u.email)).template).toBe("charge_failed");
    const settings = await db.query.billingSettings.findFirst({ where: eq(billingSettings.id, 1) });
    await runBillingCycle(addDays(end, settings!.pauseAfterDays + 0.2));
    sub = (await getCurrentSubscription(u.id))!.sub;
    expect(sub.status).toBe("paused");
    expect(await hasAccess(u.id)).toBe(false);
    // Atualizar o cartão cobra de novo e reativa
    await updateCard(u.id, CARD_OK);
    expect((await getCurrentSubscription(u.id))!.sub.status).toBe("active");
  });

  it("cancelamento: não cobra mais, mantém acesso até o fim do período", async () => {
    const start = new Date("2026-11-10T12:00:00Z");
    const u = await subscribedUser(CARD_OK, start);
    const until = await cancelSubscription(u.id);
    expect((await lastEmail(u.email)).template).toBe("cancel_confirmed");
    await runBillingCycle(addDays(until!, -1));
    expect(await hasAccess(u.id, addDays(until!, -1))).toBe(true);
    await runBillingCycle(addDays(until!, 0.1));
    const sub = (await getCurrentSubscription(u.id))!.sub;
    expect(sub.status).toBe("canceled");
    expect(await hasAccess(u.id, addDays(until!, 0.1))).toBe(false);
    const pays = await db.select().from(payments).where(eq(payments.userId, u.id));
    expect(pays).toHaveLength(1);
  });

  it("quem volta depois paga a mensalidade cheia (promoção só na 1ª assinatura)", async () => {
    const u = await subscribedUser();
    const q = await quoteFor(u.id);
    expect(q.firstCents).toBe(6990);
  });

  it("estorno encerra o acesso", async () => {
    const u = await subscribedUser();
    const pay = (await db.select().from(payments).where(eq(payments.userId, u.id)))[0];
    await refundPayment(pay.id);
    expect(await hasAccess(u.id)).toBe(false);
  });

  it("novo preço vale só para novas assinaturas", async () => {
    const u = await subscribedUser();
    await db.update(plans).set({ priceCents: 7990 }).where(eq(plans.slug, "mensal"));
    const sub = (await db.select().from(subscriptions).where(eq(subscriptions.userId, u.id)))[0];
    expect(sub.priceCents).toBe(6990);
    await db.update(plans).set({ priceCents: 6990 }).where(eq(plans.slug, "mensal"));
  });
});
