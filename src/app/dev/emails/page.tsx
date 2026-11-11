import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { config } from "@/lib/config";
import { dateTimeBR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Caixa de e-mails (desenvolvimento)" };

/** Só existe em desenvolvimento: mostra os e-mails que seriam enviados. */
export default async function Page({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  if (!config.devMailbox) notFound();
  const { para } = await searchParams;
  const rows = await db.select().from(emails).where(para ? eq(emails.to, para.toLowerCase()) : undefined).orderBy(desc(emails.id)).limit(100);
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="font-display text-2xl font-bold">Caixa de e-mails · desenvolvimento</h1>
      <p className="mb-4 text-sm text-tinta-soft">Nenhum e-mail real é enviado nesta etapa. Desative com NODE_ENV=production (e DEV_MAILBOX diferente de true).</p>
      <ul className="space-y-3">
        {rows.map((e) => (
          <li key={e.id} className="card" data-testid="email">
            <p className="text-xs text-tinta-soft">#{e.id} · {dateTimeBR(e.createdAt)} · {e.template} · para <span data-testid="email-to">{e.to}</span></p>
            <p className="mt-1 font-semibold">{e.subject}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{linkify(e.body)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part.replace(config.appUrl, "")} className="link break-all">{part}</a>
    ) : (
      part
    ),
  );
}
