import { requirePaid } from "@/server/session";
import { CLIENT_STATUSES } from "@/server/crm";
import { PageTitle } from "@/components/ui";
import { ClientForm } from "@/components/app/client-form";

export default async function Page() {
  await requirePaid("/app/clientes/novo");
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="Meus clientes" title="Novo cliente" />
      <ClientForm statuses={CLIENT_STATUSES} />
    </div>
  );
}
