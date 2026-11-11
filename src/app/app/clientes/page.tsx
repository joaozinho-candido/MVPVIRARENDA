import Link from "next/link";
import { requirePaid } from "@/server/session";
import { listClients, dueReminders, CLIENT_STATUSES } from "@/server/crm";
import { PageTitle, MentorBubble, EmptyState } from "@/components/ui";
import { CrmBoard } from "@/components/app/crm-board";
import { dateTimeBR, isoDay } from "@/lib/format";

export const metadata = { title: "Meus clientes" };

function nextLabel(at: Date | null, text: string) {
  if (!at) return text;
  const same = isoDay(at) === isoDay();
  return `${text} · ${same ? "hoje" : dateTimeBR(at).slice(0, 5)}`;
}

export default async function Page() {
  const u = await requirePaid("/app/clientes");
  const [list, due] = await Promise.all([listClients(u.id), dueReminders(u.id)]);
  const today = isoDay();
  return (
    <div>
      <PageTitle eyebrow="Nando · meus clientes" title="Um quadro simples para não esquecer ninguém">
        <Link href="/app/clientes/novo" className="btn-primary btn-sm">+ Novo cliente</Link>
      </PageTitle>
      {due.length > 0 && <MentorBubble name="Nando" className="mb-5">🔔 Você tem {due.length} {due.length === 1 ? "retorno" : "retornos"} para hoje.</MentorBubble>}
      {list.length === 0 ? (
        <EmptyState title="Seu quadro está vazio">
          <p>Comece por quem já te conhece. Cada cliente guarda contato, origem, histórico e próxima ação.</p>
          <Link href="/app/clientes/novo" className="btn-primary mt-4">Cadastrar o primeiro</Link>
        </EmptyState>
      ) : (
        <CrmBoard
          columns={CLIENT_STATUSES}
          clients={list.map((c) => ({
            id: c.id,
            name: c.name,
            origin: c.origin,
            channel: c.channel,
            status: c.status,
            nextAction: c.nextAction,
            nextLabel: nextLabel(c.nextActionAt, c.nextAction),
            due: !!c.nextActionAt && isoDay(c.nextActionAt) <= today,
          }))}
        />
      )}
      <p className="mt-2 text-sm text-tinta-soft">Arraste entre colunas (no computador) ou troque o status no card. Nenhuma mensagem é enviada automaticamente.</p>
    </div>
  );
}
