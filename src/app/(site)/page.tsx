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
  { n: 1, who: "com a Bia", title: "Conte sobre você", text: "Talentos, tempo, o que tem em casa e quanto pode investir.", card: "bg-white", box: "bg-vira-light text-vira" },
  { n: 2, who: "com o Caio", title: "Veja 3 caminhos", text: "Oportunidades que combinam com você, com prós e limites.", card: "bg-white", box: "bg-sol-light text-[#7A5A00]" },
  { n: 3, who: "com a Duda e a Lia", title: "Monte com missões", text: "Sua jornada em 14 etapas, cada uma com missões curtas: oferta, preço, textos de venda e divulgação.", card: "bg-white", box: "bg-festa-light text-festa-dark" },
  { n: 4, who: "com o Nando e a Rosa", title: "Venda e acompanhe", text: "Organize clientes, vendas e custos num só lugar.", card: "bg-noite text-white", box: "bg-noite-soft text-sol", dark: true },
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
      <section className="relative overflow-hidden bg-vira text-white">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#14A060]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-vira-dark" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.15fr_1fr] md:pb-20 md:pt-16">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-sol">Seu mentor de renda extra</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[3.6rem]">
              Você pode transformar o que já sabe fazer em uma <span className="text-sol">renda extra.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">Seis agentes de IA descobrindo seu talento e montando o seu negócio.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/questionario" className="btn-highlight text-base">
                Descobrir meus talentos
              </Link>
              <Link href="#como-funciona" className="btn border border-white/40 text-white hover:bg-white/10">
                Ver como funciona
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/75">Sem promessa de ganhos. Com um plano claro do que fazer.</p>
          </div>
          <HeroChat />
        </div>
      </section>

      {/* 3 · Como funciona */}
      <section id="como-funciona" className="bg-vira-light py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Como funciona</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-noite">Do “não sei por onde começar” à primeira venda</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className={`animate-rise rounded-card p-5 shadow-sm ${s.card}`} style={{ animationDelay: `${s.n * 80}ms` }}>
                <div className={`flex h-20 items-center justify-center rounded-2xl font-display text-4xl font-extrabold ${s.box}`}>{s.n}</div>
                <p className={`mt-4 text-sm ${s.dark ? "text-white/70" : "text-tinta-soft"}`}>{s.who}</p>
                <p className="mt-1 font-display text-lg font-bold">{s.title}</p>
                <p className={`mt-2 text-[15px] ${s.dark ? "text-white/80" : "text-tinta-soft"}`}>{s.text}</p>
              </div>
            ))}
          </div>
          <Link href="/questionario" className="btn-primary mt-8">
            Fazer o questionário
          </Link>
        </div>
      </section>

      {/* 4 · Exemplos de oportunidades */}
      <section id="oportunidades" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-card border border-sol/40 bg-sol-light p-5 sm:p-8">
            <h2 className="mb-5 font-display text-3xl font-bold text-noite">O que dá para fazer com o que você já tem</h2>
            <OpportunityExamples
              items={opps.map((o) => ({ slug: o.slug, title: o.title, buyers: o.buyers, description: o.description, risks: o.risks, mode: o.mode, phoneOnly: o.phoneOnly, investmentLevel: o.investmentLevel, requiredEquipment: o.requiredEquipment }))}
            />
          </div>
        </div>
      </section>

      {/* 5 · Demonstração */}
      <section className="bg-vira-light py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Sua primeira semana</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-noite">Entenda o início da sua jornada com o Vira Renda</h2>
          <p className="mt-2 text-tinta-soft">Clique em cada dia para ver o que acontece. Exemplo ilustrativo.</p>
          <div className="mt-8">
            <DemoWeek />
          </div>
        </div>
      </section>

      {/* 6 · Mentores */}
      <section id="mentores" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-bold text-noite">Uma equipe de 6 mentores de IA</h2>
          <p className="mt-2 text-tinta-soft">Toque num rosto para ver o que cada um faz.</p>
          <div className="mt-8">
            <MentorsGrid />
          </div>
        </div>
      </section>

      {/* 8 · Plano e preço */}
      <section id="plano" className="bg-vira py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sol">Plano e preço</p>
          <h2 className="mb-8 mt-2 font-display text-3xl font-bold text-white">Um plano só, sem letra miúda</h2>
          {plan ? <PricingCard first={plan.firstPeriodPriceCents} price={plan.priceCents} months={plan.intervalMonths} /> : <p className="text-white">Plano em configuração.</p>}
        </div>
      </section>

      {/* 7 · Benefícios e o que não fazemos */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-2">
          <div className="rounded-card bg-vira-light p-6">
            <h3 className="font-display text-xl font-bold text-noite">O que você ganha</h3>
            <ul className="mt-4 space-y-3">
              {["Clareza sobre o que você pode vender", "Um passo por vez, sem se perder", "Textos de venda prontos para usar", "Clientes e dinheiro organizados"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vira text-sm font-bold text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card bg-festa-light p-6">
            <h3 className="font-display text-xl font-bold text-noite">O que a gente não faz</h3>
            <ul className="mt-4 space-y-3">
              {["Não promete quanto você vai ganhar", "Não faz o trabalho no seu lugar", "Não substitui contador nem advogado", "Não manda mensagem sem você"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-festa-dark text-sm font-bold text-white">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 9 e 10 · Dúvidas e chamada final */}
      <section id="duvidas" className="pb-16">
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
          <div className="flex flex-col justify-center rounded-card bg-vira p-8 text-white">
            <p className="font-display text-3xl font-bold">Você já tem mais do que imagina.</p>
            <p className="mt-3 text-white/85">Descubra por onde começar.</p>
            <Link href="/questionario" className="btn-highlight mt-6">
              Fazer o questionário
            </Link>
          </div>
        </div>
      </section>
      <StickyCta />
    </>
  );
}
