import Link from "next/link";
import { brl, addMonths, dateBR } from "@/lib/format";

export const INCLUDED = ["Os 6 mentores", "3 oportunidades para você", "Jornada com 14 etapas", "Missões e conquistas", "Textos de venda", "Painel financeiro", "Meus clientes", "Organize seu negócio"];

export function PricingCard({ first, price, months = 1 }: { first: number | null; price: number; months?: number }) {
  const today = first ?? price;
  return (
    <div className="grid gap-6 rounded-card bg-white p-6 shadow-sm ring-1 ring-tinta/5 md:grid-cols-[1fr_1.2fr] md:p-8">
      <div>
        <p className="eyebrow">Plano Vira Renda{first != null ? " · 1º mês promocional" : ""}</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-tinta-soft">{first != null ? "1º mês" : "Por mês"}</p>
            <p className="font-display text-4xl font-extrabold text-noite">{brl(today)}</p>
          </div>
          {first != null && (
            <div>
              <p className="text-sm text-tinta-soft">depois</p>
              {/* Regra do documento: o valor de depois aparece no mesmo tamanho legível */}
              <p className="font-display text-4xl font-extrabold text-noite">
                {brl(price)}
                <span className="text-lg font-semibold text-tinta-soft">/mês</span>
              </p>
            </div>
          )}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-vira-light p-2">
            <p className="text-tinta-soft">Hoje</p>
            <p className="font-semibold">{brl(today)}</p>
          </div>
          <div className="rounded-xl bg-areia p-2">
            <p className="text-tinta-soft">Em {30 * months} dias</p>
            <p className="font-semibold">{brl(price)}</p>
          </div>
          <div className="rounded-xl bg-areia p-2">
            <p className="text-tinta-soft">Todo mês</p>
            <p className="font-semibold">{brl(price)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-tinta-soft">
          Cobrança mensal no cartão ou Pix. Sem fidelidade: cancele quando quiser. Avisamos por e-mail antes da 2ª cobrança.
        </p>
        <Link href="/questionario" className="btn-primary mt-5 w-full sm:w-auto">
          Começar por {brl(today)}
        </Link>
        <p className="mt-2 text-xs text-tinta-soft">Se assinar hoje, a 2ª cobrança seria em {dateBR(addMonths(new Date(), months))}.</p>
      </div>
      <div className="rounded-2xl bg-areia p-5">
        <p className="eyebrow mb-3">Tudo incluso</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {INCLUDED.map((i) => (
            <li key={i} className="flex gap-2">
              <span className="text-vira">✓</span>
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
