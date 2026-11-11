import Link from "next/link";
import { requireRole } from "@/server/session";
import { listAllLegal, LEGAL_STATUS } from "@/server/legal";
import { PageTitle, Pill } from "@/components/ui";
import { dateBR } from "@/lib/format";

const TONE = { draft: "gray", in_review: "yellow", approved: "green", published: "dark", outdated: "coral" } as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const u = await requireRole(["admin", "editor", "reviewer"]);
  const sp = await searchParams;
  const all = await listAllLegal();
  const rows = sp.s ? all.filter((x) => x.status === sp.s) : all;
  return (
    <div>
      <PageTitle eyebrow="Revisão jurídica e contábil" title="Nada jurídico vai ao ar sem fonte, data e revisor">
        {u.role !== "reviewer" && <Link href="/admin/revisao/novo" className="btn-primary btn-sm">+ Novo conteúdo</Link>}
      </PageTitle>
      <nav className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/revisao" className={`chip ${!sp.s ? "!border-noite !bg-noite !text-white" : ""}`}>Todos · {all.length}</Link>
        {LEGAL_STATUS.map((s) => (
          <Link key={s.value} href={`/admin/revisao?s=${s.value}`} className={`chip ${sp.s === s.value ? "!border-noite !bg-noite !text-white" : ""}`}>{s.label} · {all.filter((x) => x.status === s.value).length}</Link>
        ))}
      </nav>
      <div className="card divide-y divide-tinta/5">
        {rows.map((c) => (
          <Link key={c.id} href={`/admin/revisao/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span><span className="font-medium">{c.title}</span> <span className="text-sm text-tinta-soft">· {c.area === "contabil" ? "contábil" : "jurídico"}{c.reviewAgainAt ? ` · revisar de novo em ${dateBR(c.reviewAgainAt)}` : ""}</span></span>
            <Pill tone={TONE[c.status]}>{LEGAL_STATUS.find((s) => s.value === c.status)!.label}</Pill>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-sm text-tinta-soft">Conteúdo vencido volta sozinho para “Desatualizado” e sai do ar. Só o que estiver publicado aparece para o usuário.</p>
    </div>
  );
}
