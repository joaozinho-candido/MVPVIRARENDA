"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { registerAction, loginAction, forgotAction, resetAction } from "@/app/actions/auth";
import { FormMessage } from "./ui";

function PasswordInput({ name = "password", label = "Senha", autoComplete, error }: { name?: string; label?: string; autoComplete: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      <div className="relative">
        <input id={`f-${name}`} name={name} type={show ? "text" : "password"} required minLength={name === "current" ? 1 : 8} autoComplete={autoComplete} className={`field pr-20 ${error ? "border-festa" : ""}`} aria-invalid={!!error} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-medium text-vira" aria-label={show ? "Esconder senha" : "Mostrar senha"}>
          {show ? "Esconder" : "Mostrar"}
        </button>
      </div>
      {error ? <p className="help">{error}</p> : name !== "current" && autoComplete === "new-password" && <p className="mt-1.5 text-sm text-tinta-soft">No mínimo 8 caracteres.</p>}
    </div>
  );
}

export function RegisterForm({ fromQuiz }: { fromQuiz: boolean }) {
  const [state, action, pending] = useActionState(registerAction, null);
  const [quiz, setQuiz] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vr_quiz_draft");
      if (raw) {
        const d = JSON.parse(raw);
        setQuiz(
          JSON.stringify({
            skills: d.skills ?? [], interests: d.interests ?? [], helpWith: d.helpWith ?? [], timeFlies: d.timeFlies, experiences: d.experiences ?? [], period: d.period ?? [],
            hoursPerDay: Number(d.hoursPerDay ?? 1), equipment: d.equipment ?? [], budget: Number(d.budget ?? 0), mode: d.mode ?? "tanto_faz", salesComfort: d.salesComfort ?? "medio",
            goal: d.goal === "" || d.goal == null ? null : Number(d.goal),
          }),
        );
      }
    } catch {}
  }, []);
  const err = (f: string) => (state && !state.ok && state.field === f ? state.error : undefined);
  return (
    <form action={action} className="card space-y-4">
      <div>
        {fromQuiz && quiz ? <p className="eyebrow">Seu resultado está pronto!</p> : null}
        <h1 className="mt-1 font-display text-2xl font-bold text-noite">{fromQuiz && quiz ? "Crie sua conta para ver" : "Crie sua conta"}</h1>
        <p className="mt-1 text-sm text-tinta-soft">Pedimos só o necessário.</p>
      </div>
      <input type="hidden" name="quiz" value={quiz} />
      <div>
        <label htmlFor="f-name" className="label">Nome</label>
        <input id="f-name" name="name" required autoComplete="given-name" className="field" placeholder="Como quer ser chamada(o)" />
        {err("name") && <p className="help">{err("name")}</p>}
      </div>
      <div>
        <label htmlFor="f-email" className="label">E-mail</label>
        <input id="f-email" name="email" type="email" required autoComplete="email" inputMode="email" className={`field ${err("email") ? "border-festa" : ""}`} />
        {err("email") && <p className="help">{err("email")}</p>}
      </div>
      <PasswordInput autoComplete="new-password" error={err("password")} />
      <label className="flex min-h-12 items-start gap-3 text-sm">
        <input type="checkbox" name="terms" required className="mt-1 h-5 w-5 accent-vira" />
        <span>
          Aceito os <Link href="/termos" target="_blank" className="link">Termos de uso</Link> e a <Link href="/privacidade" target="_blank" className="link">Política de Privacidade</Link>.
        </span>
      </label>
      <label className="flex min-h-10 items-start gap-3 text-sm text-tinta-soft">
        <input type="checkbox" name="marketing" className="mt-1 h-5 w-5 accent-vira" />
        <span>Quero receber dicas e novidades por e-mail (opcional).</span>
      </label>
      <FormMessage state={state && !state.ok && !state.field ? state : state && !state.ok && state.field === "terms" ? state : null} />
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Criando…" : fromQuiz && quiz ? "Ver meu resultado" : "Criar conta"}
      </button>
      <p className="text-center text-sm text-tinta-soft">
        Já tem conta? <Link href="/entrar" className="link">Entrar</Link>
      </p>
      {!quiz && (
        <p className="text-center text-sm text-tinta-soft">
          Ainda não fez o questionário? <Link href="/questionario" className="link">Faça antes, é grátis</Link>
        </p>
      )}
    </form>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="font-display text-2xl font-bold text-noite">Bom te ver de novo</h1>
      {notice && <p className="rounded-xl bg-vira-light px-4 py-3 text-sm text-vira-dark">{notice}</p>}
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="f-email" className="label">E-mail</label>
        <input id="f-email" name="email" type="email" required autoComplete="email" inputMode="email" className="field" />
      </div>
      <PasswordInput autoComplete="current-password" name="password" />
      <FormMessage state={state} />
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/recuperar-senha" className="link">Esqueci minha senha</Link>
        <Link href="/questionario" className="link">Criar conta</Link>
      </div>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, null);
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (state?.ok) setWait(45);
  }, [state]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="font-display text-2xl font-bold text-noite">Recuperar senha</h1>
      <p className="text-sm text-tinta-soft">Mandamos um link para criar uma nova senha. Ele vale por 1 hora.</p>
      <div>
        <label htmlFor="f-email" className="label">E-mail</label>
        <input id="f-email" name="email" type="email" required autoComplete="email" inputMode="email" className="field" />
      </div>
      <FormMessage state={state} />
      <button className="btn-primary w-full" disabled={pending || wait > 0}>
        {wait > 0 ? `Reenviar em 0:${String(wait).padStart(2, "0")}` : state?.ok ? "Reenviar" : "Enviar link"}
      </button>
      <Link href="/entrar" className="link block text-center text-sm">Voltar para entrar</Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAction, null);
  return (
    <form action={action} className="card space-y-4">
      <h1 className="font-display text-2xl font-bold text-noite">Crie uma nova senha</h1>
      <input type="hidden" name="token" value={token} />
      <PasswordInput autoComplete="new-password" label="Nova senha" error={state && !state.ok && state.field === "password" ? state.error : undefined} />
      <PasswordInput name="confirm" autoComplete="new-password" label="Repita a nova senha" error={state && !state.ok && state.field === "confirm" ? state.error : undefined} />
      <FormMessage state={state && !state.ok && !state.field ? state : null} />
      <button className="btn-primary w-full" disabled={pending}>
        Salvar nova senha
      </button>
    </form>
  );
}
