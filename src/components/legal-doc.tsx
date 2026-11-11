import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { dateBR } from "@/lib/format";
import { Pill } from "./ui";

/** Renderiza markdown simples (## títulos, listas com -, parágrafos). Conteúdo vem só do banco/admin. */
export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-4 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} id={`s${i}`} className="scroll-mt-24 pt-2 font-display text-xl font-bold text-noite">{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        return (
          <p key={i} className="whitespace-pre-line">
            {b}
          </p>
        );
      })}
    </div>
  );
}

export async function LegalDocPage({ kind }: { kind: "terms" | "privacy" | "cookies" }) {
  const doc = (await db.select().from(legalDocuments).where(and(eq(legalDocuments.kind, kind), eq(legalDocuments.status, "published"))).orderBy(desc(legalDocuments.updatedAt)).limit(1))[0];
  if (!doc) return <p className="p-8">Documento em preparação.</p>;
  const sections = doc.body.split(/\n{2,}/).map((b, i) => ({ b, i })).filter((x) => x.b.startsWith("## "));
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[220px_1fr]">
      <nav className="hidden lg:block" aria-label="Nesta página">
        <p className="eyebrow mb-3">Nesta página</p>
        <ol className="space-y-2 text-sm">
          {sections.map((s) => (
            <li key={s.i}>
              <a href={`#s${s.i}`} className="text-tinta-soft hover:text-noite">{s.b.slice(3)}</a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="card">
        <div className="flex flex-wrap items-center gap-2">
          {!doc.lawyerReviewed && <Pill tone="yellow">Rascunho · aguardando advogado</Pill>}
          <span className="text-sm text-tinta-soft">Versão {doc.version} · atualizada em {dateBR(doc.updatedAt)}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-noite">{doc.title}</h1>
        <div className="mt-4 rounded-2xl bg-vira-light p-4 text-[15px]">
          <p className="mb-1 font-semibold">Resumo</p>
          {doc.summary}
        </div>
        <div className="mt-6">
          <SimpleMarkdown text={doc.body} />
        </div>
      </article>
    </div>
  );
}
