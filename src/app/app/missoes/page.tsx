import Link from "next/link";
import { requirePaid } from "@/server/session";
import { getJourney } from "@/server/journey";
import { MentorAvatar, PageTitle, Pill } from "@/components/ui";

export const metadata = { title: "Missões" };

export default async function Page() {
  const u = await requirePaid("/app/missoes");
  const j = await getJourney(u.id);
  const inProgress = j.stages.flatMap((s) => s.missions.filter((m) => m.status === "in_progress" || m.status === "paused").map((m) => ({ m, s })));
  return (
    <div>
      <PageTitle eyebrow={`${j.completedMissions} de ${j.totalMissions} missões · ${j.percent}%`} title="Jornada e missões" />
      {inProgress.length > 0 && (
        <section className="mb-6">
          <p className="eyebrow mb-2">Em andamento</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {inProgress.map(({ m }) => (
              <Link key={m.id} href={`/app/missoes/${m.id}`} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <span className="font-medium">{m.title}</span>
                <span className="text-sm text-vira">{m.status === "paused" ? "Pausada · Retomar" : "Continuar"} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <ol className="space-y-3">
        {j.stages.map((s) => (
          <li key={s.number} id={`etapa-${s.number}`} className={`scroll-mt-20 rounded-card p-5 shadow-sm ${s.status === "locked" ? "bg-white/60" : "bg-white"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <MentorAvatar name={s.mentor} size="sm" />
                <h2 className="font-display text-lg font-bold text-noite">
                  {s.number}. {s.title}
                </h2>
              </div>
              {s.status === "done" ? <Pill tone="green">✓ Concluída · pode refazer</Pill> : s.status === "locked" ? <Pill>🔒 Bloqueada</Pill> : <Pill tone="yellow">{s.doneCount} de {s.missions.length}</Pill>}
            </div>
            {s.status === "locked" ? (
              <p className="mt-2 text-sm text-tinta-soft">
                Abre quando você {s.missing.join(" e ")}.{" "}
                {s.missing.some((x) => x.includes("oportunidade")) && <Link href="/app/oportunidades" className="link">Escolher agora</Link>}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-tinta/5">
                {s.missions.map((m) => (
                  <li key={m.id}>
                    <Link href={`/app/missoes/${m.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2">
                      <span className={m.status === "completed" ? "text-vira" : ""}>
                        {m.status === "completed" ? "✓" : m.status === "todo" ? "○" : "●"} {m.title}
                        <span className="ml-2 text-xs text-tinta-soft">~{m.minutes} min · +{m.points}</span>
                      </span>
                      <span className="shrink-0 text-sm text-vira">{m.status === "completed" ? "Editar" : m.status === "todo" ? "Fazer" : "Continuar"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
