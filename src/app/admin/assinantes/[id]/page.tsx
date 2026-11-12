import { notFound } from "next/navigation";
import { requireRole } from "@/server/session";
import { subscriberDetail } from "@/server/admin";
import { PageTitle, Pill } from "@/components/ui";
import { ActionButton } from "@/components/admin/form";
import { AdminDeleteUser } from "@/components/admin/user-controls";
import { refundAction, adminCancelRenewalAction, resendAccessAction } from "@/app/actions/admin";
import { brl, dateBR, dayMonth, dateTimeBR, maskEmail } from "@/lib/format";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin"]);
  const { id } = await params;
  const d = await subscriberDetail(id);
  if (!d) notFound();
  const s = d.subs[0];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span aria-hidden className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-vira-light font-display text-xl font-bold text-vira-dark">{d.user.name[0]}</span>
        <div>
          <PageTitle title={d.user.name} />
          <p className="-mt-5 text-sm text-tinta-soft">{maskEmail(d.user.email)} · cliente desde {dateBR(d.user.createdAt)}</p>
        </div>
        {s && (
          <div className="ml-auto text-right">
            <Pill tone={s.s.status === "active" ? "green" : "yellow"}>Assinatura {s.s.status}</Pill>
            <p className="mt-1 text-sm text-tinta-soft">{s.plan.name} · {s.s.cancelAtPeriodEnd ? "não renova" : `próxima cobrança ${dateBR(s.s.currentPeriodEnd)} · ${brl(s.s.priceCents)}`}</p>
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <p className="eyebrow mb-3">Pagamentos</p>
          <ul className="space-y-3 text-sm">
            {d.payments.map((p) => (
              <li key={p.id}>
                <p>{dayMonth(p.createdAt)} · {p.periodNumber === 1 ? "1º mês" : `mensalidade ${p.periodNumber}`} {brl(p.amountCents)} · {p.method === "pix" ? "Pix" : "Cartão"} <b>{p.status}</b></p>
                {p.confirmedAt && <p className="text-xs text-tinta-soft">Confirmado por webhook às {dateTimeBR(p.confirmedAt)}</p>}
                <p className="text-xs text-tinta-soft">ID no gateway: {p.gatewayPaymentId.slice(0, 9)}•••</p>
                {p.status === "approved" && <ActionButton label="Reembolsar via gateway" action={refundAction.bind(null, p.id)} confirmText="Estornar este pagamento? O acesso será encerrado." className="btn-ghost btn-sm !px-0" />}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Uso da plataforma</p>
          <dl className="space-y-2 text-[15px]">
            {[
              ["Etapa da jornada", `${d.usage.stage} de 14`],
              ["Missões concluídas", d.usage.missionsDone],
              ["Último acesso", d.usage.lastSeenAt ? dateBR(d.usage.lastSeenAt) : "—"],
              ["Materiais criados", d.usage.materials],
              ["Clientes cadastrados", d.usage.clients],
              ["Lançamentos financeiros", d.usage.financeEntries],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between"><dt className="text-tinta-soft">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-tinta-soft">Só números. O admin não lê os clientes nem os textos da pessoa.</p>
        </div>
        <div className="card flex flex-col items-start gap-2">
          <p className="eyebrow mb-1">Ações</p>
          <ActionButton label="Reenviar acesso" action={resendAccessAction.bind(null, id)} />
          {s && !s.s.cancelAtPeriodEnd && ["active", "past_due"].includes(s.s.status) && <ActionButton label="Cancelar renovação" action={adminCancelRenewalAction.bind(null, id)} confirmText="Cancelar a renovação desta assinatura?" />}
          <a href={`/api/admin/export/${id}`} className="btn-secondary btn-sm">Exportar dados (LGPD)</a>
          <AdminDeleteUser id={id} />
          <p className="mt-2 text-xs text-tinta-soft">Toda ação fica registrada com quem fez e quando.</p>
        </div>
      </div>
    </div>
  );
}
