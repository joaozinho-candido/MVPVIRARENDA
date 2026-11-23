"use client";
import { useState } from "react";
import { pingAction } from "./actions";

export function PingButton() {
  const [msg, setMsg] = useState("");
  const [seen, setSeen] = useState<Record<string, string | null> | null>(null);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn-primary btn-sm"
          onClick={async () => {
            setMsg("Testando…");
            try {
              const r = await fetch("/api/diagnostico", { method: "POST" });
              setSeen(await r.json());
            } catch {
              setSeen(null);
            }
            try {
              const r = await pingAction();
              setMsg(r.ok ? "✅ Formulários funcionando neste endereço" : "❌ Resposta inesperada");
            } catch (e) {
              setMsg(`❌ Falhou: ${(e as Error).message}`);
            }
          }}
        >
          Testar formulários
        </button>
        <span className="font-semibold" role="status">{msg}</span>
      </div>
      {seen && (
        <dl className="mt-4 divide-y divide-tinta/10 text-sm">
          {Object.entries(seen).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-tinta-soft">{k}</dt>
              <dd className="break-all text-right font-mono">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
