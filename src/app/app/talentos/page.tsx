import Link from "next/link";
import { requireUser } from "@/server/session";
import { getProfile } from "@/server/profile";
import { labelsFor, labelFor } from "@/lib/quiz";
import { MentorBubble, PageTitle, EmptyState } from "@/components/ui";

export const metadata = { title: "Meu perfil de talentos" };

export default async function Page() {
  const u = await requireUser();
  const p = await getProfile(u.id);
  if (!p)
    return (
      <EmptyState title="Você ainda não respondeu o questionário">
        <Link href="/app/talentos/questionario" className="btn-primary mt-3">Responder agora</Link>
      </EmptyState>
    );
  const a = p.answers;
  const items = [
    ["Habilidades", labelsFor("skills", [...a.skills, ...(a.timeFlies ?? [])]) || "—"],
    ["Pedem sua ajuda para", labelsFor("helpWith", a.helpWith) || "—"],
    ["Interesses", labelsFor("interests", a.interests) || "—"],
    ["Experiências", labelsFor("experiences", a.experiences) || "—"],
    ["Tempo por dia", `${labelFor("hoursPerDay", String(a.hoursPerDay))}${a.period.length ? `, ${labelsFor("period", a.period).toLowerCase()}` : ""}`],
    ["Equipamentos", labelsFor("equipment", a.equipment) || "Nenhum marcado"],
    ["Orçamento inicial", labelFor("budget", String(a.budget))],
    ["Onde trabalhar", labelFor("mode", a.mode)],
    ["Conforto com vendas", labelFor("salesComfort", a.salesComfort)],
    ["Meta de renda extra", a.goal == null ? "Prefere não dizer" : labelFor("goal", String(a.goal))],
  ];
  return (
    <div>
      <PageTitle eyebrow="Descoberta de talentos" title="Meu perfil de talentos">
        <Link href="/app/talentos/questionario" className="btn-secondary btn-sm">Refazer questionário</Link>
      </PageTitle>
      <MentorBubble name="Bia" className="mb-6">
        Foi com este retrato que escolhi suas oportunidades. Mudou algo? Edite que eu refaço as contas.
      </MentorBubble>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-tinta-soft">{k}</p>
              <Link href="/app/talentos/questionario" className="text-sm font-medium text-vira">Editar</Link>
            </div>
            <p className="mt-1 font-medium">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
