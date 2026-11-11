import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
import { requirePaid } from "@/server/session";
import { getClient, CLIENT_STATUSES, whatsappLink } from "@/server/crm";
import { StatusSelect, AddNote, DoneButton, DeleteClient } from "@/components/app/client-actions";
import { dateBR, dateTimeBR, dayMonth } from "@/lib/format";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requirePaid();
  const data = await getClient(u.id, id).catch(() => null);
  if (!data) notFound();
  const { client: c, history } = data;
  const tpl = await db.query.materials.findFirst({ where: and(eq(materials.userId, u.id), eq(materials.kind, "whatsapp")) });
  const msg = (tpl?.content ?? "Oi, [nome]! Tudo bem?").replace(/\[nome\]/g, c.contactName || c.name);
  return (
    <div>
      <Link href="/app/clientes" className="link text-sm">← Meus clientes</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-noite">{c.name}</h1>
        <StatusSelect id={c.id} status={c.status} statuses={CLIENT_STATUSES} />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <dl className="card divide-y divide-tinta/10 text-[15px]">
            {[
              ["Contato", [c.contactName, c.phone].filter(Boolean).join(" · ") || "—"],
              ["Origem", c.origin || "—"],
              ["Primeiro contato", c.firstContactAt ? dateBR(c.firstContactAt) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-tinta-soft">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-card bg-sol-light p-5">
            <p className="eyebrow text-[#7A5A00]">Próxima ação{c.nextActionAt ? ` · ${dateTimeBR(c.nextActionAt)}` : ""}</p>
            <p className="mt-1 font-display text-lg font-semibold">{c.nextAction || "Nenhuma ação marcada"}</p>
            {c.nextAction && c.reminderOn && <p className="mt-1 text-sm">🔔 Lembrete ligado</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {c.phone && (
                <a href={whatsappLink(c.phone, msg)} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                  Abrir WhatsApp com mensagem pronta
                </a>
              )}
              {c.nextAction && <DoneButton clientId={c.id} />}
              <Link href={`/app/clientes/${c.id}/editar`} className="btn-secondary btn-sm">Editar</Link>
            </div>
            {!c.phone && <p className="mt-2 text-sm text-tinta-soft">Cadastre o telefone para abrir o WhatsApp com o texto pronto.</p>}
          </div>
          <div className="card">
            <p className="eyebrow mb-2">Observações</p>
            <p className="whitespace-pre-line text-[15px]">{c.notes || "—"}</p>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Histórico de atendimento</p>
          <ol className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="text-[15px]">
                <span className="text-tinta-soft">{dayMonth(h.createdAt)} · </span>
                {h.note}
              </li>
            ))}
          </ol>
          <AddNote clientId={c.id} />
        </div>
      </div>
      <div className="mt-6"><DeleteClient clientId={c.id} /></div>
    </div>
  );
}
