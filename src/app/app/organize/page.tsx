import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { legalContents } from "@/db/schema";
import { requirePaid } from "@/server/session";
import { listPublishedGuides } from "@/server/legal";
import { getJourney } from "@/server/journey";
import { DEFAULT_QUESTIONS } from "@/server/roteiro";
import { PageTitle, MentorAvatar, Notice } from "@/components/ui";
import { SimpleMarkdown } from "@/components/legal-doc";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Organize seu negócio" };

export default async function Page({ searchParams }: { searchParams: Promise<{ guia?: string }> }) {
  const sp = await searchParams;
  const u = await requirePaid("/app/organize");
  const guides = await listPublishedGuides();
  const all = await db.select({ slug: legalContents.slug, title: legalContents.title }).from(legalContents).orderBy(asc(legalContents.sortOrder));
  const soon = all.filter((a) => !guides.some((g) => g.slug === a.slug));
  const g = guides.find((x) => x.slug === sp.guia) ?? guides[0];
  const j = await getJourney(u.id);
  const contador = j.stages.flatMap((s) => s.missions).find((m) => m.key === "contador");
  return (
    <div>
      <PageTitle eyebrow="Rosa · organize seu negócio" title="Orienta com fonte oficial e manda para o profissional certo" />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_300px]">
        <nav aria-label="Guias" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          <p className="eyebrow hidden lg:block">Guias</p>
          {guides.map((x) => (
            <Link key={x.slug} href={`/app/organize?guia=${x.slug}`} className={`shrink-0 rounded-xl px-3 py-2.5 text-[15px] ${x.slug === g?.slug ? "bg-noite text-white" : "bg-white"}`}>
              {x.title}
            </Link>
          ))}
          {soon.map((x) => (
            <span key={x.slug} className="shrink-0 rounded-xl px-3 py-2.5 text-[15px] text-tinta-soft">
              {x.title} · em breve
            </span>
          ))}
        </nav>
        <article className="card">
          {g ? (
            <>
              <h2 className="font-display text-2xl font-bold text-noite">{g.title}</h2>
              <p className="mt-2 text-tinta-soft">{g.summary}</p>
              <div className="mt-4 text-[15px]"><SimpleMarkdown text={g.body} /></div>
              <div className="mt-5 space-y-1 rounded-2xl bg-areia p-4 text-sm">
                <p>Fonte: <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="link">{g.sourceUrl.replace(/^https?:\/\//, "")}</a> · consultada em {dateBR(g.sourceCheckedAt)}</p>
                <p>Revisado por: {g.reviewerName}, {g.reviewerRegistry} em {dateBR(g.approvedAt)}</p>
                <p className="font-semibold">Conteúdo informativo. Não é parecer contábil ou jurídico.</p>
              </div>
            </>
          ) : (
            <Notice tone="gray">
              <p className="font-semibold">Os guias ainda estão em revisão por profissionais habilitados.</p>
              <p className="mt-2">Enquanto isso, não temos informação confirmada para te passar sobre impostos, formalização ou contratos. Procure um contador (com CRC ativo) ou um advogado (com OAB ativa). A Rosa te ajuda a preparar as perguntas ao lado.</p>
            </Notice>
          )}
        </article>
        <aside className="rounded-card bg-noite p-5 text-white">
          <div className="flex items-center gap-2">
            <MentorAvatar name="Rosa" size="sm" />
            <p className="text-sm font-bold uppercase tracking-wide text-sol">Rosa · sua próxima missão</p>
          </div>
          <p className="mt-3 font-display text-xl font-bold">Conversar com um contador</p>
          <p className="mt-2 text-sm text-white/80">Você está se preparando para começar a vender. Agora é importante entender quais obrigações se aplicam à sua atividade.</p>
          <p className="mt-4 text-sm font-semibold">Leve estas perguntas:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/90">
            {DEFAULT_QUESTIONS.slice(0, 3).map((q) => <li key={q}>{q}</li>)}
          </ul>
          <a href="/api/app/roteiro" className="btn-highlight btn-sm mt-5 w-full">Baixar roteiro da consulta</a>
          {contador && (
            <Link href={`/app/missoes/${contador.id}`} className="mt-3 block text-center text-sm text-white underline">
              {contador.status === "completed" ? "✓ Missão concluída · ver" : "Abrir a missão"}
            </Link>
          )}
          <p className="mt-4 text-xs text-white/60">Quando procurar: antes de vender com frequência, ao pensar em formalizar, ao receber de empresas ou em dúvida sobre impostos. Para contratos e direitos, um advogado.</p>
        </aside>
      </div>
    </div>
  );
}
