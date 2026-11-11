import { notFound } from "next/navigation";
import { requireRole } from "@/server/session";
import { getLegal, LEGAL_STATUS } from "@/server/legal";
import { PageTitle, Pill, Notice } from "@/components/ui";
import { AdminForm } from "@/components/admin/form";
import { LegalButtons } from "@/components/admin/legal-actions";
import { saveLegalAction, commentLegalAction } from "@/app/actions/admin";
import { dateTimeBR } from "@/lib/format";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  const u = await requireRole(["admin", "editor", "reviewer"]);
  const { id } = await params;
  const sp = await searchParams;
  const data = id === "novo" ? null : await getLegal(id).catch(() => null);
  if (id !== "novo" && !data) notFound();
  const c = data?.content;
  const canEdit = u.role !== "reviewer";
  return (
    <div>
      <PageTitle eyebrow="Revisão jurídica e contábil" title={c?.title ?? "Novo conteúdo"}>{c && <Pill tone="yellow">{LEGAL_STATUS.find((s) => s.value === c.status)!.label}</Pill>}</PageTitle>
      {sp.salvo && <Notice tone="green" className="mb-4">Salvo{c && c.status === "draft" ? " como rascunho. Alterar um texto revisado o devolve para Rascunho." : "."}</Notice>}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <AdminForm action={saveLegalAction} className="card space-y-3">
          {c && <input type="hidden" name="id" value={c.id} />}
          <fieldset disabled={!canEdit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <label className="block"><span className="label">Título</span><input name="title" defaultValue={c?.title} className="field" required /></label>
              <label className="block"><span className="label">Área</span><select name="area" defaultValue={c?.area ?? "contabil"} className="field"><option value="contabil">Contábil</option><option value="juridico">Jurídico</option></select></label>
            </div>
            <label className="block"><span className="label">Resumo</span><input name="summary" defaultValue={c?.summary} className="field" /></label>
            <label className="block"><span className="label">Texto</span><textarea name="body" defaultValue={c?.body} rows={10} className="field py-2" required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="label">Fonte oficial (link)</span><input name="sourceUrl" defaultValue={c?.sourceUrl} className="field" placeholder="https://www.gov.br/..." /></label>
              <label className="block"><span className="label">Consultada em</span><input type="date" name="sourceCheckedAt" defaultValue={c?.sourceCheckedAt ?? ""} className="field" /></label>
              <label className="block"><span className="label">Revisor (nome)</span><input name="reviewerName" defaultValue={c?.reviewerName} className="field" /></label>
              <label className="block"><span className="label">Registro (CRC/OAB)</span><input name="reviewerRegistry" defaultValue={c?.reviewerRegistry} className="field" /></label>
              <label className="block"><span className="label">Revisar de novo em</span><input type="date" name="reviewAgainAt" defaultValue={c?.reviewAgainAt ?? ""} className="field" /></label>
            </div>
            {canEdit && <button className="btn-secondary">Salvar</button>}
          </fieldset>
          {!canEdit && <p className="text-sm text-tinta-soft">Revisores comentam e aprovam; a edição do texto é feita por editores.</p>}
        </AdminForm>
        {c && (
          <div className="space-y-4">
            <div className="card"><p className="eyebrow mb-3">Fluxo</p><LegalButtons id={c.id} status={c.status} role={u.role} /></div>
            <div className="card">
              <p className="eyebrow mb-3">Comentários e registro</p>
              <ol className="space-y-2 text-sm">
                {data!.comments.map((x) => (
                  <li key={x.id}><span className="text-tinta-soft">{dateTimeBR(x.createdAt)} · {x.authorName}</span><br /><b>{x.action}</b>{x.message && `: ${x.message}`}</li>
                ))}
              </ol>
              <AdminForm action={commentLegalAction} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={c.id} />
                <textarea name="message" rows={2} className="field py-2" placeholder="Comentar…" aria-label="Comentário" />
                <button className="btn-secondary btn-sm">Comentar</button>
              </AdminForm>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
