import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { requireUser, userHasAccess } from "@/server/session";
import { getRecommendations } from "@/server/profile";
import { quoteFor } from "@/server/billing/subscriptions";
import { MentorBubble, PageTitle, Notice, EmptyState } from "@/components/ui";
import { ChooseButton } from "@/components/app/choose";
import { SubscribeCta } from "@/components/app/locked";

export const metadata = { title: "Minhas oportunidades" };

const LEVEL = { baixo: "baixo", medio: "médio", alto: "alto" };
const DIFF = ["", "baixa", "média", "alta"];

export default async function Page({ searchParams }: { searchParams: Promise<{ novo?: string; recalculado?: string; mudou?: string }> }) {
  const sp = await searchParams;
  const u = await requireUser();
  const paid = u.role !== "user" || (await userHasAccess(u.id));
  const recs = (await getRecommendations(u.id)).slice(0, 3);
  const journey = await db.query.journeys.findFirst({ where: eq(journeys.userId, u.id) });
  if (!recs.length)
    return (
      <EmptyState title="Ainda não temos seu resultado">
        <Link href="/app/talentos/questionario" className="btn-primary mt-3">Fazer o questionário</Link>
      </EmptyState>
    );
  const q = paid ? null : await quoteFor(u.id);
  return (
    <div>
      <PageTitle eyebrow="Oportunidades" title="Três caminhos, com o porquê e com os limites" />
      {sp.novo && <MentorBubble name="Caio" className="mb-5">Seu resultado está pronto! Achei 3 caminhos que cabem no seu tempo e no seu orçamento.</MentorBubble>}
      {sp.recalculado && <Notice tone="green" className="mb-4">Refiz as contas com o seu perfil atualizado.</Notice>}
      {sp.mudou && <Notice tone="yellow" className="mb-4">O caminho que você escolheu não está mais entre os 3 que mais combinam. Você pode mantê-lo ou escolher outro.</Notice>}
      <div className="grid gap-4 lg:grid-cols-3">
        {recs.map(({ rec, opp }, i) => {
          const locked = !paid && i > 0;
          return (
            <article key={opp.id} className={`relative flex flex-col rounded-card bg-white p-5 shadow-sm ${locked ? "overflow-hidden" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-tinta-soft">{i + 1}ª opção</span>
                <span className="font-display text-2xl font-extrabold text-vira">{rec.score}%</span>
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-noite">{opp.title}</h2>
              <div className={locked ? "pointer-events-none select-none blur-sm" : ""} aria-hidden={locked}>
                <p className="mt-3 text-[15px]">
                  <b>Por que combina:</b> {rec.reasons.length ? rec.reasons.join("; ") : "combina com parte do seu perfil"}.
                </p>
                <p className="mt-2 text-sm text-tinta-soft">
                  Investimento {LEVEL[opp.investmentLevel]} · dificuldade {DIFF[opp.difficulty]}
                </p>
                <p className="mt-3 rounded-xl bg-festa-light px-3 py-2 text-sm text-festa-dark">
                  <b>{rec.limits.length ? "Limite:" : "Atenção:"}</b> {rec.limits.length ? rec.limits.join(" ") : opp.risks}
                </p>
              </div>
              <div className="mt-auto pt-4">
                {locked ? (
                  <div className="absolute inset-x-0 bottom-0 top-24 flex flex-col items-center justify-center gap-2 bg-white/70 p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <p className="text-sm font-semibold">Libera com a assinatura</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href={`/app/oportunidades/${opp.slug}`} className="btn-secondary w-full">Ver detalhes</Link>
                    {paid && <ChooseButton id={opp.id} chosen={journey?.opportunityId === opp.id} />}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-tinta-soft">
        Compatibilidade = habilidades + tempo + equipamentos + orçamento + preferência online ou presencial. É uma estimativa para ajudar a escolher, não uma garantia de resultado.
      </p>
      {q && <div className="mt-6"><SubscribeCta first={q.firstCents} price={q.recurringCents} /></div>}
    </div>
  );
}
