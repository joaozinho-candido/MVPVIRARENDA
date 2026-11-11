import { requirePaid } from "@/server/session";
import { financeOverview } from "@/server/finance";
import { listClients } from "@/server/crm";
import { PageTitle, Stat, EmptyState, MentorBubble } from "@/components/ui";
import { EntryDialog, ReceivedButton, DeleteEntry } from "@/components/app/finance-form";
import { brlShort, dayMonth, isoDay } from "@/lib/format";

export const metadata = { title: "Financeiro" };

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const monthName = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1];

function Chart({ data }: { data: { month: string; billed: number; profit: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.billed, Math.abs(d.profit))));
  return (
    <figure>
      <div className="flex h-40 items-end gap-3" role="img" aria-label="Evolução mensal de vendido e lucro estimado">
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div className="w-1/3 rounded-t-md bg-vira/30" style={{ height: `${(d.billed / max) * 100}%` }} title={`Vendido ${brlShort(d.billed)}`} />
              <div className="w-1/3 rounded-t-md bg-vira" style={{ height: `${(Math.max(0, d.profit) / max) * 100}%` }} title={`Lucro est. ${brlShort(d.profit)}`} />
            </div>
            <span className="text-xs text-tinta-soft">{monthName(d.month)}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex gap-4 text-xs text-tinta-soft">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-vira/30" />Vendido</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-vira" />Lucro estimado</span>
      </figcaption>
    </figure>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ novo?: string }> }) {
  const sp = await searchParams;
  const u = await requirePaid("/app/financeiro");
  const [o, clients] = await Promise.all([financeOverview(u.id), listClients(u.id)]);
  const c = o.current;
  return (
    <div>
      <PageTitle eyebrow="Rosa · dinheiro e organização" title="Vendido, recebido e lucro">
        <EntryDialog clients={clients.map((x) => ({ id: x.id, name: x.name }))} today={isoDay()} defaultOpen={!!sp.novo} defaultKind={sp.novo === "sale" ? "sale" : undefined} />
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Faturamento · vendido" value={brlShort(c.billed)} />
        <Stat label="Receita · já recebido" value={brlShort(c.received)} tone="green" />
        <Stat label="Custos e despesas" value={brlShort(c.costs)} tone="coral" />
        <Stat label="Lucro estimado" value={brlShort(c.profit)} tone="yellow" />
      </div>
      <p className="mt-2 text-sm text-tinta-soft">Mês atual · Lucro estimado = recebido − custos. Confira sempre com seu extrato.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="card">
          <p className="eyebrow mb-4">Evolução mensal</p>
          <Chart data={o.history} />
          <p className="eyebrow mb-2 mt-6">Histórico mensal</p>
          <ul className="space-y-1 text-[15px]">
            {[...o.history].reverse().filter((h) => h.billed || h.costs).map((h) => (
              <li key={h.month} className="flex justify-between">
                <span className="capitalize">{monthName(h.month)}</span>
                <span>vendeu {brlShort(h.billed)} · lucro est. {brlShort(h.profit)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Lançamentos</p>
          {o.entries.length === 0 ? (
            <EmptyState title="Nenhum lançamento neste mês">Registrar leva 15 segundos e já separa vendido de recebido.</EmptyState>
          ) : (
            <ul className="divide-y divide-tinta/5">
              {o.entries.map(({ entry: e, clientName }) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                  <span className="min-w-0">
                    <span className="text-tinta-soft">{dayMonth(e.date)} · </span>
                    {e.description}
                    {clientName && <span className="text-tinta-soft"> · {clientName}</span>}
                    {e.kind === "sale" && !e.received && (
                      <span className="ml-1 rounded-full bg-sol-light px-2 py-0.5 text-xs font-semibold">a receber</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {e.kind === "sale" && !e.received && <ReceivedButton id={e.id} />}
                    <span className={`font-semibold ${e.kind === "sale" ? (e.received ? "text-vira" : "text-tinta-soft") : "text-festa-dark"}`}>
                      {e.kind === "sale" ? "+" : "−"}
                      {brlShort(e.amountCents)}
                    </span>
                    <DeleteEntry id={e.id} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <MentorBubble name="Rosa" className="mt-6">
        <p className="font-semibold">As palavras, do jeito simples</p>
        <p className="mt-1"><b>Faturamento:</b> tudo o que você vendeu, recebido ou não. <b>Receita:</b> o dinheiro que já entrou. <b>Lucro estimado:</b> o que entrou menos custos e despesas.</p>
        <p className="mt-2 text-sm text-tinta-soft">Este painel é uma organização pessoal, não substitui contabilidade.</p>
      </MentorBubble>
    </div>
  );
}
