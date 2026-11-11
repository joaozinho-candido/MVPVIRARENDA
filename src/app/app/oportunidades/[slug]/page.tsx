import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { requireUser, userHasAccess } from "@/server/session";
import { getRecommendations } from "@/server/profile";
import { ChooseButton } from "@/components/app/choose";
import { DifficultyDots, Pill } from "@/components/ui";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = await requireUser();
  const paid = u.role !== "user" || (await userHasAccess(u.id));
  const recs = await getRecommendations(u.id);
  const idx = recs.findIndex((r) => r.opp.slug === slug);
  if (idx < 0) notFound();
  // Antes de assinar, só a 1ª oportunidade fica completa
  if (!paid && idx > 0) redirect("/app/oportunidades");
  const { rec, opp } = recs[idx];
  const journey = await db.query.journeys.findFirst({ where: eq(journeys.userId, u.id) });
  const rows: [string, React.ReactNode][] = [
    ["Habilidades", opp.skillsText],
    ["Equipamentos", opp.equipmentText],
    ["Investimento", `${{ baixo: "Baixo", medio: "Médio", alto: "Alto" }[opp.investmentLevel]} · a partir de uns R$ ${opp.investmentMin}`],
    ["Tempo", opp.timeText],
    ["Dificuldade", <DifficultyDots key="d" value={opp.difficulty} />],
    ["Custos", opp.costsText],
    ["Preço sugerido", opp.suggestedPrice],
    ["Onde vender", opp.whereToSell],
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-white p-5 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-noite">{opp.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Pill>{opp.mode === "ambos" ? "Online ou presencial" : opp.mode === "online" ? "Online" : "Presencial"}</Pill>
          {opp.phoneOnly && <Pill>Só celular</Pill>}
          <span className="font-display text-2xl font-extrabold text-vira">{rec.score}%</span>
          {paid && idx < 3 && <ChooseButton id={opp.id} chosen={journey?.opportunityId === opp.id} className="btn-primary" />}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="card space-y-3 text-[15px]">
          <p><b>O que é:</b> {opp.description}</p>
          <p><b>Por que combina com você:</b> {rec.reasons.join("; ") || "combina com parte do seu perfil"}.</p>
          <p><b>Quem compra:</b> {opp.buyers}</p>
          <p><b>Como achar compradores:</b> {opp.howToFindBuyers}</p>
          <p className="rounded-xl bg-festa-light px-3 py-2 text-festa-dark"><b>Riscos e limites:</b> {opp.risks} {rec.limits.join(" ")}</p>
        </div>
        <dl className="card divide-y divide-tinta/10 text-[15px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-tinta-soft">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="text-sm text-tinta-soft">Valores entre colchetes ainda serão definidos pela equipe a partir de pesquisa local. Não são promessa de ganho.</p>
    </div>
  );
}
