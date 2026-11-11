import Link from "next/link";
import { requirePaid } from "@/server/session";
import { getJourney } from "@/server/journey";
import { getFeed, CATEGORIES } from "@/server/content";
import { PageTitle, EmptyState } from "@/components/ui";
import { ChallengeProgress } from "@/components/app/content-actions";

export const metadata = { title: "Conteúdos e desafios" };

export default async function Page({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const sp = await searchParams;
  const u = await requirePaid("/app/conteudos");
  const j = await getJourney(u.id);
  const feed = await getFeed(u.id, j.current.number, j.facts.opportunityId, sp.cat);
  const catLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label ?? c;
  return (
    <div>
      <PageTitle eyebrow={`Para você, na etapa ${j.current.number}${j.opportunity ? ` · ${j.opportunity.title}` : ""}`} title="Um motivo novo para voltar" />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Categorias">
        <Link href="/app/conteudos" className={`chip ${!sp.cat ? "!border-noite !bg-noite !text-white" : ""}`}>Tudo</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.value} href={`/app/conteudos?cat=${c.value}`} className={`chip ${sp.cat === c.value ? "!border-noite !bg-noite !text-white" : ""}`}>{c.label}</Link>
        ))}
      </nav>
      <div className="grid gap-4 lg:grid-cols-3">
        {feed.challenge && (
          <div className="rounded-card bg-noite p-5 text-white lg:row-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-sol">Desafio · +{feed.challenge.challengePoints} pontos</p>
            <p className="mt-2 font-display text-xl font-bold">{feed.challenge.title}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-white/80">{feed.challenge.body}</p>
            <div className="mt-4">
              <ChallengeProgress id={feed.challenge.id} count={feed.challenge.count} goal={feed.challenge.challengeGoal} sound={u.prefs.sound} />
            </div>
          </div>
        )}
        {feed.suggestion && (
          <div className="rounded-card bg-sol-light p-5">
            <p className="eyebrow text-[#7A5A00]">Nova oportunidade</p>
            <p className="mt-2 font-display text-lg font-bold">{feed.suggestion.opp.title}</p>
            <p className="mt-1 text-sm">Combina {feed.suggestion.score}% com você</p>
            <p className="mt-2 text-sm text-tinta-soft">{feed.suggestion.opp.description}</p>
          </div>
        )}
        {feed.articles.map((a) => (
          <Link key={a.id} href={`/app/conteudos/${a.slug}`} className={`rounded-card p-5 shadow-sm transition hover:ring-2 hover:ring-vira/20 ${a.read ? "bg-white/60" : "bg-white"}`}>
            <p className="eyebrow">{catLabel(a.category)} · {a.minutes} min{a.specific ? " · para o seu caminho" : ""}</p>
            <p className="mt-2 font-display text-lg font-bold text-noite">{a.title}</p>
            {a.read && <p className="mt-2 text-sm font-semibold text-vira">Lido ✓</p>}
          </Link>
        ))}
      </div>
      {!feed.articles.length && !feed.challenge && <EmptyState title="Nada novo nesta categoria por enquanto" />}
      <p className="mt-4 text-sm text-tinta-soft">Os conteúdos mudam conforme a sua etapa. Os lidos descem para o fim.</p>
    </div>
  );
}
