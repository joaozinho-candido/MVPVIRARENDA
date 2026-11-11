import Link from "next/link";
import { requireUser, userHasAccess } from "@/server/session";
import { getJourney } from "@/server/journey";
import { getStats, recentActiveDays } from "@/server/gamification";
import { getProfile, getRecommendations } from "@/server/profile";
import { dueReminders } from "@/server/crm";
import { quoteFor } from "@/server/billing/subscriptions";
import { MentorBubble, Notice, Stat, MentorAvatar } from "@/components/ui";
import { SubscribeCta } from "@/components/app/locked";
import { firstName } from "@/lib/format";
import { mentor } from "@/lib/mentors";

export const metadata = { title: "Jornada" };

export default async function Home({ searchParams }: { searchParams: Promise<{ bloqueado?: string }> }) {
  const sp = await searchParams;
  const u = await requireUser();
  const paid = u.role !== "user" || (await userHasAccess(u.id));
  const profile = await getProfile(u.id);

  if (!paid) {
    const recs = profile ? await getRecommendations(u.id) : [];
    const q = await quoteFor(u.id);
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold text-noite">Oi, {firstName(u.name)}!</h1>
        {sp.bloqueado && <Notice tone="yellow">Essa área faz parte do plano. Assine para liberar a jornada completa.</Notice>}
        {!profile ? (
          <MentorBubble name="Bia">
            <p>Vamos começar pelo seu retrato de talentos? Leva uns 5 minutos.</p>
            <Link href="/app/talentos/questionario" className="btn-primary mt-3">Fazer o questionário</Link>
          </MentorBubble>
        ) : (
          <>
            <MentorBubble name="Caio">
              Achei {Math.min(3, recs.length)} caminhos para você. O primeiro está aberto; os outros liberam com a assinatura.
            </MentorBubble>
            <Link href="/app/oportunidades" className="btn-primary">Ver meu resultado</Link>
          </>
        )}
        <SubscribeCta first={q.firstCents} price={q.recurringCents} />
      </div>
    );
  }

  if (!profile)
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold text-noite">Oi, {firstName(u.name)}!</h1>
        <MentorBubble name="Bia">
          <p>Primeiro passo: me conta sobre você. Com isso eu e o Caio escolhemos suas oportunidades.</p>
          <Link href="/app/talentos/questionario" className="btn-primary mt-3">Fazer o questionário</Link>
        </MentorBubble>
      </div>
    );

  const [j, stats, days, reminders] = await Promise.all([getJourney(u.id), getStats(u.id), recentActiveDays(u.id), dueReminders(u.id)]);
  const cur = j.current;
  const nextLocked = j.stages.find((s) => s.number > cur.number && s.status === "locked");
  const m = mentor(cur.mentor);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-noite sm:text-3xl">
          Oi, {firstName(u.name)}! Etapa {cur.number} de {j.stages.length}
        </h1>
        {j.opportunity && <p className="text-tinta-soft">{j.opportunity.title}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" aria-label={`Progresso: ${j.percent}%`}>
        {j.stages.map((s) => (
          <Link
            key={s.number}
            href={`/app/missoes#etapa-${s.number}`}
            title={`${s.number}. ${s.title}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${s.status === "done" ? "bg-vira text-white" : s.number === cur.number ? "bg-sol text-noite" : "bg-areia-dark text-tinta-soft"}`}
          >
            {s.status === "done" ? "✓" : s.number === cur.number ? s.number : ""}
          </Link>
        ))}
        <span className="ml-2 font-semibold text-vira">{j.percent}%</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-card bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <MentorAvatar name={cur.mentor} />
            <p className={`text-sm font-bold uppercase tracking-wide ${m.fg}`}>
              {cur.mentor} · Etapa {cur.number}
            </p>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-noite">{cur.title}</h2>
          {cur.status === "locked" ? (
            <p className="mt-2 text-tinta-soft">🔒 Abre quando você {cur.missing.join(" e ")}.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {cur.missions.map((mi) => (
                <li key={mi.id} className={mi.status === "completed" ? "text-vira" : mi.status === "todo" ? "text-tinta-soft" : "font-semibold"}>
                  {mi.status === "completed" ? "✓" : mi.status === "todo" ? "○" : "●"} {mi.title}
                  {mi.status === "in_progress" && " · em andamento"}
                  {mi.status === "paused" && " · pausada"}
                </li>
              ))}
            </ul>
          )}
          {j.nextMission && cur.status !== "locked" && (
            <Link href={`/app/missoes/${j.nextMission.id}`} className="btn-primary mt-5">
              {j.nextMission.status === "todo" ? "Começar missão" : "Continuar missão"}
            </Link>
          )}
          {j.nextMission?.autoKey === "opportunity_chosen" && <p className="mt-3 text-sm text-tinta-soft">Escolha seu caminho em Oportunidades para seguir.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 lg:content-start">
          <Stat label="Pontos" value={stats.points} tone="yellow" />
          <Stat label="Conquistas" value={stats.badgeCount} tone="green" />
          <div className="col-span-2 rounded-2xl bg-festa-light p-4 text-[15px]">
            🔥 {days} {days === 1 ? "dia" : "dias"} de atividade nesta semana. Pausou? Sua sequência te espera, sem perder nada.
          </div>
          {nextLocked && (
            <div className="col-span-2 rounded-2xl border border-dashed border-tinta/20 p-4 text-[15px] text-tinta-soft">
              🔒 Etapa {nextLocked.number} ({nextLocked.title}) libera quando você {nextLocked.missing.join(" e ")}.
            </div>
          )}
        </div>
      </div>

      {reminders.length > 0 && (
        <MentorBubble name="Nando">
          Você tem {reminders.length} {reminders.length === 1 ? "retorno" : "retornos"} para hoje:{" "}
          {reminders.slice(0, 3).map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <Link href={`/app/clientes/${r.id}`} className="link">{r.name}</Link>
            </span>
          ))}
          .
        </MentorBubble>
      )}
    </div>
  );
}
