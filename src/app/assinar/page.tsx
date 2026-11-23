import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { quoteFor, getCurrentSubscription, getBillingSettings } from "@/server/billing/subscriptions";
import { brl, dateBR, addMonths } from "@/lib/format";
import { CheckoutForm } from "@/components/billing/checkout-form";
import { ResendVerification } from "@/components/app/resend";
import { Notice } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: "Assinar" };

export default async function Page() {
  const u = await requireUser("/assinar");
  const current = await getCurrentSubscription(u.id);
  if (current && ["active", "past_due"].includes(current.sub.status)) redirect("/app");
  const q = await quoteFor(u.id);
  const settings = await getBillingSettings();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
        <span>✓ {u.name} · {u.email}</span>
      </div>
      <h1 className="mb-6 font-display text-3xl font-bold text-noite">Pagar {brl(q.firstCents)} hoje, sabendo exatamente o que vem depois</h1>
      {!u.emailVerified && config.requireEmailVerification ? (
        <Notice tone="yellow">
          <p className="font-semibold">Confirme seu e-mail antes de assinar.</p>
          <p className="mt-1 text-sm">Mandamos um link para {u.email}. Não chegou?</p>
          <div className="mt-3"><ResendVerification /></div>
        </Notice>
      ) : (
        <CheckoutForm first={brl(q.firstCents)} recurring={brl(q.recurringCents)} nextDate={dateBR(addMonths(new Date(), q.plan.intervalMonths))} demo={settings.gatewayMode === "demo"} />
      )}
    </div>
  );
}
