import Link from "next/link";
import { Logo } from "../ui";
import { config } from "@/lib/config";
import { CookieSettingsLink } from "./cookie-banner";

export function SiteFooter() {
  const s = config.support;
  return (
    <footer className="bg-noite pb-24 pt-12 text-white/70 md:pb-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo dark />
          <p className="mt-3 text-sm">Seu talento vira renda.</p>
          <p className="mt-3 text-sm">Mentores são IA; suporte é humano.</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Produto">
          <Link href="/#como-funciona" className="hover:text-white">Como funciona</Link>
          <Link href="/planos" className="hover:text-white">Plano</Link>
          <Link href="/#duvidas" className="hover:text-white">Dúvidas</Link>
          <Link href="/questionario" className="hover:text-white">Questionário grátis</Link>
        </nav>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Legal">
          <Link href="/termos" className="hover:text-white">Termos de uso</Link>
          <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
          <Link href="/cookies" className="hover:text-white">Cookies</Link>
          <CookieSettingsLink />
        </nav>
        <div className="text-sm">
          <p>Suporte: {s.email}</p>
          <p>WhatsApp: {s.whatsapp}</p>
          <p className="mt-3">
            {s.company} · CNPJ {s.cnpj}
          </p>
        </div>
      </div>
    </footer>
  );
}
