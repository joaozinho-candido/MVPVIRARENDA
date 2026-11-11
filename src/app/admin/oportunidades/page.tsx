import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { requireRole } from "@/server/session";
import { PageTitle, Pill } from "@/components/ui";

export default async function Page() {
  await requireRole(["admin", "editor"]);
  const rows = await db.select().from(opportunities).orderBy(asc(opportunities.sortOrder));
  return (
    <div>
      <PageTitle eyebrow="Biblioteca de oportunidades" title={`${rows.length} oportunidades`}>
        <Link href="/admin/oportunidades/nova" className="btn-primary btn-sm">+ Nova</Link>
      </PageTitle>
      <div className="card divide-y divide-tinta/5">
        {rows.map((o) => (
          <Link key={o.id} href={`/admin/oportunidades/${o.id}`} className="flex items-center justify-between py-3">
            <span className="font-medium">{o.title}</span>
            <Pill tone={o.status === "published" ? "green" : "gray"}>{o.status === "published" ? "Publicada" : "Rascunho"}</Pill>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-sm text-tinta-soft">Os exemplos da página inicial e as recomendações vêm desta biblioteca. Se faltar um recurso obrigatório, a oportunidade aparece com aviso de limite, nunca escondida.</p>
    </div>
  );
}
