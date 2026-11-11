import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { requireRole } from "@/server/session";
import { PageTitle, Notice, Pill } from "@/components/ui";
import { AdminForm } from "@/components/admin/form";
import { saveOpportunityAction } from "@/app/actions/admin";
import { QUESTIONS, SKILLS } from "@/lib/quiz";

const EQUIP = QUESTIONS.find((q) => q.id === "equipment")!.options;
const INTERESTS = QUESTIONS.find((q) => q.id === "interests")!.options;

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ salvo?: string }> }) {
  await requireRole(["admin", "editor"]);
  const { id } = await params;
  const sp = await searchParams;
  const o = id === "nova" ? null : await db.query.opportunities.findFirst({ where: eq(opportunities.id, id) });
  if (id !== "nova" && !o) notFound();
  const t = (name: string, label: string, value?: string | number, area = false) => (
    <div>
      <label className="label" htmlFor={`o-${name}`}>{label}</label>
      {area ? <textarea id={`o-${name}`} name={name} defaultValue={value} rows={2} className="field py-2" /> : <input id={`o-${name}`} name={name} defaultValue={value} className="field" />}
    </div>
  );
  const checks = (name: string, opts: { value: string; label: string }[], selected: string[]) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((x) => (
        <label key={x.value} className="chip cursor-pointer has-[:checked]:chip-on">
          <input type="checkbox" name={name} value={x.value} defaultChecked={selected.includes(x.value)} className="sr-only" />
          {x.label}
        </label>
      ))}
    </div>
  );
  return (
    <div>
      <PageTitle eyebrow="Oportunidade" title={o?.title ?? "Nova oportunidade"}>{o && <Pill tone={o.status === "published" ? "green" : "gray"}>{o.status === "published" ? "Publicada" : "Rascunho"}</Pill>}</PageTitle>
      {sp.salvo && <Notice tone="green" className="mb-4">Salvo.</Notice>}
      <AdminForm action={saveOpportunityAction} className="space-y-4">
        {o && <input type="hidden" name="id" value={o.id} />}
        <div className="card">
          <p className="eyebrow mb-3">Ficha (vista pelo usuário)</p>
          <div className="grid gap-3 md:grid-cols-2">
            {t("title", "Título", o?.title)}
            {t("buyers", "Quem compra", o?.buyers)}
            <div className="md:col-span-2">{t("description", "Descrição (o que é)", o?.description, true)}</div>
            {t("howToFindBuyers", "Como achar compradores", o?.howToFindBuyers)}
            {t("whereToSell", "Onde vender", o?.whereToSell)}
            <div className="md:col-span-2">{t("risks", "Riscos e limites", o?.risks, true)}</div>
            {t("skillsText", "Habilidades", o?.skillsText)}
            {t("equipmentText", "Equipamentos", o?.equipmentText)}
            {t("timeText", "Tempo", o?.timeText)}
            {t("costsText", "Custos", o?.costsText)}
            {t("suggestedPrice", "Preço sugerido", o?.suggestedPrice)}
            <div>
              <label className="label" htmlFor="o-investmentLevel">Investimento</label>
              <select id="o-investmentLevel" name="investmentLevel" defaultValue={o?.investmentLevel ?? "baixo"} className="field"><option value="baixo">Baixo</option><option value="medio">Médio</option><option value="alto">Alto</option></select>
            </div>
            <div>
              <label className="label" htmlFor="o-difficulty">Dificuldade</label>
              <select id="o-difficulty" name="difficulty" defaultValue={o?.difficulty ?? 2} className="field"><option value={1}>Baixa</option><option value={2}>Média</option><option value={3}>Alta</option></select>
            </div>
            <div>
              <label className="label" htmlFor="o-mode">Online ou presencial</label>
              <select id="o-mode" name="mode" defaultValue={o?.mode ?? "online"} className="field"><option value="online">Online</option><option value="presencial">Presencial</option><option value="ambos">Ambos</option></select>
            </div>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Compatibilidade (usada no cálculo)</p>
          <div className="grid gap-4">
            <div><p className="label">Equipamentos obrigatórios</p>{checks("requiredEquipment", EQUIP, o?.requiredEquipment ?? [])}</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="phoneOnly" defaultChecked={o?.phoneOnly} className="h-5 w-5 accent-vira" /> Dá para fazer só com celular</label>
            <div><p className="label">Habilidades que somam pontos</p>{checks("scoringSkills", SKILLS, o?.scoringSkills ?? [])}</div>
            <div><p className="label">Interesses que somam pontos</p>{checks("scoringInterests", INTERESTS, o?.scoringInterests ?? [])}</div>
            <div className="grid gap-3 sm:grid-cols-4">
              {t("investmentMin", "Investimento mínimo (R$)", o?.investmentMin ?? 0)}
              {t("minHours", "Horas por dia (mín.)", o ? String(o.minHoursPerDay / 10).replace(".", ",") : "1")}
              <div>
                <label className="label" htmlFor="o-salesIntensity">Exige vender ativamente</label>
                <select id="o-salesIntensity" name="salesIntensity" defaultValue={o?.salesIntensity ?? "medio"} className="field"><option value="baixo">Pouco</option><option value="medio">Médio</option><option value="alto">Muito</option></select>
              </div>
              {t("sortOrder", "Ordem", o?.sortOrder ?? 0)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button name="intent" value="draft" className="btn-secondary">Salvar rascunho</button>
          <button name="intent" value="publish" className="btn-primary">Publicar</button>
        </div>
      </AdminForm>
    </div>
  );
}
