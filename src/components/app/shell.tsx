"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../ui";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/app", label: "Jornada", icon: "🧭" },
  { href: "/app/oportunidades", label: "Oportunidades", icon: "💡" },
  { href: "/app/missoes", label: "Missões", icon: "🎯" },
  { href: "/app/materiais", label: "Materiais", icon: "✍️" },
  { href: "/app/clientes", label: "Meus clientes", icon: "🤝" },
  { href: "/app/financeiro", label: "Financeiro", icon: "💰" },
  { href: "/app/organize", label: "Organize-se", icon: "📋" },
  { href: "/app/conteudos", label: "Conteúdos", icon: "📚" },
  { href: "/app/conquistas", label: "Conquistas", icon: "🏅" },
  { href: "/app/perfil", label: "Perfil", icon: "👤" },
];
const BOTTOM = [
  { href: "/app", label: "Início", icon: "🧭" },
  { href: "/app/missoes", label: "Missões", icon: "🎯" },
  { href: "/app/clientes", label: "Clientes", icon: "🤝" },
  { href: "/app/mais", label: "Mais", icon: "☰" },
];

function active(path: string, href: string) {
  return href === "/app" ? path === "/app" : path.startsWith(href);
}

export function AppShell({ children, points, activeDays, banner, staff }: { children: React.ReactNode; points: number; activeDays: number; banner?: React.ReactNode; staff: boolean }) {
  const path = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-noite p-5 lg:flex">
        <Logo dark href="/app" />
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Área do usuário">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-[15px] transition ${active(path, n.href) ? "bg-sol font-semibold text-noite" : "text-white/80 hover:bg-white/10"}`}>
              {n.label}
            </Link>
          ))}
          {staff && (
            <Link href="/admin" className="mt-4 rounded-xl px-3 py-2.5 text-[15px] text-sol hover:bg-white/10">
              Painel admin →
            </Link>
          )}
        </nav>
        <form action={logoutAction}>
          <button className="text-sm text-white/60 hover:text-white">Sair</button>
        </form>
      </aside>
      <div className="min-w-0 pb-24 lg:pb-10">
        {banner}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-tinta/5 bg-areia/95 px-4 backdrop-blur lg:hidden">
          <Logo href="/app" />
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span title="Dias com atividade nos últimos 7 dias">🔥 {activeDays}</span>
            <Link href="/app/conquistas">⭐ {points}</Link>
          </div>
        </header>
        <div className="hidden items-center justify-end gap-4 px-8 pt-5 text-sm font-semibold lg:flex">
          <span title="Dias com atividade nos últimos 7 dias">🔥 {activeDays} {activeDays === 1 ? "dia" : "dias"}</span>
          <Link href="/app/conquistas" className="rounded-full bg-sol-light px-3 py-1">⭐ {points}</Link>
        </div>
        <main className="mx-auto max-w-5xl px-4 pt-5 lg:px-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-tinta/10 bg-white lg:hidden" aria-label="Navegação">
        {BOTTOM.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs ${active(path, n.href) ? "font-bold text-vira" : "text-tinta-soft"}`}>
            <span className="text-lg" aria-hidden>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export const MORE_LINKS = NAV.filter((n) => !["/app", "/app/missoes", "/app/clientes"].includes(n.href));
