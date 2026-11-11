import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getPaymentForUser, getBillingSettings } from "@/server/billing/subscriptions";
import { PixPending } from "@/components/billing/pix";
import { MentorBubble } from "@/components/ui";
import { brl, firstName } from "@/lib/format";
import { Celebration } from "@/components/app/celebration";

export const metadata = { title: "Pagamento" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser();
  const p = await getPaymentForUser(u.id, id);
  if (!p) notFound();
  const settings = await getBillingSettings();
  const box = (emoji: string, title: string, text: React.ReactNode, actions: React.ReactNode) => (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-5xl">{emoji}</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-noite">{title}</h1>
      <div className="mt-2 text-tinta-soft">{text}</div>
      <div className="mt-6 flex flex-col gap-2">{actions}</div>
    </div>
  );

  if (p.status === "approved")
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <Celebration title="Pagamento confirmado!" subtitle="Suas 3 oportunidades estão liberadas." points={20} sound={u.prefs.sound} autoOpen />
        <MentorBubble name="Bia">
          <p className="font-display text-xl font-bold text-noite">Bem-vinda(o) ao Vira Renda, {firstName(u.name)}!</p>
          <p className="mt-2">Suas 3 oportunidades estão liberadas. Escolha uma e eu te passo para a Duda, que cuida das suas missões.</p>
        </MentorBubble>
        <div className="flex items-center gap-3 rounded-2xl bg-festa-light px-4 py-3">
          <span className="text-2xl">🏅</span>
          <span className="font-semibold">Primeira conquista: Comecei!</span>
        </div>
        <Link href="/app/oportunidades" className="btn-primary w-full">Ver minhas oportunidades</Link>
        <p className="text-center text-sm text-tinta-soft">Enviamos o recibo para {u.email}.</p>
      </div>
    );

  if (p.status === "refused")
    return box(
      "💳",
      "Não deu certo com este cartão",
      <p>Confira os dados ou o limite. Nada foi cobrado.</p>,
      <>
        <Link href="/assinar" className="btn-primary">Tentar outro cartão</Link>
        <Link href="/assinar" className="btn-secondary">Pagar com Pix</Link>
      </>,
    );

  if (p.status === "expired")
    return box("⌛", "O código venceu", <p>Sem problema: gere um novo em 1 toque.</p>, <Link href="/assinar" className="btn-primary">Gerar novo Pix</Link>);

  if (p.status === "refunded") return box("↩️", "Pagamento estornado", <p>Este pagamento foi devolvido.</p>, <Link href="/app" className="btn-secondary">Voltar</Link>);

  // pendente
  if (p.method === "pix" && p.pixCode)
    return (
      <div className="card mx-auto max-w-md">
        <p className="text-sm text-tinta-soft">Aguardando Pix</p>
        <h1 className="mb-4 font-display text-2xl font-bold text-noite">Pague {brl(p.amountCents)} com Pix</h1>
        <PixPending paymentId={p.id} code={p.pixCode} expiresAt={(p.pixExpiresAt ?? new Date()).toISOString()} demo={settings.gatewayMode === "demo"} />
      </div>
    );
  return box("⏳", "Confirmando seu pagamento", <p>Isso costuma levar poucos segundos. Atualize a página em instantes.</p>, <Link href={`/assinar/status/${p.id}`} className="btn-secondary">Atualizar</Link>);
}
