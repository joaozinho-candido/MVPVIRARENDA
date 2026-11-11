import Link from "next/link";
import { requireRole } from "@/server/session";
import { listPayments, paymentEvents } from "@/server/admin";
import { PageTitle, Pill } from "@/components/ui";
import { brl, dayMonth, dateTimeBR } from "@/lib/format";

const FILTERS = [["all", "Todas"], ["first", "1º mês"], ["renewal", "Mensalidades"], ["failed", "Falharam"], ["refunded", "Reembolsos"]] as const;
const ST: Record<string, [string, "green" | "yellow" | "coral" | "gray"]> = { approved: ["Aprovado", "green"], pending: ["Aguardando", "yellow"], refused: ["Falhou", "coral"], expired: ["Expirado", "gray"], refunded: ["Reembolsado", "gray"] };

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string; q?: string; ev?: string }> }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const f = sp.f ?? "all";
  const rows = await listPayments(f, sp.q ?? "");
  const events = sp.ev ? await paymentEvents(sp.ev) : [];
  return (
    <div>
      <PageTitle eyebrow="Compras e cobranças" title="Cada cobrança, com o status do gateway">
        <a href={`/api/admin/compras?f=${f}&q=${encodeURIComponent(sp.q ?? "")}`} className="btn-secondary btn-sm">Exportar CSV</a>
      </PageTitle>
      <form className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="f" value={f} />
        <input name="q" defaultValue={sp.q} placeholder="🔍 Buscar nome ou e-mail" className="field max-w-xs" />
        <button className="btn-secondary btn-sm">Buscar</button>
      </form>
      <nav className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => (
          <Link key={k} href={`/admin/compras?f=${k}`} className={`chip ${f === k ? "!border-noite !bg-noite !text-white" : ""}`}>{l}</Link>
        ))}
      </nav>
      <div className="card table-wrap">
        <table className="tbl">
          <thead><tr><th>Cliente</th><th>Cobrança</th><th>Valor</th><th>Meio</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {rows.map(({ p, email, cancelAtPeriodEnd }) => (
              <tr key={p.id}>
                <td>{p.userId ? <Link href={`/admin/assinantes/${p.userId}`} className="link">{p.customerName}</Link> : p.customerName}<div className="text-xs text-tinta-soft">{email ?? "—"}</div></td>
                <td>{p.periodNumber === 1 ? "1º mês" : `Mensalidade ${p.periodNumber}`}{p.attempt > 1 ? ` · tentativa ${p.attempt}` : ""}</td>
                <td>{brl(p.amountCents)}</td>
                <td>{p.method === "pix" ? "Pix" : "Cartão"}</td>
                <td>
                  <Link href={`/admin/compras?f=${f}&ev=${p.gatewayPaymentId}`} title="Ver eventos do gateway"><Pill tone={ST[p.status][1]}>● {ST[p.status][0]}</Pill></Link>
                  {cancelAtPeriodEnd && <div className="text-xs text-tinta-soft">cancelou renovação</div>}
                </td>
                <td>{dayMonth(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="py-6 text-center text-tinta-soft">Nenhuma cobrança.</p>}
      </div>
      <p className="mt-2 text-sm text-tinta-soft">Clicar no nome abre o assinante. Clicar no status mostra os eventos recebidos do gateway.</p>
      {sp.ev && (
        <div className="card mt-4">
          <p className="eyebrow mb-2">Eventos do gateway · {sp.ev}</p>
          {events.length === 0 ? <p className="text-tinta-soft">Nenhum evento recebido.</p> : (
            <ul className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id}><b>{e.type}</b> · {dateTimeBR(e.receivedAt)} · resultado: {e.result} · <code className="text-xs">{e.id}</code></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
