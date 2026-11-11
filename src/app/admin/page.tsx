import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/session";
import { overview } from "@/server/admin";
import { PageTitle, Stat } from "@/components/ui";
import { brl } from "@/lib/format";

export default async function Page() {
  const u = await requireRole(["admin", "editor", "reviewer"]);
  if (u.role === "editor") redirect("/admin/oportunidades");
  if (u.role === "reviewer") redirect("/admin/revisao");
  const o = await overview();
  const max = Math.max(1, ...o.funnel.map((f) => f.value));
  const att = [
    { n: o.attention.pixPending, label: "Pix aguardando", href: "/admin/compras?f=all" },
    { n: o.attention.failed, label: "mensalidades falharam", href: "/admin/usuarios?status=past_due" },
    { n: o.attention.lgpd, label: "pedidos de dados (LGPD)", href: "/admin/lgpd" },
    { n: o.attention.outdated, label: "conteúdo desatualizado", href: "/admin/revisao?s=outdated" },
  ];
  return (
    <div>
      <PageTitle eyebrow="Visão geral" title="O negócio inteiro em uma tela" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Assinantes ativos" value={o.active} />
        <Stat label="No 1º mês" value={o.firstMonth} tone="yellow" />
        <Stat label="Pagaram o 2º mês" value={o.paidSecondPct == null ? "—" : `${o.paidSecondPct}%`} tone="green" />
        <Stat label="Receita do mês" value={brl(o.revenueCents)} tone="coral" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <p className="eyebrow mb-4">Funil do mês</p>
          <div className="space-y-3">
            {o.funnel.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-sm"><span>{f.label}</span><span className="font-semibold">{f.value}</span></div>
                <div className="mt-1 h-3 rounded-full bg-areia"><div className="h-3 rounded-full bg-vira" style={{ width: `${(f.value / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-tinta-soft">Sem rastreamento de visitantes: contamos só eventos dentro do produto, sem dados pessoais.</p>
        </div>
        <div className="card">
          <p className="eyebrow mb-3 text-festa-dark">Precisa de atenção</p>
          <ul className="space-y-2">
            {att.map((a) => (
              <li key={a.label}>
                <Link href={a.href} className={`flex items-center gap-2 ${a.n ? "font-semibold" : "text-tinta-soft"}`}>• {a.n} {a.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
