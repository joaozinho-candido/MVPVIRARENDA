import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { contents, opportunities } from "@/db/schema";
import { requireRole } from "@/server/session";
import { CATEGORIES } from "@/server/content";
import { PageTitle, Notice } from "@/components/ui";
import { AdminForm } from "@/components/admin/form";
import { saveContentAction } from "@/app/actions/admin";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;
  const sp = await searchParams;
  const c = id === "novo" ? null : await db.query.contents.findFirst({ where: eq(contents.id, id) });
  if (id !== "novo" && !c) notFound();
  const opps = await db.select({ id: opportunities.id, title: opportunities.title }).from(opportunities).orderBy(asc(opportunities.sortOrder));
  return (
    <div className="max-w-3xl">
      <PageTitle eyebrow="Conteúdo" title={c?.title ?? "Novo conteúdo"} />
      {sp.salvo && <Notice tone="green" className="mb-4">Salvo.</Notice>}
      <AdminForm action={saveContentAction} className="card space-y-4">
        {c && <input type="hidden" name="id" value={c.id} />}
        <label className="block"><span className="label">Título</span><input name="title" defaultValue={c?.title} className="field" required /></label>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block"><span className="label">Tipo</span><select name="kind" defaultValue={c?.kind ?? "article"} className="field"><option value="article">Artigo</option><option value="challenge">Desafio</option></select></label>
          <label className="block"><span className="label">Categoria</span><select name="category" defaultValue={c?.category ?? "vendas"} className="field">{CATEGORIES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
          <label className="block"><span className="label">Da etapa</span><input name="minStage" type="number" min={1} max={14} defaultValue={c?.minStage ?? 1} className="field" /></label>
          <label className="block"><span className="label">Até a etapa</span><input name="maxStage" type="number" min={1} max={14} defaultValue={c?.maxStage ?? 14} className="field" /></label>
          <label className="block"><span className="label">Minutos</span><input name="minutes" type="number" defaultValue={c?.minutes ?? 3} className="field" /></label>
          <label className="block"><span className="label">Meta do desafio</span><input name="challengeGoal" type="number" defaultValue={c?.challengeGoal ?? 0} className="field" /></label>
          <label className="block"><span className="label">Pontos do desafio</span><input name="challengePoints" type="number" defaultValue={c?.challengePoints ?? 0} className="field" /></label>
          <label className="block"><span className="label">Só para</span><select name="opportunityId" defaultValue={c?.opportunityId ?? ""} className="field"><option value="">Todas</option>{opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select></label>
        </div>
        <label className="block"><span className="label">Texto (## para títulos, - para listas)</span><textarea name="body" defaultValue={c?.body} rows={10} className="field py-2" required /></label>
        <div className="flex gap-2">
          <button name="intent" value="draft" className="btn-secondary">Salvar rascunho</button>
          <button name="intent" value="publish" className="btn-primary">Publicar</button>
        </div>
      </AdminForm>
    </div>
  );
}
