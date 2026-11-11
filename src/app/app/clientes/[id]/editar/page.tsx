import { requirePaid } from "@/server/session";
import { getClient, CLIENT_STATUSES } from "@/server/crm";
import { PageTitle } from "@/components/ui";
import { ClientForm } from "@/components/app/client-form";
import { notFound } from "next/navigation";

function localInput(d: Date | null) {
  if (!d) return "";
  const s = new Date(d.getTime() - 3 * 3_600_000).toISOString();
  return s.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requirePaid();
  const data = await getClient(u.id, id).catch(() => null);
  if (!data) notFound();
  const c = data.client;
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="Meus clientes" title={`Editar ${c.name}`} />
      <ClientForm statuses={CLIENT_STATUSES} client={{ ...c, nextActionAt: localInput(c.nextActionAt) }} />
    </div>
  );
}
