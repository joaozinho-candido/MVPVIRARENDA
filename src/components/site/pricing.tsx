import Link from "next/link";
import { brl, addMonths, dateBR } from "@/lib/format";

export const INCLUDED = ["Os 6 mentores de IA", "3 oportunidades para você", "Jornada com 14 etapas", "Missões e conquistas", "Textos de venda", "Painel financeiro", "Meus clientes", "Organize seu negócio"];

export function PricingCard({ first, price, months = 1 }: { first: number | null; price: number; months?: number }) {
  const today = first ?? price;
  return (
    <div className="overflow-hidden rounded-[28px] shadow-xl ring-1 ring-black/5 md:grid md:grid-cols-[1.15fr_1fr]">
      <div className="relative bg-noite p-6 text-white sm:p-8">
        <span className="inline-flex rounded-full bg-sol px-3 py-1 text-xs font-bold uppercase tracking-wide text-noite">
          {first != null ? "1º mês promocional" : "Plano Vira Renda"}
        </span>
        <p className="mt-4 font-display text-2xl font-bold">Plano Vira Renda · mensal</p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-vira p-4">
            <p className="text-sm text-white/80">{first != null ? "1º mês" : "Por mês"}</p>
            <p className="font-display text-3xl font-extrabold sm:text-4xl">{brl(today)}</p>
          </div>
          {first != null && (
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-white/80">a partir do 2º mês</p>
              {/* Regra do documento: o valor de depois aparece no mesmo tamanho legível */}
              <p className="font-display text-3xl font-extrabold sm:text-4xl">
                {brl(price)}
                <span className="text-base font-semibold text-white/70">/mês</span>
              </p>
            </div>
          )}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
          {[
            ["Hoje", today],
            [`Em ${30 * months} dias`, price],
            ["Todo mês", price],
          ].map(([l, v], i) => (
            <div key={String(l)} className={`rounded-xl p-2 ${i === 0 ? "bg-sol text-noite" : "bg-white/10"}`}>
              <p className={i === 0 ? "text-noite/70" : "text-white/70"}>{l}</p>
              <p className="font-semibold">{brl(Number(v))}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-white/75">Cobrança mensal no cartão ou Pix. Sem fidelidade: cancele quando quiser. Avisamos por e-mail antes da 2ª cobrança.</p>
        <Link href="/questionario" className="btn-highlight mt-6 w-full text-base sm:w-auto">
          Começar por {brl(today)}
        </Link>
        <p className="mt-2 text-xs text-white/60">Se assinar hoje, a 2ª cobrança seria em {dateBR(addMonths(new Date(), months))}.</p>
      </div>
      <div className="bg-white p-6 sm:p-8">
        <p className="eyebrow mb-4">Tudo incluso</p>
        <ul className="grid gap-3">
          {INCLUDED.map((i) => (
            <li key={i} className="flex items-center gap-3 text-[15px]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vira-light text-sm font-bold text-vira">✓</span>
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
