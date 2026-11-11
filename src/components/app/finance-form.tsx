"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addEntryAction, markReceivedAction, deleteEntryAction } from "@/app/actions/work";
import { FormMessage } from "../ui";

export function EntryDialog({ clients, today, defaultOpen, defaultKind }: { clients: { id: string; name: string }[]; today: string; defaultOpen?: boolean; defaultKind?: "sale" | "cost" | "expense" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<"sale" | "cost" | "expense">(defaultKind ?? "sale");
  const [received, setReceived] = useState(true);
  const [state, action, pending] = useActionState(addEntryAction, null);
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (defaultOpen) ref.current?.showModal();
  }, [defaultOpen]);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.close();
      setFormKey((k) => k + 1);
    }
  }, [state]);
  return (
    <>
      <button className="btn-primary btn-sm" onClick={() => ref.current?.showModal()}>+ Registrar</button>
      <dialog ref={ref} className="w-[min(100vw-1.5rem,32rem)] rounded-card p-0 backdrop:bg-noite/40" aria-labelledby="entry-title">
        <form key={formKey} action={action} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 id="entry-title" className="font-display text-xl font-bold">Novo lançamento</h2>
            <button type="button" aria-label="Fechar" className="text-xl" onClick={() => ref.current?.close()}>✕</button>
          </div>
          <input type="hidden" name="kind" value={kind} />
          <div className="grid grid-cols-3 gap-1 rounded-full bg-areia p-1" role="radiogroup" aria-label="Tipo">
            {(["sale", "cost", "expense"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`min-h-10 rounded-full text-sm font-semibold ${kind === k ? "bg-white shadow-sm" : "text-tinta-soft"}`}>
                {{ sale: "Venda", cost: "Custo", expense: "Despesa" }[k]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_130px] gap-3">
            <div>
              <label className="label" htmlFor="e-desc">Descrição</label>
              <input id="e-desc" name="description" required className="field" placeholder={kind === "sale" ? "Pacote 4 vídeos" : "App de edição"} />
            </div>
            <div>
              <label className="label" htmlFor="e-amount">Valor (R$)</label>
              <input id="e-amount" name="amount" required inputMode="decimal" className="field" placeholder="400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kind === "sale" && (
              <div>
                <label className="label" htmlFor="e-client">Cliente</label>
                <select id="e-client" name="clientId" className="field">
                  <option value="">—</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label" htmlFor="e-date">Data</label>
              <input id="e-date" type="date" name="date" defaultValue={today} required className="field" />
            </div>
          </div>
          {kind === "sale" && (
            <fieldset>
              <legend className="label">Já recebeu o dinheiro?</legend>
              <input type="hidden" name="received" value={received ? "yes" : "no"} />
              <div className="flex gap-2">
                <button type="button" aria-pressed={received} onClick={() => setReceived(true)} className={`chip ${received ? "chip-on" : ""}`}>Sim, recebi</button>
                <button type="button" aria-pressed={!received} onClick={() => setReceived(false)} className={`chip ${!received ? "chip-on" : ""}`}>Ainda não</button>
              </div>
              {!received && <p className="mt-2 text-sm text-tinta-soft">Vira “a receber” e entra no lembrete do cliente.</p>}
            </fieldset>
          )}
          <FormMessage state={state && !state.ok ? state : null} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
        </form>
      </dialog>
    </>
  );
}

export function ReceivedButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="text-sm font-medium text-vira underline" disabled={pending} onClick={() => start(() => markReceivedAction(id))}>
      Marcar recebido
    </button>
  );
}

export function DeleteEntry({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button aria-label="Excluir lançamento" className="text-tinta-soft hover:text-festa-dark" disabled={pending} onClick={() => confirm("Excluir este lançamento?") && start(() => deleteEntryAction(id))}>
      ✕
    </button>
  );
}
