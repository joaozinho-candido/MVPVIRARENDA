import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { requireUser, userHasAccess } from "@/server/session";
import { getRecommendations, getProfile } from "@/server/profile";
import { labelFor, labelsFor } from "@/lib/quiz";
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
  const profile = await getProfile(u.id);
  const a = profile?.answers;
  const handoff: [string, string][] = a
    ? [
        ["Talentos", labelsFor("skills", [...a.skills, ...(a.timeFlies ?? [])]) || "a descobrir"],
        ["Pedem sua ajuda para", labelsFor("helpWith", a.helpWith.filter((x) => x !== "nao_sei")) || "ainda não sabe"],
        ["Interesses", labelsFor("interests", a.interests) || "—"],
        ["Experiências", labelsFor("experiences", a.experiences) || "—"],
        ["Tempo", `${labelFor("hoursPerDay", String(a.hoursPerDay))}${a.period.length ? `, ${labelsFor("period", a.period).toLowerCase()}` : ""}`],
        ["Já tem", labelsFor("equipment", a.equipment) || "nada marcado"],
        ["Pode investir", labelFor("budget", String(a.budget))],
        ["Prefere", labelFor("mode", a.mode)],
        ["Com vendas", labelFor("salesComfort", a.salesComfort)],
        ["Meta", a.goal == null ? "não informou" : labelFor("goal", String(a.goal))],
      ]
    : [];
  const MODE = { online: "Online", presencial: "Presencial", ambos: "Online ou presencial" } as const;
  const compare: [string, (i: number) => React.ReactNode][] = [
    ["Compatibilidade", (i) => <b className="text-vira">{recs[i].rec.score}%</b>],
    ["Onde", (i) => MODE[recs[i].opp.mode]],
    ["Investimento inicial", (i) => (recs[i].opp.investmentMin ? `a partir de uns R$ ${recs[i].opp.investmentMin}` : "quase nada")],
    ["Tempo por dia", (i) => `${String(recs[i].opp.minHoursPerDay / 10).replace(".", ",")} h ou mais`],
    ["Precisa de", (i) => recs[i].opp.equipmentText],
    ["Dificuldade", (i) => DIFF[recs[i].opp.difficulty]],
    ["Quem compra", (i) => recs[i].opp.buyers],
    ["Ponto de atenção", (i) => recs[i].rec.limits[0] ?? recs[i].opp.risks],
  ];
  return (
    <div>
      <PageTitle eyebrow="Oportunidades" title="Três caminhos, com o porquê e com os limites" />
      <MentorBubble name="Caio" className="mb-5">
        {sp.novo ? "Seu resultado está pronto! " : ""}A Bia me passou seu retrato completo e eu cruzei com a nossa biblioteca de oportunidades. Estes são os 3 caminhos que mais combinam com você, com o porquê e os limites de cada um.
      </MentorBubble>
      {handoff.length > 0 && (
        <details className="mb-5 rounded-card bg-vira-light p-5" open={!!sp.novo}>
          <summary className="cursor-pointer font-semibold text-vira-dark">O que a Bia passou para o Caio ▾</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
            {handoff.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="shrink-0 text-tinta-soft">{k}:</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <a href="/app/talentos" className="link mt-3 inline-block text-sm">Algo mudou? Editar meu retrato</a>
        </details>
      )}
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
      {recs.length > 1 && (
        <div className="card mt-6">
          <p className="eyebrow mb-3">Comparar lado a lado</p>
          <div className="table-wrap">
            <table className="tbl min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-40"></th>
                  {recs.map(({ opp }, i) => <th key={opp.id} className="text-noite">{i + 1}ª · {opp.title}</th>)}
                </tr>
              </thead>
              <tbody>
                {compare.map(([label, cell]) => (
                  <tr key={label}>
                    <td className="font-medium text-tinta-soft">{label}</td>
                    {recs.map(({ opp }, i) => (
                      <td key={opp.id}>{!paid && i > 0 ? <span className="text-tinta-soft">🔒</span> : cell(i)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!paid && <p className="mt-2 text-sm text-tinta-soft">🔒 A comparação completa libera com a assinatura.</p>}
        </div>
      )}
      <p className="mt-4 text-sm text-tinta-soft">
        Compatibilidade = habilidades + tempo + equipamentos + orçamento + preferência online ou presencial. É uma estimativa para ajudar a escolher, não uma garantia de resultado.
      </p>
      {q && <div className="mt-6"><SubscribeCta first={q.firstCents} price={q.recurringCents} /></div>}
    </div>
  );
}
