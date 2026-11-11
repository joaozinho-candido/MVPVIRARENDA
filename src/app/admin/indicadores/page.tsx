import { requireRole } from "@/server/session";
import { usageIndicators } from "@/server/admin";
import { PageTitle, Stat } from "@/components/ui";

export default async function Page() {
  await requireRole(["admin"]);
  const u = await usageIndicators();
  const max = Math.max(1, ...u.byStage.map((s) => s.done));
  return (
    <div>
      <PageTitle eyebrow="Indicadores de uso" title="Como o produto está sendo usado" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ativos nos últimos 7 dias" value={u.active7} tone="green" />
        <Stat label="Contas de usuário" value={u.total} />
        <Stat label="Perfis de talento completos" value={u.profiles} tone="yellow" />
        <Stat label="Caminhos escolhidos" value={u.chosen} tone="coral" />
        <Stat label="Materiais criados" value={u.materials} />
        <Stat label="Clientes cadastrados" value={u.clients} />
        <Stat label="Lançamentos financeiros" value={u.finance} />
        <Stat label="Conteúdos lidos" value={u.reads} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="eyebrow mb-3">Missões concluídas por etapa</p>
          <div className="space-y-2">
            {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => {
              const v = u.byStage.find((s) => s.stage === n)?.done ?? 0;
              return (
                <div key={n} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-right text-tinta-soft">{n}</span>
                  <div className="h-3 flex-1 rounded-full bg-areia"><div className="h-3 rounded-full bg-vira" style={{ width: `${(v / max) * 100}%` }} /></div>
                  <span className="w-8 font-semibold">{v}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Oportunidades escolhidas</p>
          <ul className="space-y-1 text-[15px]">
            {u.byOpportunity.map((o) => <li key={o.title} className="flex justify-between"><span>{o.title}</span><b>{o.n}</b></li>)}
            {!u.byOpportunity.length && <li className="text-tinta-soft">Ainda nenhuma.</li>}
          </ul>
          <p className="mt-4 text-sm text-tinta-soft">{u.activities7} atividades registradas nos últimos 7 dias. Indicadores agregados, sem ler o conteúdo das pessoas.</p>
        </div>
      </div>
    </div>
  );
}
