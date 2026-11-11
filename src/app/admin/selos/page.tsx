import { asc } from "drizzle-orm";
import { db } from "@/db";
import { badges } from "@/db/schema";
import { requireRole } from "@/server/session";
import { PageTitle } from "@/components/ui";
import { AdminForm } from "@/components/admin/form";
import { saveBadgeAction } from "@/app/actions/admin";

export default async function Page() {
  await requireRole(["admin"]);
  const rows = await db.select().from(badges).orderBy(asc(badges.sortOrder));
  return (
    <div>
      <PageTitle eyebrow="Gamificação" title="Selos e pontos" />
      <p className="mb-4 text-sm text-tinta-soft">Pontos de cada missão são definidos no editor de missões. Cada etapa completa vale +100 pontos de marco.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((b) => (
          <AdminForm key={b.key} action={saveBadgeAction} className="card grid grid-cols-[70px_1fr] gap-2">
            <input type="hidden" name="key" value={b.key} />
            <input name="emoji" defaultValue={b.emoji} className="field text-center text-xl" aria-label="Emoji" />
            <input name="name" defaultValue={b.name} className="field" aria-label="Nome" />
            <input name="description" defaultValue={b.description} className="field col-span-2" aria-label="Descrição" />
            <div className="col-span-2 flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">Pontos <input name="points" type="number" defaultValue={b.points} className="field w-24" /></label>
              <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={b.active} className="h-4 w-4 accent-vira" /> Ativo</label>
              <span className="text-tinta-soft">Regra: <code>{b.rule}</code></span>
              <button className="btn-secondary btn-sm ml-auto">Salvar</button>
            </div>
          </AdminForm>
        ))}
      </div>
    </div>
  );
}
