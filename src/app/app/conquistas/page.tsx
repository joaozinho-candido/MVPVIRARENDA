import { requireUser } from "@/server/session";
import { getBadgeBoard, getHistory, getStats, phaseFor } from "@/server/gamification";
import { getJourney } from "@/server/journey";
import { PageTitle, Stat, EmptyState } from "@/components/ui";
import { dayMonth } from "@/lib/format";

export const metadata = { title: "Conquistas e histórico" };

export default async function Page() {
  const u = await requireUser();
  const [board, hist, stats, j] = await Promise.all([getBadgeBoard(u.id), getHistory(u.id, 40), getStats(u.id), getJourney(u.id)]);
  return (
    <div>
      <PageTitle eyebrow="Conquistas" title="Pontos, selos e marcos, sem pressão" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Pontos" value={stats.points} tone="yellow" />
            <Stat label="Fase" value={<span className="text-lg">{phaseFor(j.current.number)}</span>} tone="green" />
            <Stat label="Dias ativos" value={stats.activeDays} tone="coral" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {board.map((b) => (
              <div key={b.key} className={`flex flex-col items-center rounded-2xl p-4 text-center ${b.awardedAt ? "bg-white shadow-sm" : "bg-white/50"}`} title={b.description}>
                <span className={`text-3xl ${b.awardedAt ? "" : "grayscale opacity-40"}`} aria-hidden>{b.awardedAt ? b.emoji : "🔒"}</span>
                <span className="mt-2 text-sm font-semibold">{b.name}</span>
                <span className="text-xs text-tinta-soft">{b.awardedAt ? dayMonth(b.awardedAt) : b.description}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-tinta-soft">Contamos dias ativos, não dias seguidos: sumir uns dias não apaga nada.</p>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Histórico</p>
          {hist.length === 0 ? (
            <EmptyState title="Nada por aqui ainda" />
          ) : (
            <ol className="space-y-3">
              {hist.map((h) => (
                <li key={h.id} className="flex justify-between gap-3 text-[15px]">
                  <span>
                    <span className="text-tinta-soft">{dayMonth(h.createdAt)} · </span>
                    {h.title}
                  </span>
                  {h.points > 0 && <span className="shrink-0 font-semibold text-vira">+{h.points}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
