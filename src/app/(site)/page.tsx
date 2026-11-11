import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { HeroChat, DemoWeek } from "@/components/site/chat";
import { OpportunityExamples, MentorsGrid } from "@/components/site/blocks";
import { StickyCta } from "@/components/site/header";
import { PricingCard } from "@/components/site/pricing";
import { getMainPlan } from "@/server/billing/subscriptions";
import { FAQ } from "@/lib/faq";
import { Notice } from "@/components/ui";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: 1, who: "com a Bia", title: "Conte sobre você", text: "Talentos, tempo, o que tem em casa e quanto pode investir.", box: "bg-vira-light text-vira" },
  { n: 2, who: "com o Caio", title: "Veja 3 caminhos", text: "Oportunidades que combinam com você, com prós e limites.", box: "bg-sol-light text-[#7A5A00]" },
  { n: 3, who: "com a Duda e a Lia", title: "Monte com missões", text: "Oferta, preço, textos de venda e divulgação, passo a passo.", box: "bg-festa-light text-festa-dark" },
  { n: 4, who: "com o Nando e a Rosa", title: "Venda e acompanhe", text: "Organize clientes, vendas e custos num só lugar.", box: "bg-noite-soft text-sol", dark: true },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ conta?: string }> }) {
  const sp = await searchParams;
  const opps = await db.select().from(opportunities).where(eq(opportunities.status, "published")).orderBy(opportunities.sortOrder);
  const plan = await getMainPlan();
  return (
    <>
      {sp.conta === "excluida" && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <Notice tone="green">Sua conta e seus dados foram excluídos. Obrigado por ter passado por aqui.</Notice>
        </div>
      )}
      {/* 2 · Primeira dobra */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          <p className="eyebrow">Seu mentor de renda extra</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] text-noite sm:text-5xl">
            Você pode transformar o que já sabe fazer em uma renda extra.
          </h1>
          <p className="mt-5 text-lg text-tinta-soft">
            Descubra oportunidades que combinam com seus talentos, seu tempo e os recursos que já possui.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/questionario" className="btn-primary">
              Descobrir meus talentos
            </Link>
            <Link href="#como-funciona" className="btn-secondary">
              Ver como funciona
            </Link>
          </div>
          <p className="mt-4 text-sm text-tinta-soft">Grátis · 5 minutos · Sem promessa de ganhos. Com um plano claro do que fazer.</p>
        </div>
        <HeroChat />
      </section>

      {/* 3 · Como funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Como funciona</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-noite">Do “não sei por onde começar” à primeira venda</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className={`animate-rise rounded-card p-5 ${s.dark ? "bg-noite text-white" : "bg-areia"}`} style={{ animationDelay: `${s.n * 80}ms` }}>
                <div className={`flex h-20 items-center justify-center rounded-2xl font-display text-4xl font-extrabold ${s.box}`}>{s.n}</div>
                <p className={`mt-4 text-sm ${s.dark ? "text-white/70" : "text-tinta-soft"}`}>{s.who}</p>
                <p className="mt-1 font-display text-lg font-bold">{s.title}</p>
                <p className={`mt-2 text-[15px] ${s.dark ? "text-white/80" : "text-tinta-soft"}`}>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/questionario" className="btn-primary">
              Fazer o questionário grátis
            </Link>
            <span className="text-tinta-soft">Leva uns 5 minutos.</span>
          </div>
        </div>
      </section>

      {/* 4 · Exemplos de oportunidades */}
      <section id="oportunidades" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-card border border-sol/30 bg-sol-light/60 p-5 sm:p-8">
            <h2 className="mb-5 font-display text-3xl font-bold text-noite">O que dá para fazer com o que você já tem</h2>
            <OpportunityExamples
              items={opps.map((o) => ({ slug: o.slug, title: o.title, buyers: o.buyers, description: o.description, risks: o.risks, mode: o.mode, phoneOnly: o.phoneOnly, investmentLevel: o.investmentLevel, requiredEquipment: o.requiredEquipment }))}
            />
          </div>
        </div>
      </section>

      {/* 5 · Demonstração */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Sua primeira semana</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-noite">Veja o produto funcionando, sem cadastro</h2>
          <p className="mt-2 text-tinta-soft">Clique num dia. Exemplo ilustrativo de uma pessoa fictícia.</p>
          <div className="mt-8">
            <DemoWeek />
          </div>
        </div>
      </section>

      {/* 6 e 7 · Mentores e benefícios */}
      <section id="mentores" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-bold text-noite">Uma equipe de 6 mentores</h2>
          <p className="mt-2 text-tinta-soft">Toque num rosto para ver o que cada um faz.</p>
          <div className="mt-8">
            <MentorsGrid />
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="card">
              <h3 className="font-display text-xl font-bold text-noite">O que você ganha</h3>
              <ul className="mt-4 space-y-3">
                {["Clareza sobre o que você pode vender", "Um passo por vez, sem se perder", "Textos de venda prontos para usar", "Clientes e dinheiro organizados"].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="text-vira">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="font-display text-xl font-bold text-noite">O que a gente não faz</h3>
              <ul className="mt-4 space-y-3">
                {["Não promete quanto você vai ganhar", "Não faz o trabalho no seu lugar", "Não substitui contador nem advogado", "Não manda mensagem sem você"].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span className="text-festa-dark">✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8 · Plano e preço */}
      <section id="plano" className="scroll-mt-20 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 font-display text-3xl font-bold text-noite">Um plano só, sem letra miúda</h2>
          {plan ? <PricingCard first={plan.firstPeriodPriceCents} price={plan.priceCents} months={plan.intervalMonths} /> : <p>Plano em configuração.</p>}
        </div>
      </section>

      {/* 9 e 10 · Dúvidas e chamada final */}
      <section id="duvidas" className="scroll-mt-20 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="mb-6 font-display text-3xl font-bold text-noite">Perguntas frequentes</h2>
            <div className="divide-y divide-tinta/10 rounded-card bg-white px-5 shadow-sm">
              {FAQ.map((f, i) => (
                <details key={f.q} className="group py-4" open={i === 0} name="faq">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-noite">
                    {f.q}
                    <span className="text-xl text-vira group-open:hidden">+</span>
                    <span className="hidden text-xl text-vira group-open:inline">−</span>
                  </summary>
                  <p className="mt-2 text-tinta-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-card bg-noite p-8 text-white">
            <p className="font-display text-3xl font-bold">Você já tem mais do que imagina.</p>
            <p className="mt-3 text-white/80">Descubra em 5 minutos por onde começar.</p>
            <Link href="/questionario" className="btn-highlight mt-6">
              Fazer o questionário grátis
            </Link>
          </div>
        </div>
      </section>
      <StickyCta />
    </>
  );
}
