import Link from "next/link";
import { requireUser, STAFF_ROLES } from "@/server/session";
import { getStats, recentActiveDays } from "@/server/gamification";
import { getCurrentSubscription, getBillingSettings } from "@/server/billing/subscriptions";
import { AppShell } from "@/components/app/shell";
import { ClearQuizDraft } from "@/components/app/clear-draft";
import { dateBR, addDays } from "@/lib/format";
import { getProfile } from "@/server/profile";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser("/app");
  const [stats, days, current, settings, profile] = await Promise.all([getStats(u.id), recentActiveDays(u.id), getCurrentSubscription(u.id), getBillingSettings(), getProfile(u.id)]);
  let banner: React.ReactNode = null;
  const s = current?.sub;
  if (s?.status === "past_due") {
    banner = (
      <div className="bg-sol px-4 py-2.5 text-center text-sm font-medium text-noite">
        🔔 Não conseguimos cobrar sua mensalidade. Atualize o cartão até {dateBR(addDays(s.pastDueSince ?? new Date(), settings.pauseAfterDays))} para manter o acesso.{" "}
        <Link href="/app/perfil?aba=plano" className="underline">Atualizar cartão</Link>
      </div>
    );
  } else if (s?.status === "paused") {
    banner = (
      <div className="bg-sol px-4 py-2.5 text-center text-sm font-medium text-noite">
        Seu acesso está pausado por falta de pagamento. Nada foi apagado. <Link href="/app/perfil?aba=plano" className="underline">Regularizar</Link>
      </div>
    );
  } else if (!u.emailVerified && u.role === "user" && config.requireEmailVerification) {
    banner = (
      <div className="bg-vira-light px-4 py-2.5 text-center text-sm text-vira-dark">
        Confirme seu e-mail para poder assinar. <Link href="/app/perfil" className="underline">Reenviar link</Link>
      </div>
    );
  }
  return (
    <AppShell points={stats.points} activeDays={days} banner={banner} staff={STAFF_ROLES.includes(u.role)}>
      {profile && <ClearQuizDraft />}
      {children}
      <p className="mt-12 text-center text-xs text-tinta-soft">Os mentores são IA. O suporte da conta é feito por pessoas.</p>
    </AppShell>
  );
}
