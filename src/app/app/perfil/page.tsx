import Link from "next/link";
import { requireUser } from "@/server/session";
import { getCurrentSubscription, listUserPayments, quoteFor } from "@/server/billing/subscriptions";
import { latestConsents } from "@/server/privacy";
import { getHistory } from "@/server/gamification";
import { db } from "@/db";
import { consents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageTitle, Pill, Notice } from "@/components/ui";
import { NameForm, PasswordForm, Toggle, CancelSubscription, ResumeSubscription, UpdateCard, DeleteAccount } from "@/components/app/profile-forms";
import { ResendVerification } from "@/components/app/resend";
import { SubscribeCta } from "@/components/app/locked";
import { brl, dateBR, dayMonth } from "@/lib/format";

export const metadata = { title: "Perfil" };

const TABS = [
  ["dados", "Meus dados"],
  ["plano", "Meu plano"],
  ["pagamentos", "Pagamentos"],
  ["preferencias", "Preferências"],
  ["privacidade", "Privacidade"],
  ["atividades", "Atividades"],
] as const;

const SUB_LABEL: Record<string, [string, "green" | "yellow" | "coral" | "gray"]> = {
  active: ["Ativa", "green"],
  past_due: ["Pagamento pendente", "yellow"],
  paused: ["Pausada", "coral"],
  canceled: ["Cancelada", "gray"],
  expired: ["Expirada", "gray"],
};
const PAY_LABEL: Record<string, string> = { approved: "Pago", pending: "Aguardando", refused: "Recusado", expired: "Expirado", refunded: "Estornado" };
const CONSENT_LABEL: Record<string, string> = { terms: "Termos", privacy: "Privacidade", marketing_email: "E-mails de dicas", analytics_cookies: "Cookies de medição" };

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.aba) ? sp.aba! : "dados";
  const u = await requireUser("/app/perfil");
  const current = await getCurrentSubscription(u.id);
  const s = current?.sub;

  let body: React.ReactNode = null;
  if (tab === "dados")
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-4">
          <NameForm name={u.name} />
          <div>
            <p className="label">E-mail</p>
            <p>{u.email} {u.emailVerified ? <Pill tone="green">confirmado</Pill> : <Pill tone="yellow">não confirmado</Pill>}</p>
            {!u.emailVerified && <div className="mt-2"><ResendVerification /></div>}
          </div>
          <Link href="/app/talentos" className="link text-sm">Meu perfil de talentos →</Link>
        </div>
        <div className="card"><PasswordForm /></div>
      </div>
    );

  if (tab === "plano") {
    if (!s || s.status === "canceled" && (!s.currentPeriodEnd || s.currentPeriodEnd < new Date())) {
      const q = await quoteFor(u.id);
      body = (
        <div className="space-y-4">
          {s && <Notice tone="gray">Sua assinatura terminou em {dateBR(s.currentPeriodEnd)}. Seu progresso continua guardado.</Notice>}
          <SubscribeCta first={q.firstCents} price={q.recurringCents} />
        </div>
      );
    } else {
      const [label, tone] = SUB_LABEL[s.status] ?? ["—", "gray"];
      body = (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-xl font-bold">{current!.plan.name}</p>
            <Pill tone={tone}>{s.cancelAtPeriodEnd && s.status === "active" ? "Cancelada · acesso até o fim do período" : label}</Pill>
          </div>
          {s.cancelAtPeriodEnd || s.status === "canceled" ? (
            <p>Acesso até {dateBR(s.currentPeriodEnd)}. Nenhuma nova cobrança.</p>
          ) : (
            <p>Próxima cobrança: <b>{dateBR(s.currentPeriodEnd)} · {brl(s.priceCents)}</b></p>
          )}
          <p className="text-tinta-soft">{s.paymentMethod === "card" ? `Cartão final ${s.cardLast4 ?? "••••"}` : "Pix"}</p>
          <div className="flex flex-wrap gap-2">
            <UpdateCard open={s.status === "past_due" || s.status === "paused"} />
            {s.cancelAtPeriodEnd && s.status !== "canceled" ? <ResumeSubscription /> : ["active", "past_due"].includes(s.status) && <CancelSubscription until={dateBR(s.currentPeriodEnd)} />}
          </div>
          <p className="text-sm text-tinta-soft">Cancelar não pede ligação nem formulário. Você usa até o fim do mês já pago.</p>
        </div>
      );
    }
  }

  if (tab === "pagamentos") {
    const pays = await listUserPayments(u.id);
    body = (
      <div className="card">
        {pays.length === 0 ? <p className="text-tinta-soft">Nenhum pagamento ainda.</p> : (
          <ul className="divide-y divide-tinta/5">
            {pays.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[15px]">
                <span>{dayMonth(p.createdAt)} · {p.periodNumber === 1 ? "1º mês" : `mensalidade ${p.periodNumber}`} · {brl(p.amountCents)} · {p.method === "pix" ? "Pix" : "Cartão"}</span>
                <span className="flex items-center gap-3">
                  <Pill tone={p.status === "approved" ? "green" : p.status === "pending" ? "yellow" : "gray"}>{PAY_LABEL[p.status]}</Pill>
                  <Link href={`/assinar/status/${p.id}`} className="link text-sm">{p.status === "approved" ? "Recibo" : "Ver"}</Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (tab === "preferencias") {
    const c = await latestConsents(u.id);
    body = (
      <div className="card divide-y divide-tinta/5">
        <Toggle k="sound" label="Som das comemorações" on={u.prefs.sound} />
        <Toggle k="clientReminderEmails" label="Lembretes de clientes por e-mail" on={u.prefs.clientReminderEmails} />
        <Toggle k="marketing" label="Dicas e novidades por e-mail" on={!!c.get("marketing_email")?.granted} />
        <p className="pt-3 text-xs text-tinta-soft">E-mails sobre a assinatura (confirmação, aviso de cobrança, falha e cancelamento) são sempre enviados.</p>
      </div>
    );
  }

  if (tab === "privacidade") {
    const all = await db.select().from(consents).where(eq(consents.userId, u.id)).orderBy(desc(consents.createdAt));
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <p className="font-semibold">Seus dados</p>
          <p className="text-[15px] text-tinta-soft">Baixe tudo o que guardamos sobre você, em um arquivo.</p>
          <a href="/api/me/export" className="btn-secondary btn-sm">Baixar todos os meus dados</a>
          <hr className="border-tinta/10" />
          <DeleteAccount />
        </div>
        <div className="card">
          <p className="mb-2 font-semibold">Aceites registrados</p>
          <ul className="space-y-1 text-[15px]">
            {all.map((c) => (
              <li key={c.id}>
                {CONSENT_LABEL[c.kind]} v{c.version} · {c.granted ? "aceito" : "recusado"} em {dateBR(c.createdAt)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-tinta-soft">Dúvidas sobre seus dados? Leia a <Link href="/privacidade" className="link">Política de Privacidade</Link>.</p>
        </div>
      </div>
    );
  }

  if (tab === "atividades") {
    const h = await getHistory(u.id, 50);
    body = (
      <div className="card">
        <ul className="divide-y divide-tinta/5">
          {h.map((x) => (
            <li key={x.id} className="flex justify-between py-2.5 text-[15px]">
              <span><span className="text-tinta-soft">{dayMonth(x.createdAt)} · </span>{x.title}</span>
              {x.points > 0 && <span className="font-semibold text-vira">+{x.points}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <PageTitle eyebrow="Perfil" title="Plano, pagamentos e dados sob o seu controle" />
      <nav className="-mx-4 mb-5 flex gap-1 overflow-x-auto px-4" aria-label="Seções do perfil">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/app/perfil?aba=${k}`} aria-current={tab === k ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${tab === k ? "bg-noite text-white" : "bg-white text-tinta-soft"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {body}
    </div>
  );
}
