import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole } from "@/server/session";
import { listPrivacyRequests } from "@/server/admin";
import { PageTitle, Pill } from "@/components/ui";
import { ActionButton } from "@/components/admin/form";
import { resolvePrivacyRequestAction } from "@/app/actions/admin";
import { dateTimeBR } from "@/lib/format";

export default async function Page() {
  await requireRole(["admin"]);
  const reqs = await listPrivacyRequests();
  const logs = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(100);
  return (
    <div>
      <PageTitle eyebrow="LGPD e auditoria" title="Pedidos de titulares e registro de ações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="eyebrow mb-3">Pedidos de dados</p>
          <p className="mb-3 text-sm text-tinta-soft">Exportação e exclusão feitas pela própria pessoa no perfil ficam registradas como concluídas. Pedidos recebidos por e-mail podem ser atendidos no detalhe do assinante.</p>
          <ul className="divide-y divide-tinta/5 text-sm">
            {reqs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                <span>{dateTimeBR(r.createdAt)} · {r.kind === "export" ? "Acesso/exportação" : "Exclusão"} · {r.emailMasked}</span>
                {r.status === "open" ? <ActionButton label="Marcar atendido" action={resolvePrivacyRequestAction.bind(null, r.id)} className="btn-ghost btn-sm" /> : <Pill tone="green">Atendido</Pill>}
              </li>
            ))}
            {!reqs.length && <li className="py-2 text-tinta-soft">Nenhum pedido.</li>}
          </ul>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Auditoria (últimas 100 ações)</p>
          <ul className="max-h-[520px] space-y-2 overflow-auto text-sm">
            {logs.map((l) => (
              <li key={l.id}><span className="text-tinta-soft">{dateTimeBR(l.createdAt)} · {l.actorEmail}</span><br /><b>{l.action}</b> {l.targetType} {l.targetId.slice(0, 8)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
