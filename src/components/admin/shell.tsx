"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/db/schema";
import { LogoMark } from "../logo-mark";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin", label: "Visão geral", roles: ["admin"] },
  { href: "/admin/compras", label: "Compras", roles: ["admin"] },
  { href: "/admin/usuarios", label: "Assinantes e usuários", roles: ["admin"] },
  { href: "/admin/planos", label: "Plano e preço", roles: ["admin"] },
  { href: "/admin/oportunidades", label: "Oportunidades", roles: ["admin", "editor"] },
  { href: "/admin/missoes", label: "Missões", roles: ["admin", "editor"] },
  { href: "/admin/conteudos", label: "Conteúdos", roles: ["admin", "editor"] },
  { href: "/admin/revisao", label: "Revisão jurídica", roles: ["admin", "editor", "reviewer"] },
  { href: "/admin/selos", label: "Selos e pontos", roles: ["admin"] },
  { href: "/admin/indicadores", label: "Indicadores de uso", roles: ["admin"] },
  { href: "/admin/lgpd", label: "LGPD e auditoria", roles: ["admin"] },
];

export function AdminShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const path = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="bg-noite p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:p-5">
        <div className="flex items-center justify-between gap-2 lg:block">
          <p className="flex items-center gap-2 whitespace-nowrap font-display text-xl font-extrabold"><LogoMark size={28} className="rounded-[7px] ring-1 ring-white/25" /><span><span className="text-[#5BE09A]">vira</span> admin</span></p>
          <span className="text-xs text-white/60 lg:mt-1 lg:block">{name} · {{ admin: "Administrador", editor: "Editor", reviewer: "Revisor", user: "" }[role]}</span>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:overflow-visible" aria-label="Admin">
          {items.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`shrink-0 rounded-xl px-3 py-2 text-sm ${isActive(n.href) ? "bg-sol font-semibold text-noite" : "text-white/80 hover:bg-white/10"}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/app" className="shrink-0 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/10 lg:mt-6">← Área do usuário</Link>
        </nav>
      </aside>
      <main className="min-w-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}
