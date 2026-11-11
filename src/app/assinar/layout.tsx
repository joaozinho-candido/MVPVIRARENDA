import { Logo } from "@/components/ui";
import { getBillingSettings } from "@/server/billing/subscriptions";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await getBillingSettings();
  return (
    <div className="min-h-screen">
      {s.gatewayMode === "demo" && (
        <div className="bg-sol px-4 py-2 text-center text-sm font-semibold text-noite">MODO DEMONSTRAÇÃO · nenhuma cobrança real até o gateway ser configurado</div>
      )}
      <header className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Logo href="/app" />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
    </div>
  );
}
