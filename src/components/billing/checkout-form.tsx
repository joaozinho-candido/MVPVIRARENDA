"use client";
import { useActionState, useState, useTransition } from "react";
import { checkoutAction, quoteAction } from "@/app/actions/billing";
import { FormMessage } from "../ui";

function maskCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function maskExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function CardFields({ errorField, error }: { errorField?: string; error?: string }) {
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cpf, setCpf] = useState("");
  const e = (f: string) => (errorField === f ? <p className="help">{error}</p> : null);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="label" htmlFor="f-number">Número do cartão</label>
        <input id="f-number" name="number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" className="field" value={num} onChange={(ev) => setNum(maskCard(ev.target.value))} />
        {e("number")}
      </div>
      <div>
        <label className="label" htmlFor="f-expiry">Validade</label>
        <input id="f-expiry" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" className="field" value={exp} onChange={(ev) => setExp(maskExpiry(ev.target.value))} />
        {e("expiry")}
      </div>
      <div>
        <label className="label" htmlFor="f-cvv">CVV</label>
        <input id="f-cvv" name="cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="•••" maxLength={4} className="field" />
        {e("cvv")}
      </div>
      <div className="col-span-2">
        <label className="label" htmlFor="f-cpf">CPF do titular</label>
        <input id="f-cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" className="field" value={cpf} onChange={(ev) => setCpf(maskCpf(ev.target.value))} />
        {e("cpf")}
      </div>
    </div>
  );
}

export function CheckoutForm({ first, recurring, nextDate, demo }: { first: string; recurring: string; nextDate: string; demo: boolean }) {
  const [state, action, pending] = useActionState(checkoutAction, null);
  const [method, setMethod] = useState<"card" | "pix">("card");
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState({ first, recurring, nextDate });
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [checking, startCheck] = useTransition();
  const fieldErr = state && !state.ok ? state.field : undefined;

  const summary = (
    <div className="card h-fit">
      <p className="eyebrow">Seu plano</p>
      <p className="mt-2 font-display text-xl font-bold text-noite">Vira Renda · mensal</p>
      <dl className="mt-4 space-y-2 text-[15px]">
        <div className="flex justify-between"><dt>Hoje (1º mês)</dt><dd className="font-semibold">{quote.first}</dd></div>
        <div className="flex justify-between"><dt>A partir de {quote.nextDate}</dt><dd className="font-semibold">{quote.recurring}/mês</dd></div>
      </dl>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-vira">Tem cupom?</summary>
        <div className="mt-2 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="field" placeholder="CUPOM" aria-label="Cupom" />
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={checking || !coupon}
            onClick={() =>
              startCheck(async () => {
                const r = await quoteAction(coupon);
                if (r.ok) {
                  setQuote({ first: r.first, recurring: r.recurring, nextDate: r.nextDate });
                  setCouponMsg("Cupom aplicado.");
                } else setCouponMsg(r.error);
              })
            }
          >
            Aplicar
          </button>
        </div>
        {couponMsg && <p className="mt-1 text-sm text-tinta-soft">{couponMsg}</p>}
      </details>
      <div className="mt-4 flex justify-between border-t border-tinta/10 pt-4 font-display text-lg font-bold">
        <span>Total hoje</span>
        <span>{quote.first}</span>
      </div>
      <p className="mt-3 text-sm text-tinta-soft">Cancele quando quiser, direto no seu perfil.</p>
      <button type="button" className="btn-primary mt-4 w-full md:hidden" onClick={() => setStep(2)}>
        Continuar
      </button>
    </div>
  );

  return (
    <form action={action} className="grid gap-6 md:grid-cols-[1fr_360px]">
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="coupon" value={coupon} />
      <div className={`md:order-2 ${step === 1 ? "" : "hidden md:block"}`}>
        <p className="mb-2 text-sm text-tinta-soft md:hidden">Passo 1 de 2</p>
        {summary}
      </div>
      <div className={`card md:order-1 ${step === 2 ? "" : "hidden md:block"}`}>
        <p className="mb-2 text-sm text-tinta-soft md:hidden">
          <button type="button" className="link" onClick={() => setStep(1)}>← Voltar</button> · Passo 2 de 2
        </p>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-areia p-1" role="tablist" aria-label="Forma de pagamento">
          {(["card", "pix"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={method === m} onClick={() => setMethod(m)} className={`min-h-11 rounded-full text-sm font-semibold ${method === m ? "bg-white shadow-sm" : "text-tinta-soft"}`}>
              {m === "card" ? "Cartão de crédito" : "Pix"}
            </button>
          ))}
        </div>
        {method === "card" ? (
          <>
            <CardFields errorField={fieldErr} error={state && !state.ok ? state.error : undefined} />
            {demo && (
              <p className="mt-3 rounded-xl bg-areia p-3 text-xs text-tinta-soft">
                Demonstração: use 4242 4242 4242 4242 (aprovado) ou 4000 0000 0000 0002 (recusado), validade futura, qualquer CVV e um CPF válido (ex.: 529.982.247-25).
              </p>
            )}
          </>
        ) : (
          <p className="rounded-2xl bg-areia p-4 text-[15px]">
            Geramos um código Pix válido por alguns minutos. A tela confere sozinha quando o pagamento entrar.
            <br />
            <span className="text-sm text-tinta-soft">Pix mensal depende de o gateway ter Pix recorrente; sem isso, enviamos um novo código a cada mês.</span>
          </p>
        )}
        <label className="mt-5 flex items-start gap-3 text-[15px]">
          <input type="checkbox" name="accepted" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-vira" />
          <span>
            Entendi: hoje pago <b>{quote.first}</b> e, a partir de <b>{quote.nextDate}</b>, <b>{quote.recurring} por mês</b>, até eu cancelar.
          </span>
        </label>
        {state && !state.ok && !["number", "expiry", "cvv", "cpf"].includes(state.field ?? "") && <div className="mt-4"><FormMessage state={state} /></div>}
        <button className="btn-primary mt-5 w-full" disabled={!accepted || pending}>
          {pending ? "Processando…" : method === "card" ? `Pagar ${quote.first}` : `Gerar Pix de ${quote.first}`}
        </button>
        <p className="mt-3 text-center text-sm text-tinta-soft">🔒 Pagamento por {demo ? "gateway de demonstração" : "[gateway]"}</p>
      </div>
    </form>
  );
}
