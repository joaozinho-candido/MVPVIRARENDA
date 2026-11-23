import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db, dbDriver } from "@/db";
import { users } from "@/db/schema";
import { config } from "@/lib/config";
import { PingButton } from "./ping";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diagnóstico" };

const VERSION = "2026-11-23.2";

/** Só em desenvolvimento: ajuda a descobrir por que login/cadastro não funcionam num ambiente. */
export default async function Page() {
  if (!config.devMailbox) notFound();
  const h = await headers();
  let dbStatus = "ok";
  let total = 0;
  const accounts: [string, boolean][] = [];
  try {
    total = (await db.select({ n: count() }).from(users))[0].n;
    for (const e of ["admin@virarenda.local", "camila@virarenda.local"]) accounts.push([e, !!(await db.query.users.findFirst({ where: eq(users.email, e) }))]);
  } catch (e) {
    dbStatus = `erro: ${(e as Error).message}`;
  }
  const rows: [string, string][] = [
    ["Versão do código", VERSION],
    ["Banco", `${dbDriver()} · ${dbStatus}`],
    ["Contas cadastradas", String(total)],
    ...accounts.map(([e, ok]) => [e, ok ? "existe ✅" : "não existe ❌"] as [string, string]),
    ["host", h.get("host") ?? "—"],
    ["x-forwarded-host", h.get("x-forwarded-host") ?? "—"],
    ["CODESPACE_NAME", process.env.CODESPACE_NAME ?? "—"],
  ];
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="font-display text-2xl font-bold">Diagnóstico</h1>
      <p className="mb-4 text-sm text-tinta-soft">Página de desenvolvimento. Se algo der errado, mande um print desta tela.</p>
      <dl className="card divide-y divide-tinta/10 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-tinta-soft">{k}</dt>
            <dd className="break-all text-right font-mono">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="card mt-4">
        <PingButton />
      </div>
    </div>
  );
}
