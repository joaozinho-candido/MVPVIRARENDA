import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePaid } from "@/server/session";
import { getMissionForUser } from "@/server/journey";
import { MentorBubble, Notice } from "@/components/ui";
import { MissionForm } from "@/components/app/mission-form";

const AUTO_LINK: Record<string, { href: string; label: string }> = {
  profile_complete: { href: "/app/talentos/questionario", label: "Responder o questionário" },
  opportunity_chosen: { href: "/app/oportunidades", label: "Escolher meu caminho" },
  first_material: { href: "/app/materiais", label: "Abrir Materiais de venda" },
  first_client: { href: "/app/clientes/novo", label: "Cadastrar um contato" },
  first_sale: { href: "/app/financeiro?novo=sale", label: "Registrar uma venda" },
};

const TOOL_LINK: Record<string, string> = {
  "Minhas oportunidades": "/app/oportunidades",
  "Meu perfil de talentos": "/app/talentos",
  "Materiais de venda": "/app/materiais",
  "Meus clientes": "/app/clientes",
  Financeiro: "/app/financeiro",
  "Organize seu negócio": "/app/organize",
  Conteúdos: "/app/conteudos",
  "Roteiro da consulta (baixar)": "/api/app/roteiro",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requirePaid();
  const ctx = await getMissionForUser(u.id, id);
  if (!ctx) notFound();
  const { mission: m, stage: s } = ctx;
  const idx = s.missions.findIndex((x) => x.id === m.id) + 1;
  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/app/missoes#etapa-${s.number}`} className="link text-sm">← Etapa {s.number}</Link>
      <p className="mt-3 text-sm text-tinta-soft">
        Etapa {s.number} · Missão {idx} de {s.missions.length} · cerca de {m.minutes} min · +{m.points} pontos
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold text-noite">{m.title}</h1>
      {s.status === "locked" ? (
        <Notice tone="gray" className="mt-5">🔒 Esta etapa abre quando você {s.missing.join(" e ")}.</Notice>
      ) : (
        <>
          <MentorBubble name={m.mentor} className="mt-5">
            <p><b>Objetivo:</b> {m.objective}</p>
          </MentorBubble>
          <details className="mt-4 rounded-2xl bg-white p-4 shadow-sm" open={!m.fields.length && !m.checklist.length}>
            <summary className="cursor-pointer font-semibold text-vira">Entenda o porquê ▾</summary>
            <p className="mt-2 text-[15px] leading-relaxed">{m.explanation}</p>
          </details>
          {m.example && (
            <p className="mt-3 rounded-2xl bg-sol-light p-4 text-[15px]">
              <b>Exemplo:</b> {m.example}
            </p>
          )}
          {m.tools.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-tinta-soft">Ferramentas:</span>
              {m.tools.map((t) =>
                TOOL_LINK[t] ? (
                  <Link key={t} href={TOOL_LINK[t]} className="chip">{t}</Link>
                ) : (
                  <span key={t} className="chip">{t}</span>
                ),
              )}
            </div>
          )}
          <div className="mt-6">
            {m.autoKey ? (
              m.status === "completed" ? (
                <Notice tone="green">✓ Missão concluída automaticamente.</Notice>
              ) : (
                <div className="card">
                  <p>Esta missão conclui sozinha quando você fizer a ação abaixo.</p>
                  <Link href={AUTO_LINK[m.autoKey].href} className="btn-primary mt-4">{AUTO_LINK[m.autoKey].label}</Link>
                </div>
              )
            ) : (
              <MissionForm
                missionId={m.id}
                stageNumber={s.number}
                fields={m.fields}
                checklist={m.checklist}
                initialAnswers={m.answers}
                initialChecks={m.checks}
                completed={m.status === "completed"}
                sound={u.prefs.sound}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
