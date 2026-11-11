import Link from "next/link";
import { PricingCard } from "@/components/site/pricing";
import { getPlans } from "@/server/billing/subscriptions";
import { FAQ } from "@/lib/faq";
import { brl } from "@/lib/format";

export const metadata = { title: "Plano e preço" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const plans = await getPlans(true);
  const main = plans.find((p) => p.intervalMonths === 1) ?? plans[0];
  const others = plans.filter((p) => p.id !== main?.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="eyebrow">Plano</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-noite">Um plano só, com o preço de depois tão visível quanto o de agora</h1>
      <div className="mt-8">{main ? <PricingCard first={main.firstPeriodPriceCents} price={main.priceCents} months={main.intervalMonths} /> : <p>Plano em configuração.</p>}</div>
      {others.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {others.map((p) => (
            <div key={p.id} className="card">
              <p className="font-semibold">{p.name}</p>
              <p className="mt-1 font-display text-2xl font-bold">{brl(p.priceCents)}</p>
              <p className="text-sm text-tinta-soft">a cada {p.intervalMonths} meses</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {FAQ.slice(0, 4).map((f) => (
          <div key={f.q} className="card">
            <p className="font-semibold text-noite">{f.q}</p>
            <p className="mt-2 text-tinta-soft">{f.a}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/questionario" className="btn-primary">Fazer o questionário grátis</Link>
      </div>
    </div>
  );
}
