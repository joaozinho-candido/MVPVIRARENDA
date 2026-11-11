"use client";
import { useActionState, useTransition, useState } from "react";
import type { ActionResult } from "@/lib/errors";
import { FormMessage } from "../ui";

export function AdminForm({ action, children, className = "" }: { action: (s: ActionResult | null, fd: FormData) => Promise<ActionResult>; children: React.ReactNode; className?: string }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-3"><FormMessage state={state} /></div>
    </form>
  );
}

export function ActionButton({ action, label, confirmText, className = "btn-secondary btn-sm" }: { action: () => Promise<unknown>; label: string; confirmText?: string; className?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          start(async () => {
            const r = (await action()) as { ok?: boolean; error?: string } | undefined;
            setMsg(r && r.ok === false ? r.error ?? "Erro" : r && typeof r === "object" && !("ok" in r) ? JSON.stringify(r) : "✓");
          });
        }}
      >
        {pending ? "…" : label}
      </button>
      {msg && <span className="text-xs text-tinta-soft">{msg}</span>}
    </span>
  );
}
