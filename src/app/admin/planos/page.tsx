import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { requireRole } from "@/server/session";
import { getPlans, getBillingSettings } from "@/server/billing/subscriptions";
import { PageTitle, Pill } from "@/components/ui";
import { AdminForm, ActionButton } from "@/components/admin/form";
import { savePlanAction, saveBillingSettingsAction, saveCouponAction, toggleCouponAction, runBillingNowAction } from "@/app/actions/admin";
import { brl } from "@/lib/format";

const money = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

export default async function Page() {
  await requireRole(["admin"]);
  const [plans, s, cps] = await Promise.all([getPlans(false), getBillingSettings(), db.select().from(coupons).orderBy(desc(coupons.createdAt))]);
  const main = plans.find((p) => p.slug === "mensal");
  return (
    <div>
      <PageTitle eyebrow="Plano e preço" title="Preço, promoção e regras de cobrança, sem precisar de programador" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {plans.map((p) => (
            <AdminForm key={p.id} action={savePlanAction} className="card">
              <input type="hidden" name="id" value={p.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input name="name" defaultValue={p.name} className="field max-w-sm font-semibold" aria-label="Nome do plano" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} className="h-5 w-5 accent-vira" /> Ativo no site</label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block"><span className="label">Preço do 1º período (R$)</span><input name="first" defaultValue={money(p.firstPeriodPriceCents)} placeholder="sem promoção" className="field" inputMode="decimal" /></label>
                <label className="block"><span className="label">{p.intervalMonths === 1 ? "Mensalidade" : `Preço a cada ${p.intervalMonths} meses`} (R$)</span><input name="price" defaultValue={money(p.priceCents)} className="field" inputMode="decimal" required /></label>
                <div className="flex items-end"><button className="btn-primary btn-sm w-full">Salvar</button></div>
              </div>
              {!p.active && p.slug !== "mensal" && <p className="mt-2 text-xs text-tinta-soft">Plano preparado (valores de exemplo). Defina os preços antes de ativar.</p>}
            </AdminForm>
          ))}
          <p className="text-sm text-tinta-soft">Novo preço vale para novas assinaturas. Mudar o de quem já assina exige aviso prévio [regra a definir].</p>

          <AdminForm action={saveBillingSettingsAction} className="card">
            <p className="eyebrow mb-3">Regras de cobrança</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block"><span className="label">Aviso antes da 2ª cobrança (dias)</span><input name="noticeDaysBefore" type="number" defaultValue={s.noticeDaysBefore} className="field" /></label>
              <label className="block"><span className="label">Pausar acesso após falha (dias)</span><input name="pauseAfterDays" type="number" defaultValue={s.pauseAfterDays} className="field" /></label>
              <label className="block"><span className="label">Validade do Pix (min)</span><input name="pixExpiresMinutes" type="number" defaultValue={s.pixExpiresMinutes} className="field" /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="promoOnlyFirst" defaultChecked={s.promoOnlyFirstSubscription} className="h-5 w-5 accent-vira" /> Promoção só na 1ª assinatura</label>
            <button className="btn-primary btn-sm mt-4">Salvar regras</button>
          </AdminForm>
        </div>
        <div className="space-y-4">
          {main && (
            <div className="card">
              <p className="eyebrow mb-2">Prévia no site</p>
              <p className="text-sm text-tinta-soft">1º mês</p>
              <p className="font-display text-3xl font-extrabold">{brl(main.firstPeriodPriceCents ?? main.priceCents)}</p>
              <p className="mt-1 text-sm text-tinta-soft">depois</p>
              <p className="font-display text-3xl font-extrabold">{brl(main.priceCents)}/mês</p>
            </div>
          )}
          <div className="card">
            <p className="eyebrow mb-2">Gateway</p>
            <p className="font-semibold">Não configurado · <Pill tone="yellow">Modo {s.gatewayMode === "demo" ? "Demonstração" : "Produção"}</Pill></p>
            <p className="mt-2 text-sm text-tinta-soft">Produção 🔒 só libera com gateway configurado e autorização do dono. Nenhuma cobrança real é feita nesta etapa.</p>
            {s.gatewayMode === "demo" && (
              <div className="mt-3">
                <ActionButton label="Rodar ciclo de cobrança agora" action={runBillingNowAction} />
                <p className="mt-1 text-xs text-tinta-soft">Executa avisos, renovações, pausas e vencimentos de Pix (o mesmo do cron diário).</p>
              </div>
            )}
          </div>
          <div className="card">
            <p className="eyebrow mb-3">Cupons</p>
            <ul className="mb-4 space-y-2 text-sm">
              {cps.map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-2">
                  <span><b>{c.code}</b> · {c.percentOff}% {c.firstPeriodOnly ? "no 1º mês" : "sempre"} · {c.uses} usos</span>
                  <ActionButton label={c.active ? "Desativar" : "Ativar"} action={toggleCouponAction.bind(null, c.code, !c.active)} className="btn-ghost btn-sm" />
                </li>
              ))}
            </ul>
            <AdminForm action={saveCouponAction} className="grid grid-cols-2 gap-2">
              <input name="code" placeholder="CÓDIGO" className="field" aria-label="Código" />
              <input name="percentOff" type="number" placeholder="% off" className="field" aria-label="Desconto" />
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" name="firstPeriodOnly" defaultChecked className="h-5 w-5 accent-vira" /> Só no 1º mês</label>
              <button className="btn-secondary btn-sm col-span-2">+ Novo cupom</button>
            </AdminForm>
          </div>
        </div>
      </div>
    </div>
  );
}
