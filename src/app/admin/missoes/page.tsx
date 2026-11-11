import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { stages, missions } from "@/db/schema";
import { requireRole } from "@/server/session";
import { PageTitle, Pill } from "@/components/ui";
import { AdminForm } from "@/components/admin/form";
import { saveStageAction } from "@/app/actions/admin";
import { MENTOR_ORDER } from "@/lib/mentors";

const CONDS = [["profile_complete", "Perfil completo"], ["opportunity_chosen", "Oportunidade escolhida"], ["first_sale", "1ª venda registrada"], ["records_30_days", "30 dias de registros"]] as const;

export default async function Page() {
  await requireRole(["admin", "editor"]);
  const st = await db.select().from(stages).orderBy(asc(stages.number));
  const ms = await db.select().from(missions).orderBy(asc(missions.stageNumber), asc(missions.order));
  return (
    <div>
      <PageTitle eyebrow="Editor de missões" title="14 etapas, cada uma com 2 a 4 missões" />
      <div className="space-y-3">
        {st.map((s) => (
          <details key={s.number} className="card">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span className="font-display text-lg font-bold">{s.number}. {s.title} <span className="text-sm font-normal text-tinta-soft">· {s.mentor} · abre: {s.unlockHint}</span></span>
              <span className="text-sm text-tinta-soft">{ms.filter((m) => m.stageNumber === s.number).length} missões</span>
            </summary>
            <ul className="mt-3 divide-y divide-tinta/5">
              {ms.filter((m) => m.stageNumber === s.number).map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <Link href={`/admin/missoes/${m.id}`} className="link">{m.order}. {m.title}</Link>
                  <span className="flex gap-2">{m.autoKey && <Pill>automática</Pill>}<Pill tone={m.status === "published" ? "green" : "gray"}>{m.status === "published" ? "Publicada" : "Rascunho"}</Pill><span className="text-sm text-tinta-soft">+{m.points}</span></span>
                </li>
              ))}
            </ul>
            <Link href={`/admin/missoes/nova?etapa=${s.number}`} className="btn-ghost btn-sm mt-2 !px-0">+ Missão nesta etapa</Link>
            <AdminForm action={saveStageAction} className="mt-3 grid gap-3 rounded-2xl bg-areia p-4 sm:grid-cols-2">
              <input type="hidden" name="number" value={s.number} />
              <label className="block"><span className="label">Título</span><input name="title" defaultValue={s.title} className="field" /></label>
              <label className="block"><span className="label">Mentor</span><select name="mentor" defaultValue={s.mentor} className="field">{MENTOR_ORDER.map((m) => <option key={m}>{m}</option>)}</select></label>
              <label className="block"><span className="label">Abre quando concluir as etapas (números)</span><input name="unlockStages" defaultValue={s.unlockStages.join(", ")} className="field" placeholder="Ex.: 7, 9, 11" /></label>
              <label className="block"><span className="label">Texto curto de desbloqueio</span><input name="unlockHint" defaultValue={s.unlockHint} className="field" /></label>
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                {CONDS.map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 text-sm"><input type="checkbox" name="unlockConditions" value={v} defaultChecked={s.unlockConditions.includes(v)} className="h-4 w-4 accent-vira" /> {l}</label>
                ))}
              </div>
              <button className="btn-secondary btn-sm w-fit">Salvar etapa</button>
            </AdminForm>
          </details>
        ))}
      </div>
    </div>
  );
}
