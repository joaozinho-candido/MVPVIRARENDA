"use client";
import { useState } from "react";
import { pingAction } from "./actions";

export function PingButton() {
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="btn-primary btn-sm"
        onClick={async () => {
          setMsg("Testando…");
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
  );
}
