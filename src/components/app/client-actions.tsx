"use client";
import { useActionState, useTransition } from "react";
import { addInteractionAction, completeNextActionAction, deleteClientAction, moveClientAction } from "@/app/actions/work";
import { FormMessage } from "../ui";
import type { ClientStatus } from "@/db/schema";

export function StatusSelect({ id, status, statuses }: { id: string; status: ClientStatus; statuses: { value: ClientStatus; label: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <select aria-label="Status" disabled={pending} defaultValue={status} onChange={(e) => start(async () => { await moveClientAction(id, e.target.value as ClientStatus); })} className="rounded-full border border-tinta/15 bg-white px-4 py-2 text-sm font-semibold">
      {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}

export function AddNote({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(addInteractionAction, null);
  return (
    <form action={action} className="mt-4 space-y-2" key={state?.ok ? Date.now() : "f"}>
      <input type="hidden" name="clientId" value={clientId} />
      <label className="sr-only" htmlFor="note">Anotar o que aconteceu</label>
      <textarea id="note" name="note" rows={2} className="field py-3" placeholder="+ Anotar o que aconteceu…" />
      <FormMessage state={state} />
      <button className="btn-secondary btn-sm" disabled={pending}>Anotar</button>
    </form>
  );
}

export function DoneButton({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-secondary btn-sm" disabled={pending} onClick={() => start(() => completeNextActionAction(clientId))}>
      Marcar ação como feita
    </button>
  );
}

export function DeleteClient({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="text-sm text-festa-dark underline"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir este cliente e o histórico dele?")) start(() => deleteClientAction(clientId));
      }}
    >
      Excluir cliente
    </button>
  );
}
