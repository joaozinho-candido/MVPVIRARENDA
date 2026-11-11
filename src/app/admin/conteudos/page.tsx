import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { contents } from "@/db/schema";
import { requireRole } from "@/server/session";
import { CATEGORIES } from "@/server/content";
import { PageTitle, Pill } from "@/components/ui";

export default async function Page() {
  await requireRole(["admin", "editor"]);
  const rows = await db.select().from(contents).orderBy(asc(contents.minStage), asc(contents.title));
  return (
    <div>
      <PageTitle eyebrow="Conteúdo contínuo" title="Conteúdos e desafios por etapa">
        <Link href="/admin/conteudos/novo" className="btn-primary btn-sm">+ Novo</Link>
      </PageTitle>
      <div className="card table-wrap">
        <table className="tbl">
          <thead><tr><th>Título</th><th>Tipo</th><th>Categoria</th><th>Etapas</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/conteudos/${c.id}`} className="link">{c.title}</Link>{c.opportunityId && <div className="text-xs text-tinta-soft">específico de uma oportunidade</div>}</td>
                <td>{c.kind === "challenge" ? "Desafio" : "Artigo"}</td>
                <td>{CATEGORIES.find((x) => x.value === c.category)?.label}</td>
                <td>{c.minStage}–{c.maxStage}</td>
                <td><Pill tone={c.status === "published" ? "green" : "gray"}>{c.status === "published" ? "Publicado" : "Rascunho"}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-tinta-soft">Cada pessoa vê só o que corresponde à etapa atual (e à oportunidade escolhida). Lidos descem para o fim.</p>
    </div>
  );
}
