"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import {
  startCheckout,
  simulateDemoWebhook,
  getPaymentForUser,
  cancelSubscription,
  resumeSubscription,
  updateCard,
  quoteFor,
} from "@/server/billing/subscriptions";
import { fail, type ActionResult } from "@/lib/errors";
import { brl, dateBR, addMonths } from "@/lib/format";

export async function quoteAction(coupon: string) {
  const u = await requireUser();
  try {
    const q = await quoteFor(u.id, undefined, coupon);
    return { ok: true as const, first: brl(q.firstCents), recurring: brl(q.recurringCents), coupon: q.coupon, nextDate: dateBR(addMonths(new Date(), q.plan.intervalMonths)) };
  } catch (e) {
    return fail(e);
  }
}

export async function checkoutAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requireUser("/assinar");
  let paymentId: string;
  try {
    const method = fd.get("method") === "pix" ? "pix" : "card";
    const p = await startCheckout(u.id, {
      method,
      accepted: fd.get("accepted") === "on",
      coupon: String(fd.get("coupon") ?? "") || undefined,
      card:
        method === "card"
          ? { number: String(fd.get("number") ?? ""), expiry: String(fd.get("expiry") ?? ""), cvv: String(fd.get("cvv") ?? ""), cpf: String(fd.get("cpf") ?? "") }
          : undefined,
    });
    paymentId = p.id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/assinar/status/${paymentId}`);
}

/** Somente em modo demonstração: simula o banco confirmando (ou vencendo) o Pix. */
export async function simulatePixAction(paymentId: string, outcome: "approved" | "expired") {
  const u = await requireUser();
  const p = await getPaymentForUser(u.id, paymentId);
  if (!p) return;
  await simulateDemoWebhook(outcome === "approved" ? "payment.approved" : "payment.expired", p.gatewayPaymentId);
  revalidatePath(`/assinar/status/${paymentId}`);
}

export async function cancelSubscriptionAction() {
  const u = await requireUser();
  try {
    await cancelSubscription(u.id);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/app", "layout");
  return { ok: true as const };
}

export async function resumeSubscriptionAction() {
  const u = await requireUser();
  await resumeSubscription(u.id);
  revalidatePath("/app", "layout");
}

export async function updateCardAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requireUser();
  try {
    await updateCard(u.id, { number: String(fd.get("number") ?? ""), expiry: String(fd.get("expiry") ?? ""), cvv: String(fd.get("cvv") ?? ""), cpf: String(fd.get("cpf") ?? "") });
    revalidatePath("/app", "layout");
    return { ok: true, message: "Cartão atualizado." };
  } catch (e) {
    return fail(e);
  }
}
