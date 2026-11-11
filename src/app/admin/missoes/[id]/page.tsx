import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { missions, missionVariants, opportunities, stages } from "@/db/schema";
import { requireRole } from "@/server/session";
import { PageTitle, Notice, MentorBubble } from "@/components/ui";
import { AdminForm } from "@/components/admin/form";
import { FieldsEditor } from "@/components/admin/fields-editor";
import { saveMissionAction } from "@/app/actions/admin";
import { MENTOR_ORDER } from "@/lib/mentors";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string; etapa?: string; previa?: string }> }) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;
  const sp = await searchParams;
  const m = id === "nova" ? null : await db.query.missions.findFirst({ where: eq(missions.id, id) });
  if (id !== "nova" && !m) notFound();
  const st = await db.select().from(stages).orderBy(asc(stages.number));
  const opps = await db.select({ id: opportunities.id, title: opportunities.title }).from(opportunities).orderBy(asc(opportunities.sortOrder));
  const variants = m ? await db.select().from(missionVariants).where(eq(missionVariants.missionId, m.id)) : [];
  const v = variants[0];
  const all = await db.select({ key: missions.key, title: missions.title }).from(missions).orderBy(asc(missions.stageNumber), asc(missions.order));
  return (
    <div>
      <PageTitle eyebrow="Editor de missões" title={m?.title ?? "Nova missão"} />
      {sp.salvo && <Notice tone="green" className="mb-4">Salvo. Mudar uma missão publicada não apaga respostas de quem já fez.</Notice>}
      {m?.autoKey && <Notice tone="yellow" className="mb-4">Missão automática ({m.autoKey}): concluída pelo sistema quando a ação acontece.</Notice>}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <AdminForm action={saveMissionAction} className="card space-y-4">
          {m && <input type="hidden" name="id" value={m.id} />}
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block sm:col-span-2"><span className="label">Etapa</span><select name="stageNumber" defaultValue={m?.stageNumber ?? sp.etapa ?? 1} className="field">{st.map((s) => <option key={s.number} value={s.number}>{s.number} · {s.title}</option>)}</select></label>
            <label className="block"><span className="label">Mentor</span><select name="mentor" defaultValue={m?.mentor ?? "Duda"} className="field">{MENTOR_ORDER.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="block"><span className="label">Pontos</span><input name="points" type="number" defaultValue={m?.points ?? 50} className="field" /></label>
            <label className="block"><span className="label">Ordem</span><input name="order" type="number" defaultValue={m?.order ?? 1} className="field" /></label>
            <label className="block"><span className="label">Minutos</span><input name="minutes" type="number" defaultValue={m?.minutes ?? 10} className="field" /></label>
            <label className="block sm:col-span-2"><span className="label">Depende de</span><select name="dependsOnKey" defaultValue={m?.dependsOnKey ?? ""} className="field"><option value="">—</option>{all.filter((x) => x.key !== m?.key).map((x) => <option key={x.key} value={x.key}>{x.title}</option>)}</select></label>
          </div>
          <label className="block"><span className="label">Título</span><input name="title" defaultValue={m?.title} className="field" required /></label>
          <label className="block"><span className="label">Objetivo</span><textarea name="objective" defaultValue={m?.objective} rows={2} className="field py-2" required /></label>
          <label className="block"><span className="label">Explicação</span><textarea name="explanation" defaultValue={m?.explanation} rows={3} className="field py-2" /></label>
          <label className="block"><span className="label">Exemplo</span><input name="example" defaultValue={m?.example} className="field" /></label>
          <label className="block"><span className="label">Ferramentas (separadas por vírgula)</span><input name="tools" defaultValue={m?.tools.join(", ")} className="field" /></label>
          <div><p className="label">Campos que o usuário preenche</p><FieldsEditor initial={m?.fields ?? []} /></div>
          <label className="block"><span className="label">Checklist (um item por linha)</span><textarea name="checklist" defaultValue={m?.checklist.join("\n")} rows={3} className="field py-2" /></label>
          <div className="rounded-2xl bg-areia p-4">
            <p className="label">Versão para uma oportunidade (troca exemplo e ferramentas)</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <select name="variantOpportunityId" defaultValue={v?.opportunityId ?? ""} className="field"><option value="">Vale para todas</option>{opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
              <input name="variantExample" defaultValue={v?.example} placeholder="Exemplo específico" className="field" />
              <input name="variantTools" defaultValue={v?.tools.join(", ")} placeholder="Ferramentas" className="field" />
            </div>
          </div>
          <div className="flex gap-2">
            <button name="intent" value="draft" className="btn-secondary">Salvar rascunho</button>
            <button name="intent" value="publish" className="btn-primary">Publicar missão</button>
          </div>
        </AdminForm>
        {m && (
          <div className="space-y-3">
            <p className="eyebrow">Ver como o usuário vê</p>
            <div className="rounded-card bg-areia p-4">
              <p className="text-sm text-tinta-soft">Etapa {m.stageNumber} · cerca de {m.minutes} min</p>
              <p className="font-display text-xl font-bold">{m.title}</p>
              <MentorBubble name={m.mentor} className="mt-3"><b>Objetivo:</b> {m.objective}</MentorBubble>
              {m.example && <p className="mt-3 rounded-xl bg-sol-light p-3 text-sm"><b>Exemplo:</b> {m.example}</p>}
              {m.fields.map((f) => <div key={f.key} className="mt-3"><p className="label">{f.label}</p><div className="field bg-white" /></div>)}
              {m.checklist.map((c) => <p key={c} className="mt-2 text-sm">☐ {c}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
