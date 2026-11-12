"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { updateNameAction, changePasswordAction } from "@/app/actions/auth";
import { togglePreferenceAction, deleteAccountAction } from "@/app/actions/privacy";
import { cancelSubscriptionAction, resumeSubscriptionAction, updateCardAction } from "@/app/actions/billing";
import { CardFields } from "../billing/checkout-form";
import { FormMessage } from "../ui";
import { PasswordInput } from "../auth-forms";

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateNameAction, null);
  return (
    <form action={action} className="space-y-3">
      <label className="label" htmlFor="p-name">Nome</label>
      <input id="p-name" name="name" defaultValue={name} className="field" />
      <FormMessage state={state} />
      <button className="btn-secondary btn-sm" disabled={pending}>Salvar</button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="space-y-3">
      <PasswordInput name="current" label="Senha atual" autoComplete="current-password" />
      <PasswordInput name="next" label="Nova senha" autoComplete="new-password" />
      <FormMessage state={state} />
      <button className="btn-secondary btn-sm" disabled={pending}>Trocar senha</button>
    </form>
  );
}

export function Toggle({ k, label, on }: { k: "sound" | "clientReminderEmails" | "marketing"; label: string; on: boolean }) {
  const [v, setV] = useState(on);
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-12 items-center justify-between gap-4">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={v}
        disabled={pending}
        onClick={() => {
          setV(!v);
          start(() => togglePreferenceAction(k, !v));
        }}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${v ? "bg-vira" : "bg-tinta/20"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${v ? "left-6" : "left-1"}`} />
        <span className="sr-only">{v ? "Ligado" : "Desligado"}</span>
      </button>
    </label>
  );
}

export function CancelSubscription({ until }: { until: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <>
      <button className="btn-ghost btn-sm text-festa-dark" onClick={() => ref.current?.showModal()}>Cancelar assinatura</button>
      <dialog ref={ref} className="w-[min(100vw-1.5rem,26rem)] rounded-card p-6 backdrop:bg-noite/40">
        <h2 className="font-display text-xl font-bold">Cancelar a renovação?</h2>
        <p className="mt-2 text-[15px] text-tinta-soft">Nenhuma nova cobrança será feita. Você continua com acesso até {until} e seu progresso fica guardado.</p>
        {err && <p className="help">{err}</p>}
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="btn-dark"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await cancelSubscriptionAction();
                if (!r.ok) return setErr(r.error);
                ref.current?.close();
              })
            }
          >
            Sim, cancelar
          </button>
          <button className="btn-secondary" onClick={() => ref.current?.close()}>Continuar assinando</button>
        </div>
      </dialog>
    </>
  );
}

export function ResumeSubscription() {
  const [pending, start] = useTransition();
  return (
    <button className="btn-secondary btn-sm" disabled={pending} onClick={() => start(() => resumeSubscriptionAction())}>
      Desfazer cancelamento
    </button>
  );
}

export function UpdateCard({ open: startOpen = false }: { open?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [state, action, pending] = useActionState(updateCardAction, null);
  if (!open) return <button className="btn-secondary btn-sm" onClick={() => setOpen(true)}>Trocar cartão</button>;
  return (
    <form action={action} className="mt-3 space-y-3 rounded-2xl bg-areia p-4">
      <CardFields errorField={state && !state.ok ? state.field : undefined} error={state && !state.ok ? state.error : undefined} />
      <FormMessage state={state && (state.ok || !state.field) ? state : null} />
      <button className="btn-primary btn-sm" disabled={pending}>Salvar cartão</button>
    </form>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccountAction, null);
  if (!open) return <button className="text-sm font-medium text-festa-dark underline" onClick={() => setOpen(true)}>Excluir minha conta</button>;
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-festa/30 bg-festa-light/50 p-4">
      <p className="text-[15px]">Isso apaga sua conta, respostas, materiais, clientes e lançamentos. Não dá para desfazer. A renovação da assinatura é cancelada.</p>
      <PasswordInput name="password" label="Sua senha" autoComplete="current-password" />
      <div>
        <label className="label" htmlFor="d-confirm">Digite EXCLUIR para confirmar</label>
        <input id="d-confirm" name="confirm" className="field" required autoComplete="off" />
      </div>
      <FormMessage state={state} />
      <div className="flex gap-2">
        <button className="btn-dark btn-sm" disabled={pending}>Excluir definitivamente</button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)}>Voltar</button>
      </div>
    </form>
  );
}
